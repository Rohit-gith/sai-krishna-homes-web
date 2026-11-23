import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { ACTIVITY, logActivity } from '../audit.js';
import { getDb } from '../db.js';
import { DEFAULT_PERMISSIONS, PERMISSIONS, PERMISSION_IDS, ROLES, TITLES, allowedFor, isManager } from '../permissions.js';
import { requireAdmin, requirePerm } from '../security.js';
import { cleanUserView } from '../clientView.js';

/*
 * The CRM team. Owner: creates staff logins, sets their permissions, switches them active/inactive,
 * resets their passwords. Fidelsya (superowner): all of that on every account, the owner's included,
 * and is invisible to the owner. Management (CMO, GM) with "Manage staff": the same, for sales and
 * site visit executives only; the owner manages Management. Every change is kept on the account
 * (history) and in "activity".
 */
const r = Router();
r.use(requireAdmin, requirePerm('team.manage'));

const HIDE = { passwordHash: 0 };
const now = () => new Date().toISOString();
const who = (u) => ({ email: u.email, name: u.name, role: u.role });
// Fidelsya stays invisible to the client: whatever Fidelsya did is removed from what the owner sees
const view = (u, actor) => (actor?.role === 'superowner' ? fullView(u) : cleanUserView(fullView(u)));
const fullView = (u) => ({
  id: String(u._id),
  email: u.email,
  name: u.name,
  title: u.title || '',
  designation: u.designation || '',
  phone: u.phone || '',
  role: u.role || 'owner',
  roleLabel: ROLES[u.role || 'owner']?.label || u.role,
  permissions: u.permissions || [],
  active: u.active !== false,
  createdAt: u.createdAt || null,
  createdBy: u.createdBy || null,
  lastLoginAt: u.lastLoginAt || null,
  passwordChangedAt: u.passwordChangedAt || null,
  history: u.history || [], // newest first
});

const strongPassword = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(100)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Password must have letters and numbers');
const perms = z.array(z.enum(PERMISSION_IDS)).max(PERMISSION_IDS.length);

const STAFF = ['sales', 'site_visit'];
/** Which accounts may this person manage? */
function canManage(actor, target) {
  if (!target) return false;
  if (actor.role === 'superowner') return true; // Fidelsya: everyone (but itself is guarded per action)
  // owners manage Management and staff; one owner can't edit, deactivate or reset another owner (only
  // Fidelsya can), so co-owners can never lock each other out
  if (actor.role === 'owner') return target.role !== 'superowner' && target.role !== 'owner';
  // Management: sales and site visit executives only (never the owner or each other)
  return STAFF.includes(target.role);
}
/** Roles this person may give when creating or changing an account. */
const rolesFor = (actor) => (isManager(actor) ? ['owner', 'management', ...STAFF] : STAFF);
/**
 * Keep only permissions the role can hold; Management can only pass on what they have themselves,
 * so nobody can hand out more power than they were given.
 */
const grantable = (actor, role, list) => {
  const ok = allowedFor(role);
  return [...new Set(list)].filter((p) => ok.includes(p) && (isManager(actor) || (actor.permissions || []).includes(p)));
};
const visibleFilter = (actor) => (actor.role === 'superowner' ? {} : { role: { $ne: 'superowner' } });

async function findTarget(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    res.status(404).json({ error: 'User not found.' });
    return null;
  }
  const db = await getDb();
  const u = await db.collection('admins').findOne({ _id: new ObjectId(req.params.id) }, { projection: HIDE });
  if (!u || (req.admin.role !== 'superowner' && u.role === 'superowner')) {
    res.status(404).json({ error: 'User not found.' });
    return null;
  }
  return u;
}

/** Roles, permissions and their labels, for building the Team screen. */
r.get('/meta', (req, res) => {
  const roles = Object.entries(ROLES)
    .filter(([id]) => id !== 'superowner')
    .map(([id, v]) => ({ id, label: v.label, defaultPermissions: DEFAULT_PERMISSIONS[id] || [], allowed: allowedFor(id) }));
  // which roles this person may create (Management can add only sales and site visit executives)
  res.json({ roles, permissions: PERMISSIONS, canCreate: rolesFor(req.admin) });
});

r.get('/', async (req, res) => {
  const db = await getDb();
  const list = await db.collection('admins').find(visibleFilter(req.admin), { projection: HIDE }).toArray();
  const order = { superowner: 0, owner: 1, management: 2, sales: 3, site_visit: 4 };
  list.sort((a, b) => (order[a.role || 'owner'] ?? 9) - (order[b.role || 'owner'] ?? 9) || a.name.localeCompare(b.name));
  res.json(list.map((u) => view(u, req.admin)));
});

r.get('/:id', async (req, res) => {
  const u = await findTarget(req, res);
  if (u) res.json(view(u, req.admin));
});

const Create = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(120),
    phone: z.union([z.literal(''), z.string().trim().regex(/^[6-9]\d{9}$/)]).default(''),
    title: z.enum(TITLES).default(''),
    designation: z.string().trim().max(40).default(''), // e.g. "CMO", "GM"
    role: z.enum(['owner', 'management', 'sales', 'site_visit']),
    password: strongPassword,
    permissions: perms.optional(),
  })
  .strict();

r.post('/', async (req, res) => {
  const p = Create.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Please check the details.' });
  const d = p.data;
  if (!rolesFor(req.admin).includes(d.role)) return res.status(403).json({ error: 'Only the owner can add an owner or a Management account.' });
  // an owner may add another owner (a partner / family member) with the same full access; it's recorded who did it
  const db = await getDb();
  if (await db.collection('admins').findOne({ email: d.email })) return res.status(409).json({ error: 'A user with this email already exists.' });

  const at = now();
  const by = who(req.admin);
  const permissions = d.role === 'owner' ? [] : grantable(req.admin, d.role, d.permissions ?? DEFAULT_PERMISSIONS[d.role] ?? []);
  const doc = {
    email: d.email,
    name: d.name,
    title: d.title,
    designation: d.designation,
    phone: d.phone,
    role: d.role,
    permissions,
    active: true,
    passwordHash: await bcrypt.hash(d.password, 12),
    passwordChangedAt: at,
    createdAt: at,
    createdBy: by,
    updatedAt: at,
    history: [{ at, by, action: 'created', role: d.role, permissions }],
  };
  const { insertedId } = await db.collection('admins').insertOne(doc);
  await logActivity(ACTIVITY.ADMIN_CREATED, { ...by, req, target: { email: d.email, name: d.name, role: d.role }, changes: { permissions } });
  const { passwordHash, ...safe } = doc;
  return res.status(201).json(view({ _id: insertedId, ...safe }, req.admin));
});

const Update = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.union([z.literal(''), z.string().trim().regex(/^[6-9]\d{9}$/)]).optional(),
    title: z.enum(TITLES).optional(),
    designation: z.string().trim().max(40).optional(),
    role: z.enum(['management', 'sales', 'site_visit']).optional(),
    permissions: perms.optional(),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

r.patch('/:id', async (req, res) => {
  const p = Update.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Please check the details.' });
  const target = await findTarget(req, res);
  if (!target) return undefined;
  if (!canManage(req.admin, target)) return res.status(403).json({ error: 'You cannot change this account.' });
  const { note, ...d } = p.data;
  const staff = ROLES[target.role]?.staff;
  if ((d.role || d.permissions) && !staff) return res.status(400).json({ error: 'Roles and permissions apply to staff only.' });
  if (d.role && !rolesFor(req.admin).includes(d.role)) return res.status(403).json({ error: 'Only the owner can make someone Management.' });
  const role = d.role || target.role;
  // a new role keeps only the permissions it can hold (e.g. Management → Sales drops owner-level powers)
  if (d.role && d.role !== target.role && !d.permissions) d.permissions = (target.permissions || []).filter((x) => allowedFor(role).includes(x));
  if (d.permissions) {
    // Management can't take away (or give) a permission they don't have themselves
    const kept = isManager(req.admin) ? [] : (target.permissions || []).filter((x) => !(req.admin.permissions || []).includes(x) && allowedFor(role).includes(x));
    d.permissions = [...new Set([...grantable(req.admin, role, d.permissions), ...kept])];
  }

  const set = {};
  const changes = {};
  for (const k of ['name', 'title', 'designation', 'phone', 'role']) {
    if (d[k] !== undefined && d[k] !== (target[k] || '')) {
      set[k] = d[k];
      changes[k] = { from: target[k] || '', to: d[k] };
    }
  }
  if (d.permissions) {
    const before = target.permissions || [];
    const added = d.permissions.filter((x) => !before.includes(x));
    const removed = before.filter((x) => !d.permissions.includes(x));
    if (added.length || removed.length) {
      set.permissions = [...new Set(d.permissions)];
      changes.permissions = { added, removed };
    }
  }
  if (!Object.keys(set).length) return res.json(view(target, req.admin));

  const at = now();
  const by = who(req.admin);
  const db = await getDb();
  const updated = await db.collection('admins').findOneAndUpdate(
    { _id: target._id },
    { $set: { ...set, updatedAt: at }, $push: { history: { $each: [{ at, by, action: 'updated', changes, note }], $position: 0 } } },
    { returnDocument: 'after', projection: HIDE },
  );
  await logActivity(ACTIVITY.USER_UPDATED, { ...by, req, target: who(target), changes, note });
  return res.json(view(updated, req.admin));
});

const Status = z.object({ active: z.boolean(), note: z.string().trim().max(300).default('') }).strict();

r.patch('/:id/status', async (req, res) => {
  const p = Status.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid request.' });
  const target = await findTarget(req, res);
  if (!target) return undefined;
  if (target.email === req.admin.email) return res.status(400).json({ error: 'You cannot change your own account.' });
  if (!canManage(req.admin, target)) return res.status(403).json({ error: 'You cannot change this account.' });
  const { active, note } = p.data;
  if ((target.active !== false) === active) return res.json(view(target, req.admin));

  const db = await getDb();
  if (!active && target.role === 'owner') {
    const owners = await db.collection('admins').countDocuments({ role: 'owner', active: { $ne: false } });
    if (owners <= 1) return res.status(400).json({ error: 'At least one owner must stay active.' });
  }
  const at = now();
  const by = who(req.admin);
  const updated = await db.collection('admins').findOneAndUpdate(
    { _id: target._id },
    {
      $set: { active, updatedAt: at, statusChangedAt: at, statusChangedBy: by },
      $push: { history: { $each: [{ at, by, action: active ? 'activated' : 'deactivated', note }], $position: 0 } },
    },
    { returnDocument: 'after', projection: HIDE },
  );
  await logActivity(active ? ACTIVITY.USER_ACTIVATED : ACTIVITY.USER_DEACTIVATED, { ...by, req, target: who(target), note });
  return res.json(view(updated, req.admin));
});

const Reset = z.object({ password: strongPassword, note: z.string().trim().max(300).default('') }).strict();

/** Set a new password for someone else (they are logged out everywhere). */
r.post('/:id/password', async (req, res) => {
  const p = Reset.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Invalid password.' });
  const target = await findTarget(req, res);
  if (!target) return undefined;
  if (target.email === req.admin.email) return res.status(400).json({ error: 'Use "Change my password" for your own account.' });
  if (!canManage(req.admin, target)) return res.status(403).json({ error: 'You cannot change this account.' });

  const at = now();
  const by = who(req.admin);
  const db = await getDb();
  await db.collection('admins').updateOne(
    { _id: target._id },
    {
      $set: { passwordHash: await bcrypt.hash(p.data.password, 12), passwordChangedAt: at, updatedAt: at },
      $inc: { sessionVersion: 1 }, // logs them out everywhere
      $push: { history: { $each: [{ at, by, action: 'password_reset', note: p.data.note }], $position: 0 } },
    },
  );
  await logActivity(ACTIVITY.PASSWORD_RESET, { ...by, req, target: who(target), note: p.data.note });
  return res.json({ ok: true });
});

export default r;
