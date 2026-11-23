import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ACTIVITY, logActivity } from '../audit.js';
import { getDb } from '../db.js';
import { can } from '../permissions.js';
import { sendLeadAlert } from '../mail.js';
import { clientIp, rateLimit, requireAdmin, requirePerm } from '../security.js';

const admin = [requireAdmin, requirePerm('enquiries.view')];

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
  // "Find your home in 3 taps": what the visitor chose and what we suggested
  finder: z
    .object({
      people: str(60).default(''),
      budget: str(60).default(''),
      need: str(60).default(''),
      suggestion: str(120).default(''),
    })
    .strict()
    .optional(),
  website: z.string().optional(), // honeypot: real visitors never fill this hidden field
});

/** Public: every website form posts here. */
r.post('/', async (req, res) => {
  const parsed = EnquiryIn.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the details and try again.' });
  const { website, ...data } = parsed.data;

  const ip = clientIp(req);
  if (!(await rateLimit(`enq:${ip}`, 8, 600))) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
  }

  const db = await getDb();
  // The hidden anti-bot field can also be filled by a browser's autofill, so a real customer could
  // trip it. Never drop an enquiry: keep it, tagged "possible spam", and let the team decide.
  const enquiry = { id: randomUUID(), at: new Date().toISOString(), read: false, ...data, ...(website ? { spam: true } : {}) };
  await db.collection('enquiries').insertOne({ ...enquiry });
  // also in the owner's activity log, with time, IP and device
  await logActivity(ACTIVITY.ENQUIRY_RECEIVED, {
    email: data.email,
    name: data.name,
    req,
    note: [data.form, `+91 ${data.phone}`, data.interest, website && 'possible spam'].filter(Boolean).join(' · '),
  });

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
r.get('/', ...admin, async (_req, res) => {
  const db = await getDb();
  const list = await db.collection('enquiries').find({}).sort({ at: -1 }).limit(2000).toArray();
  res.json(list.map(strip));
});

const Patch = z.object({ read: z.boolean().optional(), leadId: z.string().max(20).optional() }).strict();

r.patch('/:id', ...admin, async (req, res) => {
  const p = Patch.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid update.' });
  const db = await getDb();
  const doc = await db
    .collection('enquiries')
    .findOneAndUpdate({ id: req.params.id }, { $set: p.data }, { returnDocument: 'after' });
  if (!doc) return res.status(404).json({ error: 'Enquiry not found.' });
  if (p.data.leadId) {
    await logActivity(ACTIVITY.ENQUIRY_CONVERTED, {
      email: req.admin.email,
      name: req.admin.name,
      req,
      target: { name: doc.name, email: doc.email || '' },
      ref: { kind: 'lead', id: p.data.leadId },
      note: `${doc.form} → ${p.data.leadId}`,
    });
  }
  return res.json(strip(doc));
});

/** Only the owner (and Management, if allowed) can delete an enquiry; staff can see and work on them, not remove them. */
r.delete('/:id', ...admin, async (req, res) => {
  if (!can(req.admin, 'enquiries.delete')) return res.status(403).json({ error: 'Only the owner can delete an enquiry.' });
  const db = await getDb();
  const doc = await db.collection('enquiries').findOneAndDelete({ id: req.params.id });
  if (doc) {
    await logActivity(ACTIVITY.ENQUIRY_DELETED, {
      email: req.admin.email,
      name: req.admin.name,
      req,
      target: { name: doc.name, email: doc.email || '' },
      note: `${doc.form} · +91 ${doc.phone} · received ${doc.at}`,
    });
  }
  res.json({ ok: true });
});

export default r;
