import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '../db.js';
import { clearRateLimit, clearSession, clientIp, issueSession, rateLimit, requireAdmin } from '../security.js';

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
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' });
  }
  const db = await getDb();
  const admin = await db.collection('admins').findOne({ email, active: { $ne: false } });
  const ok = await bcrypt.compare(password, admin?.passwordHash || DUMMY());
  if (!admin || !ok) return res.status(401).json({ error: 'Incorrect email or password.' });

  await clearRateLimit(key);
  await db.collection('admins').updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date().toISOString() } });
  issueSession(res, admin);
  return res.json({ email: admin.email, name: admin.name });
});

r.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

r.get('/me', requireAdmin, (req, res) => res.json({ email: req.admin.email, name: req.admin.name }));

export default r;
