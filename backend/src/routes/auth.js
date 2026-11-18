import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ACTIVITY, logActivity } from '../audit.js';
import { clearRateLimit, clearSession, clientIp, issueSession, rateLimit, readSession, requireAdmin } from '../security.js';

const r = Router();
const Login = z.object({ email: z.string().trim().toLowerCase().email().max(120), password: z.string().min(1).max(200) });

// compared against when the email is unknown, so a wrong email and a wrong password take the same time
let dummyHash = null;
const DUMMY = () => (dummyHash ??= bcrypt.hashSync('not-a-real-password', 12));

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
  const admin = await db.collection('admins').findOne({ email, active: { $ne: false } });
  const ok = await bcrypt.compare(password, admin?.passwordHash || DUMMY());
  if (!admin || !ok) {
    await logActivity(ACTIVITY.LOGIN_FAILED, { email, name: admin?.name, req, note: admin ? 'Wrong password' : 'No admin with this email' });
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  await clearRateLimit(key);
  await db.collection('admins').updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date().toISOString() } });
  await logActivity(ACTIVITY.LOGIN, { email: admin.email, name: admin.name, req });
  issueSession(res, admin);
  return res.json({ email: admin.email, name: admin.name });
});

r.post('/logout', async (req, res) => {
  const who = readSession(req);
  if (who) await logActivity(ACTIVITY.LOGOUT, { email: who.email, name: who.name, req });
  clearSession(res);
  res.json({ ok: true });
});

r.get('/me', requireAdmin, (req, res) => res.json({ email: req.admin.email, name: req.admin.name }));

export default r;
