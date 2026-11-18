import { Router } from 'express';
import { z } from 'zod';
import { ACTIVITY } from '../audit.js';
import { getDb } from '../db.js';
import { requireAdmin } from '../security.js';

/** Admin: the security activity log (logins, failed logins, logouts, password changes), newest first. */
const r = Router();
r.use(requireAdmin);

const Query = z.object({
  email: z.string().trim().toLowerCase().max(120).optional(),
  type: z.enum(Object.values(ACTIVITY)).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

r.get('/', async (req, res) => {
  const q = Query.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: 'Invalid filter.' });
  const { email, type, limit } = q.data;
  const db = await getDb();
  const list = await db
    .collection('activity')
    .find({ ...(email ? { email } : {}), ...(type ? { type } : {}) }, { projection: { _id: 0 } })
    .sort({ at: -1 })
    .limit(limit)
    .toArray();
  res.json(list);
});

export default r;
