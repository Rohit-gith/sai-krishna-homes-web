import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '../db.js';
import { sendLeadAlert } from '../mail.js';
import { clientIp, rateLimit, requireAdmin } from '../security.js';

const r = Router();
const strip = ({ _id, ...doc }) => doc;

const str = (max) => z.string().trim().max(max);
const EnquiryIn = z.object({
  form: str(120).min(2),
  name: str(80).min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone'),
  email: z.union([z.literal(''), z.string().trim().email().max(120)]).default(''),
  interest: str(160).default(''),
  message: str(1500).default(''),
  visitAt: z.string().datetime().optional(),
  page: str(200).optional(),
  website: z.string().optional(), // honeypot: real visitors never fill this hidden field
});

/** Public: every website form posts here. */
r.post('/', async (req, res) => {
  const parsed = EnquiryIn.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the details and try again.' });
  const { website, ...data } = parsed.data;
  if (website) return res.status(201).json({ ok: true }); // bot: pretend success, store nothing

  const ip = clientIp(req);
  if (!(await rateLimit(`enq:${ip}`, 8, 600))) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
  }

  const db = await getDb();
  const enquiry = { id: randomUUID(), at: new Date().toISOString(), read: false, ...data };
  await db.collection('enquiries').insertOne({ ...enquiry });

  // email the owner; a mail problem must never lose the enquiry
  let mailed = false;
  try {
    mailed = !!(await sendLeadAlert(enquiry)).sent;
  } catch (e) {
    console.error('lead alert failed:', e.message);
  }
  return res.status(201).json({ ok: true, mailed });
});

/** Admin: list, mark read / converted, delete. */
r.get('/', requireAdmin, async (_req, res) => {
  const db = await getDb();
  const list = await db.collection('enquiries').find({}).sort({ at: -1 }).limit(2000).toArray();
  res.json(list.map(strip));
});

const Patch = z.object({ read: z.boolean().optional(), leadId: z.string().max(20).optional() }).strict();

r.patch('/:id', requireAdmin, async (req, res) => {
  const p = Patch.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid update.' });
  const db = await getDb();
  const doc = await db
    .collection('enquiries')
    .findOneAndUpdate({ id: req.params.id }, { $set: p.data }, { returnDocument: 'after' });
  if (!doc) return res.status(404).json({ error: 'Enquiry not found.' });
  return res.json(strip(doc));
});

r.delete('/:id', requireAdmin, async (req, res) => {
  const db = await getDb();
  await db.collection('enquiries').deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

export default r;
