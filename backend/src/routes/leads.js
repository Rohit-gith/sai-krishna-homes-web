import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb, nextSeq } from '../db.js';
import { requireAdmin } from '../security.js';

/*
 * The CRM. Same lead shape and the same rules the admin panel used when it lived in the browser
 * (pipeline, won/lost commit, attempts, history), now stored in MongoDB and shared by every admin.
 */
const r = Router();
r.use(requireAdmin);

const now = () => new Date().toISOString();
const uid = () => randomUUID().slice(0, 8);
const leadId = (n) => `SKH-${String(n).padStart(4, '0')}`;
const strip = ({ _id, ...doc }) => doc;
const OPEN = ['new', 'contacted', 'visit', 'negotiation'];
const by = (req) => req.admin?.name || req.admin?.email || 'Admin';

const str = (max) => z.string().trim().max(max);
const money = z.coerce.number().min(0).max(1e11);
const date = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  .nullable();

const LeadFields = z.object({
  name: str(80).min(2),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/),
  email: z.union([z.literal(''), z.string().trim().email().max(120)]).default(''),
  project: str(80).default(''),
  config: str(40).default(''),
  source: str(40).default('Other'),
  budget: money.default(0),
  dealValue: money.default(0),
  nextFollowUp: date.optional(),
  notes: str(3000).default(''),
});

const leads = async () => (await getDb()).collection('leads');

/** Apply a change and add a history line, in one atomic update. */
async function change(id, set, text, extra = {}) {
  const col = await leads();
  const at = now();
  return col.findOneAndUpdate(
    { id, ...extra.filter },
    {
      $set: { ...set, updatedAt: at },
      $push: { history: { $each: [{ id: uid(), at, text }], $position: 0 }, ...extra.push },
    },
    { returnDocument: 'after' },
  );
}

r.get('/', async (_req, res) => {
  const col = await leads();
  res.json((await col.find({}).sort({ createdAt: -1 }).toArray()).map(strip));
});

r.post('/', async (req, res) => {
  const p = LeadFields.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Please check the lead details.' });
  const db = await getDb();
  const id = leadId(await nextSeq(db, 'lead'));
  const at = now();
  const lead = {
    id,
    ...p.data,
    nextFollowUp: p.data.nextFollowUp || null,
    status: 'new',
    demo: false,
    closed: null,
    attempts: [],
    history: [{ id: uid(), at, text: `Lead created (${p.data.source || 'Other'}) by ${by(req)}` }],
    createdAt: at,
    updatedAt: at,
  };
  await db.collection('leads').insertOne({ ...lead });
  return res.status(201).json(lead);
});

r.patch('/:id', async (req, res) => {
  const p = LeadFields.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Please check the lead details.' });
  const doc = await change(req.params.id, p.data, `Details updated by ${by(req)}`);
  if (!doc) return res.status(404).json({ error: 'Lead not found.' });
  return res.json(strip(doc));
});

/** Bulk pipeline move for OPEN leads (won/lost only through /commit). */
r.post('/status', async (req, res) => {
  const p = z.object({ ids: z.array(z.string().max(20)).min(1).max(2000), status: z.enum(OPEN) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid status change.' });
  const col = await leads();
  const targets = await col.find({ id: { $in: p.data.ids }, closed: null, status: { $ne: p.data.status } }).toArray();
  const at = now();
  if (targets.length) {
    await col.bulkWrite(
      targets.map((l) => ({
        updateOne: {
          filter: { id: l.id },
          update: {
            $set: { status: p.data.status, updatedAt: at },
            $push: {
              history: {
                $each: [{ id: uid(), at, text: `Status: ${l.status} → ${p.data.status} (${by(req)})` }],
                $position: 0,
              },
            },
          },
        },
      })),
    );
  }
  const updated = await col.find({ id: { $in: targets.map((l) => l.id) } }).toArray();
  return res.json(updated.map(strip));
});

const Commit = z.discriminatedUnion('result', [
  z.object({ result: z.literal('won'), value: money, unit: str(80).default(''), note: str(500).default('') }),
  z.object({ result: z.literal('lost'), reason: str(80).min(1), note: str(500).default('') }),
]);

r.post('/:id/commit', async (req, res) => {
  const p = Commit.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid deal details.' });
  const c = p.data;
  const col = await leads();
  const lead = await col.findOne({ id: req.params.id });
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  const set = {
    status: c.result,
    dealValue: c.result === 'won' ? Number(c.value) || lead.dealValue : lead.dealValue,
    closed: { ...c, at: now(), by: by(req) },
    nextFollowUp: null,
  };
  const text =
    c.result === 'won' ? `Deal WON and committed by ${by(req)}` : `Deal LOST and committed (${c.reason}) by ${by(req)}`;
  return res.json(strip(await change(lead.id, set, text)));
});

r.post('/:id/reopen', async (req, res) => {
  const doc = await change(req.params.id, { status: 'negotiation', closed: null }, `Deal reopened by ${by(req)}`);
  if (!doc) return res.status(404).json({ error: 'Lead not found.' });
  return res.json(strip(doc));
});

const Attempt = z.object({
  type: str(40).min(1),
  outcome: str(40).min(1),
  note: str(1000).default(''),
  nextFollowUp: date.optional(),
});

r.post('/:id/attempts', async (req, res) => {
  const p = Attempt.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid attempt.' });
  const col = await leads();
  const lead = await col.findOne({ id: req.params.id });
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  const a = { id: uid(), at: now(), by: by(req), ...p.data };
  const set = { nextFollowUp: a.nextFollowUp || lead.nextFollowUp || null };
  // first successful contact moves a fresh lead forward automatically
  if (lead.status === 'new' && a.outcome !== 'no-answer') set.status = 'contacted';
  const doc = await change(lead.id, set, `Attempt logged: ${a.type} · ${a.outcome} (${by(req)})`, {
    push: { attempts: { $each: [a], $position: 0 } },
  });
  return res.json(strip(doc));
});

// Excel cells can hold anything, so an import never fails because one cell is too long:
// text is trimmed and cut to size instead of rejected (a whole sheet shouldn't be lost over one cell).
const cut = (max) =>
  z.any().transform((v) => (v === null || v === undefined ? '' : String(v)).replace(/\s+$/g, '').trim().slice(0, max));
const CONFIG_MAX = 40;
const Draft = z.object({
  name: cut(80).refine((s) => s.length > 0),
  phone: cut(20).refine((s) => s.length >= 5),
  project: cut(80),
  config: cut(2000), // a long free-text "configuration" moves into the notes below
  priceMin: money.catch(0),
  priceMax: money.catch(0),
  createdAt: z.any().optional(),
  notes: cut(10000),
  status: z.enum(['new', 'contacted', 'visit', 'negotiation', 'won', 'lost']).catch('new'),
  sheet: cut(80),
});

/** Excel import: many leads in one request, IDs reserved as a block. */
r.post('/import', async (req, res) => {
  const p = z.array(Draft).min(1).max(5000).safeParse(req.body?.drafts);
  if (!p.success) return res.status(400).json({ error: 'The import data is not valid.' });
  const db = await getDb();
  const drafts = p.data;
  const last = await nextSeq(db, 'lead', drafts.length);
  const start = last - drafts.length + 1;
  const stamp = now();
  const created = drafts.map((d, i) => {
    const longConfig = d.config.length > CONFIG_MAX;
    const notes = (longConfig ? `Configuration: ${d.config}${d.notes ? '\n' : ''}${d.notes}` : d.notes).slice(0, 10000);
    const at =
      typeof d.createdAt === 'string' && !Number.isNaN(Date.parse(d.createdAt))
        ? new Date(d.createdAt).toISOString()
        : stamp;
    return {
      id: leadId(start + i),
      name: d.name,
      phone: d.phone,
      email: '',
      project: d.project,
      config: longConfig ? '' : d.config,
      source: 'Excel import',
      budget: 0,
      dealValue: 0,
      priceMin: d.priceMin,
      priceMax: d.priceMax,
      status: d.status,
      nextFollowUp: null,
      notes,
      demo: false,
      closed: null,
      attempts: [],
      history: [
        { id: uid(), at: stamp, text: `Imported from Excel${d.sheet ? ` (sheet "${d.sheet}")` : ''} by ${by(req)}` },
      ],
      createdAt: at,
      updatedAt: stamp,
    };
  });
  await db.collection('leads').insertMany(created.map((x) => ({ ...x })));
  created.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.status(201).json(created);
});

r.post('/delete', async (req, res) => {
  const p = z.object({ ids: z.array(z.string().max(20)).min(1).max(5000) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Nothing to delete.' });
  const col = await leads();
  const { deletedCount } = await col.deleteMany({ id: { $in: p.data.ids } });
  return res.json({ deleted: deletedCount });
});

export default r;
