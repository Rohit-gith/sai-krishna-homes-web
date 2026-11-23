import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ACTIVITY, deviceIdOf, logActivity } from '../audit.js';
import { ROLES, TITLES } from '../permissions.js';
import { clearRateLimit, clearSession, clientIp, issueSession, rateLimit, readSession, requireAdmin } from '../security.js';

const r = Router();
const Login = z.object({ email: z.string().trim().toLowerCase().email().max(120), password: z.string().min(1).max(200) });

// compared against when the email is unknown, so a wrong email and a wrong password take the same time
let dummyHash = null;
const DUMMY = () => (dummyHash ??= bcrypt.hashSync('not-a-real-password', 12));

/** What the browser needs to know about the signed-in person (never the password hash). */
const me = (u) => ({
  email: u.email,
  name: u.name,
  title: u.title || '',
  designation: u.designation || '',
  role: u.role || 'owner',
  roleLabel: ROLES[u.role || 'owner']?.label || u.role,
  permissions: u.permissions || [],
});

r.post('/login', async (req, res) => {
  const p = Login.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Enter your email and password.' });
  const { email, password } = p.data;
  const key = `login:${clientIp(req)}:${email}`;
  if (!(await rateLimit(key, 6, 900))) {
    await logActivity(ACTIVITY.LOGIN_BLOCKED, { email, req, note: 'Too many attempts (6 in 15 min)' });
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' });
  }
  const db = await getDb();
  const admin = await db.collection('admins').findOne({ email });
  const ok = await bcrypt.compare(password, admin?.passwordHash || DUMMY());
  if (!admin || !ok) {
    await logActivity(ACTIVITY.LOGIN_FAILED, { email, name: admin?.name, req, note: admin ? 'Wrong password' : 'No account with this email' });
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  // only said after a correct password, so it never reveals which emails have accounts
  if (admin.active === false) {
    await logActivity(ACTIVITY.LOGIN_FAILED, { email, name: admin.name, req, note: 'Account inactive' });
    return res.status(403).json({ error: 'Your account is inactive. Please contact the owner.' });
  }

  await clearRateLimit(key);
  await db.collection('admins').updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date().toISOString() } });
  // first time this person signs in from this browser? tag it "New device" in the activity log
  const deviceId = deviceIdOf(req);
  const seen = deviceId && (await db.collection('activity').findOne({ type: ACTIVITY.LOGIN, email: admin.email, deviceId }, { projection: { _id: 1 } }));
  await logActivity(ACTIVITY.LOGIN, { email: admin.email, name: admin.name, req, newDevice: !!deviceId && !seen });
  issueSession(res, admin);
  return res.json(me(admin));
});

r.post('/logout', async (req, res) => {
  const who = readSession(req);
  if (who) await logActivity(ACTIVITY.LOGOUT, { email: who.email, name: who.name, req });
  clearSession(res);
  res.json({ ok: true });
});

r.get('/me', requireAdmin, (req, res) => res.json(me(req.admin)));

/** Anyone signed in can choose how they are addressed (Mr. / Mrs. / Ms. / Dr. / none). Recorded. */
r.patch('/me', requireAdmin, async (req, res) => {
  const p = z.object({ title: z.enum(TITLES) }).strict().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose Mr., Mrs., Ms., Dr. or none.' });
  const { title } = p.data;
  if (title === (req.admin.title || '')) return res.json(me(req.admin));
  const db = await getDb();
  const at = new Date().toISOString();
  const by = { email: req.admin.email, name: req.admin.name, role: req.admin.role };
  const changes = { title: { from: req.admin.title || '', to: title } };
  await db
    .collection('admins')
    .updateOne({ email: req.admin.email }, { $set: { title, updatedAt: at }, $push: { history: { $each: [{ at, by, action: 'updated', changes, note: 'Changed by themselves' }], $position: 0 } } });
  await logActivity(ACTIVITY.USER_UPDATED, { ...by, req, target: by, changes, note: 'Changed by themselves' });
  return res.json(me({ ...req.admin, title }));
});

const Change = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(10, 'New password must be at least 10 characters')
      .max(100)
      .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'New password must have letters and numbers'),
  })
  .strict();

/** Anyone signed in can change their own password (needs the current one). Other sessions are logged out. */
r.post('/change-password', requireAdmin, async (req, res) => {
  const p = Change.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Invalid password.' });
  const db = await getDb();
  const user = await db.collection('admins').findOne({ email: req.admin.email });
  if (!(await bcrypt.compare(p.data.currentPassword, user.passwordHash))) {
    await logActivity(ACTIVITY.LOGIN_FAILED, { email: user.email, name: user.name, req, note: 'Wrong current password on change-password' });
    return res.status(400).json({ error: 'Your current password is not correct.' });
  }
  if (p.data.currentPassword === p.data.newPassword) return res.status(400).json({ error: 'Choose a password different from the current one.' });
  const at = new Date().toISOString();
  await db.collection('admins').updateOne(
    { _id: user._id },
    {
      $set: { passwordHash: await bcrypt.hash(p.data.newPassword, 12), passwordChangedAt: at, updatedAt: at },
      $inc: { sessionVersion: 1 }, // other devices are logged out
      $push: { history: { $each: [{ at, by: { email: user.email, name: user.name, role: user.role || 'owner' }, action: 'password_changed' }], $position: 0 } },
    },
  );
  await logActivity(ACTIVITY.PASSWORD_CHANGED, { email: user.email, name: user.name, req });
  issueSession(res, { ...user, sessionVersion: (user.sessionVersion || 0) + 1 }); // this browser stays signed in
  return res.json({ ok: true });
});

export default r;
