import jwt from 'jsonwebtoken';
import { getDb } from './db.js';

export const COOKIE = 'skh_admin';
const SESSION_HOURS = 8;

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET must be set (at least 32 characters)');
  return s;
};

export function issueSession(res, admin) {
  const token = jwt.sign({ sub: String(admin._id), email: admin.email, name: admin.name }, secret(), {
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

/** Admin-only routes: a valid session cookie is required. */
export function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Please log in.' });
    req.admin = jwt.verify(token, secret());
    return next();
  } catch {
    clearSession(res);
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

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
