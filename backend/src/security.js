import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import { can } from './permissions.js';

export const COOKIE = 'skh_admin';
const SESSION_HOURS = 8;

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET must be set (at least 32 characters)');
  return s;
};

export function issueSession(res, admin) {
  // v = the account's session version: bumped on every password change/reset, which ends older sessions
  const token = jwt.sign({ sub: String(admin._id), email: admin.email, name: admin.name, v: admin.sessionVersion || 0 }, secret(), {
    expiresIn: `${SESSION_HOURS}h`,
  });
  res.cookie(COOKIE, token, {
    httpOnly: true, // not readable by page scripts
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_HOURS * 3600 * 1000,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

/** Who is logged in (or null), without rejecting the request. */
export function readSession(req) {
  try {
    const token = req.cookies?.[COOKIE];
    return token ? jwt.verify(token, secret()) : null;
  } catch {
    return null;
  }
}

/**
 * CRM routes: a valid session cookie AND an account that still exists and is active.
 * The account (role, permissions, active) is read from the database on every request, so a change
 * by the owner takes effect at once, e.g. deactivating someone logs them out immediately.
 * Sets req.admin = { id, email, name, role, permissions }.
 */
export async function requireAdmin(req, res, next) {
  let session;
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Please log in.' });
    session = jwt.verify(token, secret());
  } catch {
    clearSession(res);
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
  try {
    const db = await getDb();
    const user = await db.collection('admins').findOne({ email: session.email }, { projection: { passwordHash: 0 } });
    if (!user) {
      clearSession(res);
      return res.status(401).json({ error: 'Your account no longer exists. Please contact the owner.' });
    }
    if (user.active === false) {
      clearSession(res);
      return res.status(401).json({ error: 'Your account has been deactivated. Please contact the owner.' });
    }
    // a password change / reset ends every session that started before it
    if ((session.v || 0) !== (user.sessionVersion || 0)) {
      clearSession(res);
      return res.status(401).json({ error: 'Your password was changed. Please log in again.' });
    }
    req.admin = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      title: user.title || '',
      designation: user.designation || '',
      role: user.role || 'owner', // accounts made before roles existed were the owner and Fidelsya
      permissions: user.permissions || [],
    };
    // who is written on business records (leads, attempts, visits): Fidelsya shows as "Support team"
    // there, so the client never sees Fidelsya's people; the activity log keeps the real account.
    req.actor =
      req.admin.role === 'superowner'
        ? { email: 'support', name: 'Support team', role: 'superowner' }
        : { email: req.admin.email, name: req.admin.name, role: req.admin.role };
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Use after requireAdmin: only these roles may continue. */
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.admin?.role) ? next() : res.status(403).json({ error: 'You do not have access to this.' });

/** Use after requireAdmin: the user needs this permission (owner and Fidelsya have all). */
export const requirePerm = (permission) => (req, res, next) =>
  can(req.admin, permission)
    ? next()
    : res.status(403).json({ error: 'You do not have permission for this. Please ask the owner.' });

/** The website reaches the API through its own /api proxy, so the browser's Origin is the website's address. */
function originAllowed(origin, req) {
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  if (host === req.get('host')) return true;
  const list = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  return list.includes(origin.replace(/\/$/, ''));
}

/**
 * Changes must come from our own pages. Together with the SameSite cookie and JSON-only bodies
 * this blocks cross-site request forgery.
 */
export function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !originAllowed(origin, req)) return res.status(403).json({ error: 'Request blocked.' });
  if (!req.is('application/json')) return res.status(415).json({ error: 'JSON body required.' });
  return next();
}

export const clientIp = (req) =>
  (req.get('x-forwarded-for') || '').split(',')[0].trim() || req.get('x-real-ip') || req.socket?.remoteAddress || 'unknown';

/*
 * The IP written in the activity log. Live, the host (Vercel) passes the visitor's real internet IP
 * in x-forwarded-for, so that is used as it is. When the server runs on the same computer or home
 * network as the person (local testing), the request carries no such header and only says "::1" /
 * "192.168.x.x"; that network's real internet IP is then looked up once and reused for 10 minutes.
 */
const LOCAL = /^(::1|::ffff:127\.|127\.|::ffff:10\.|10\.|::ffff:192\.168\.|192\.168\.|::ffff:172\.(1[6-9]|2\d|3[01])\.|172\.(1[6-9]|2\d|3[01])\.|f[cd]|fe80)/i;
const IP_SERVICES = ['https://api.ipify.org', 'https://icanhazip.com'];
let netIp = { value: null, at: 0, pending: null };

async function lookupNetworkIp() {
  for (const url of IP_SERVICES) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      const ip = (await res.text()).trim();
      if (res.ok && /^[\d.:a-f]{3,45}$/i.test(ip)) return ip;
    } catch {
      /* try the next one */
    }
  }
  return null;
}

export async function logIp(req) {
  const ip = clientIp(req);
  const forwarded = req.get('x-forwarded-for') || req.get('x-real-ip');
  // tests never go to the internet; anything that came through the host's proxy is already real
  if (forwarded || !LOCAL.test(ip) || process.env.NODE_TEST_CONTEXT || process.env.NODE_ENV === 'test') return ip;
  if (netIp.value && Date.now() - netIp.at < 10 * 60 * 1000) return netIp.value;
  netIp.pending ??= lookupNetworkIp().finally(() => (netIp.pending = null));
  const found = await netIp.pending;
  if (found) netIp = { value: found, at: Date.now(), pending: null };
  return found || ip;
}

/** Allow at most `max` hits per `key` in the last `windowSec` seconds (stored in MongoDB, works across instances). */
export async function rateLimit(key, max, windowSec) {
  const db = await getDb();
  const col = db.collection('ratelimits');
  const since = new Date(Date.now() - windowSec * 1000);
  const n = await col.countDocuments({ key, at: { $gte: since } });
  if (n >= max) return false;
  await col.insertOne({ key, at: new Date() });
  return true;
}

export async function clearRateLimit(key) {
  const db = await getDb();
  await db.collection('ratelimits').deleteMany({ key });
}
