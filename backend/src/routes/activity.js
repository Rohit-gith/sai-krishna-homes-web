import { Router } from 'express';
import { z } from 'zod';
import { ACTIVITY } from '../audit.js';
import { getDb } from '../db.js';
import { requireAdmin, requirePerm } from '../security.js';

/**
 * The activity log (logins, failed logins, logouts, accounts created, permission / status / password
 * changes), newest first. Fidelsya sees everything; the owner sees everything except Fidelsya's own
 * accounts; Management sees it when the owner allows ("See the activity log"); staff can't see it.
 */
const r = Router();
r.use(requireAdmin, requirePerm('activity.view'));

const Query = z.object({
  email: z.string().trim().toLowerCase().max(120).optional(), // who did it, or who it was done to
  type: z.enum(Object.values(ACTIVITY)).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(300),
});

r.get('/', async (req, res) => {
  const q = Query.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: 'Invalid filter.' });
  const { email, type, from, to, limit } = q.data;
  const db = await getDb();
  const and = [];
  if (email) and.push({ $or: [{ email }, { 'target.email': email }] });
  if (type) and.push({ type });
  if (from || to) and.push({ at: { ...(from ? { $gte: new Date(from).toISOString() } : {}), ...(to ? { $lte: new Date(to).toISOString() } : {}) } });
  const client = req.admin.role !== 'superowner';
  if (client) {
    // Fidelsya stays invisible to the client: its accounts, and anything Fidelsya ran from the command line
    const hidden = (await db.collection('admins').find({ role: 'superowner' }, { projection: { email: 1 } }).toArray()).map((a) => a.email);
    hidden.push('script');
    and.push({ email: { $nin: hidden } }, { 'target.email': { $nin: hidden } });
  }
  const list = await db
    .collection('activity')
    .find(and.length ? { $and: and } : {}, { projection: { _id: 0 } })
    .sort({ at: -1 })
    .limit(limit)
    .toArray();
  // older records kept "by: Fidelsya (...)" as text; never send that to the client
  if (client) for (const a of list) if (a.by && /fidelsya|script/i.test(String(a.by))) delete a.by;
  res.json(list);
});

export default r;
