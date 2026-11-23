import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ACTIVITY, logActivity } from '../audit.js';
import { getDb, nextSeq } from '../db.js';
import { can } from '../permissions.js';
import { requireAdmin, requirePerm } from '../security.js';
import { cleanLead, hideFidelsya, isFidelsya, mark } from '../clientView.js';

/*
 * The CRM. Same lead shape and the same rules the admin panel used when it lived in the browser
 * (pipeline, won/lost commit, attempts, history), now stored in MongoDB and shared by the team.
 * Every lead records who created it (createdBy) and who it is assigned to (assignedTo).
 * Staff without "See all leads" only see and touch leads they created or were assigned.
 */
const r = Router();
r.use(requireAdmin, hideFidelsya(cleanLead)); // nothing Fidelsya did reaches the client

const now = () => new Date().toISOString();
const uid = () => randomUUID().slice(0, 8);
const leadId = (n) => `SKH-${String(n).padStart(4, '0')}`;
const strip = ({ _id, ...doc }) => doc;
const OPEN = ['new', 'contacted', 'visit', 'negotiation'];
const by = (req) => req.actor?.name || req.admin?.name || 'Admin'; // Fidelsya → 'Support team'
const person = (u) => ({ email: u.email, name: u.name, role: u.role });
const short = (v) => (v === null || v === undefined ? '' : String(v).slice(0, 120));
/** Activity log entry about one lead (who, when, which lead, what), so the owner sees all the work. */
const record = (req, type, lead, note = '', changes) =>
  logActivity(type, {
    ...person(req.admin),
    req,
    target: { name: lead.name, email: '' },
    ref: { kind: 'lead', id: lead.id },
    note: [lead.id, note].filter(Boolean).join(' · '),
    ...(changes && Object.keys(changes).length ? { changes } : {}),
  });

/** The leads this person may see / change. */
const scope = (req) =>
  can(req.admin, 'leads.view_all')
    ? {}
    : { $or: [{ 'createdBy.email': req.admin.email }, { 'assignedTo.email': req.admin.email }] };

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

/** Apply a change and add a history line, in one atomic update (only on a lead this person may touch). */
async function change(req, id, set, text, extra = {}) {
  const col = await leads();
  const at = now();
  return col.findOneAndUpdate(
    { id, ...scope(req), ...extra.filter },
    {
      $set: { ...set, updatedAt: at },
      $push: { history: { $each: [{ id: uid(), at, text, ...mark(req) }], $position: 0 }, ...extra.push },
    },
    { returnDocument: 'after' },
  );
}

r.get('/', async (req, res) => {
  const col = await leads();
  res.json((await col.find(scope(req)).sort({ createdAt: -1 }).toArray()).map(strip));
});

/** People leads can be assigned to (for the assign dropdown). */
r.get('/assignees', requirePerm('leads.assign'), async (req, res) => {
  const db = await getDb();
  const list = await db
    .collection('admins')
    .find({ active: { $ne: false }, role: { $in: ['owner', 'management', 'sales'] } }, { projection: { _id: 0, email: 1, name: 1, role: 1 } })
    .sort({ name: 1 })
    .toArray();
  res.json(list);
});

r.post('/', requirePerm('leads.create'), async (req, res) => {
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
    history: [{ id: uid(), at, text: `Lead created (${p.data.source || 'Other'}) by ${by(req)}`, ...mark(req) }],
    createdBy: { ...req.actor, at },
    assignedTo: null,
    createdAt: at,
    updatedAt: at,
  };
  await db.collection('leads').insertOne({ ...lead });
  await record(req, ACTIVITY.LEAD_CREATED, lead, [lead.project, lead.config, `+91 ${lead.phone}`, lead.source].filter(Boolean).join(' · '));
  return res.status(201).json(lead);
});

r.patch('/:id', requirePerm('leads.edit'), async (req, res) => {
  const p = LeadFields.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Please check the lead details.' });
  const before = await (await leads()).findOne({ id: req.params.id, ...scope(req) });
  const doc = await change(req, req.params.id, p.data, `Details updated by ${by(req)}`);
  if (!doc) return res.status(404).json({ error: 'Lead not found.' });
  const changes = {};
  for (const [k, v] of Object.entries(p.data)) if (short(before?.[k]) !== short(v)) changes[k] = { from: short(before?.[k]), to: short(v) };
  if (Object.keys(changes).length) await record(req, ACTIVITY.LEAD_UPDATED, doc, `Changed: ${Object.keys(changes).join(', ')}`, changes);
  return res.json(strip(doc));
});

/** Bulk pipeline move for OPEN leads (won/lost only through /commit). */
r.post('/status', requirePerm('leads.edit'), async (req, res) => {
  const p = z.object({ ids: z.array(z.string().max(20)).min(1).max(2000), status: z.enum(OPEN) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid status change.' });
  const col = await leads();
  const targets = await col
    .find({ id: { $in: p.data.ids }, closed: null, status: { $ne: p.data.status }, ...scope(req) })
    .toArray();
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
                $each: [{ id: uid(), at, text: `Status: ${l.status} → ${p.data.status} (${by(req)})`, ...mark(req) }],
                $position: 0,
              },
            },
          },
        },
      })),
    );
  }
  const updated = await col.find({ id: { $in: targets.map((l) => l.id) } }).toArray();
  if (targets.length === 1) await record(req, ACTIVITY.LEAD_STATUS_CHANGED, targets[0], `${targets[0].status} → ${p.data.status}`);
  else if (targets.length)
    await logActivity(ACTIVITY.LEAD_STATUS_CHANGED, {
      ...person(req.admin),
      req,
      note: `${targets.length} lead(s) → ${p.data.status}: ${targets
        .slice(0, 20)
        .map((l) => `${l.id} ${l.name}`)
        .join(', ')}${targets.length > 20 ? '…' : ''}`,
    });
  return res.json(updated.map(strip));
});

const Commit = z.discriminatedUnion('result', [
  z.object({ result: z.literal('won'), value: money, unit: str(80).default(''), note: str(500).default('') }),
  z.object({ result: z.literal('lost'), reason: str(80).min(1), note: str(500).default('') }),
]);

r.post('/:id/commit', requirePerm('deals.close'), async (req, res) => {
  const p = Commit.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid deal details.' });
  const c = p.data;
  const col = await leads();
  const lead = await col.findOne({ id: req.params.id, ...scope(req) });
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  const set = {
    status: c.result,
    dealValue: c.result === 'won' ? Number(c.value) || lead.dealValue : lead.dealValue,
    closed: { ...c, at: now(), by: by(req), ...mark(req) },
    nextFollowUp: null,
  };
  const text =
    c.result === 'won' ? `Deal WON and committed by ${by(req)}` : `Deal LOST and committed (${c.reason}) by ${by(req)}`;
  const doc = await change(req, lead.id, set, text);
  await record(
    req,
    c.result === 'won' ? ACTIVITY.DEAL_WON : ACTIVITY.DEAL_LOST,
    lead,
    [c.result === 'won' ? `₹${Math.round(Number(c.value) || 0).toLocaleString('en-IN')}` : c.reason, c.unit, c.note].filter(Boolean).join(' · '),
  );
  return res.json(strip(doc));
});

r.post('/:id/reopen', requirePerm('deals.close'), async (req, res) => {
  const doc = await change(req, req.params.id, { status: 'negotiation', closed: null }, `Deal reopened by ${by(req)}`);
  if (!doc) return res.status(404).json({ error: 'Lead not found.' });
  await record(req, ACTIVITY.DEAL_REOPENED, doc, 'Back to negotiation');
  return res.json(strip(doc));
});

const Attempt = z.object({
  type: str(40).min(1),
  outcome: str(40).min(1),
  note: str(1000).default(''),
  nextFollowUp: date.optional(),
});

r.post('/:id/attempts', requirePerm('attempts.log'), async (req, res) => {
  const p = Attempt.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid attempt.' });
  const col = await leads();
  const lead = await col.findOne({ id: req.params.id, ...scope(req) });
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  const a = { id: uid(), at: now(), by: by(req), byEmail: req.actor.email, ...mark(req), ...p.data };
  const set = { nextFollowUp: a.nextFollowUp || lead.nextFollowUp || null };
  // first successful contact moves a fresh lead forward automatically
  if (lead.status === 'new' && a.outcome !== 'no-answer') set.status = 'contacted';
  const doc = await change(req, lead.id, set, `Attempt logged: ${a.type} · ${a.outcome} (${by(req)})`, {
    push: { attempts: { $each: [a], $position: 0 } },
  });
  await record(req, ACTIVITY.ATTEMPT_LOGGED, lead, [a.type, a.outcome, a.note && `“${a.note.slice(0, 160)}”`].filter(Boolean).join(' · '));
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
r.post('/import', requirePerm('leads.import'), async (req, res) => {
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
        { id: uid(), at: stamp, text: `Imported from Excel${d.sheet ? ` (sheet "${d.sheet}")` : ''} by ${by(req)}`, ...mark(req) },
      ],
      createdBy: { ...req.actor, at: stamp },
      assignedTo: null,
      createdAt: at,
      updatedAt: stamp,
    };
  });
  await db.collection('leads').insertMany(created.map((x) => ({ ...x })));
  await logActivity(ACTIVITY.LEADS_IMPORTED, {
    ...person(req.admin),
    req,
    note: `${created.length} lead(s) from Excel: ${created[0].id} – ${created[created.length - 1].id}${drafts[0].sheet ? ` (sheet "${drafts[0].sheet}")` : ''}`,
  });
  created.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.status(201).json(created);
});

/*
 * Deleting never destroys a lead: it moves to the recycle bin ("leads_trash") with who and when.
 * Owners see the bin and can restore. Only Fidelsya can remove a lead for good.
 */
const trash = async () => (await getDb()).collection('leads_trash');
// owner, Fidelsya, and Management when the owner allows it
const restorers = requirePerm('leads.restore');
const Ids = z.object({ ids: z.array(z.string().max(20)).min(1).max(5000) }).strict();
const idList = (list) => `${list.slice(0, 20).join(', ')}${list.length > 20 ? '…' : ''}`;

r.post('/delete', requirePerm('leads.delete'), async (req, res) => {
  const p = Ids.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Nothing to delete.' });
  const col = await leads();
  const found = await col.find({ id: { $in: p.data.ids }, ...scope(req) }).toArray();
  if (!found.length) return res.json({ deleted: 0 });
  const at = now();
  const bin = await trash();
  await bin.deleteMany({ id: { $in: found.map((l) => l.id) } }); // an older copy of the same id, if any
  await bin.insertMany(found.map(({ _id, ...l }) => ({ ...l, deleted: { at, by: req.actor, ...mark(req) } })));
  const { deletedCount } = await col.deleteMany({ id: { $in: found.map((l) => l.id) } });
  await logActivity(ACTIVITY.LEADS_DELETED, {
    ...person(req.admin),
    req,
    note: `${found.length} lead(s) moved to the recycle bin: ${idList(found.map((l) => `${l.id} ${l.name}`))}`,
  });
  return res.json({ deleted: deletedCount });
});

/** The recycle bin, newest first. The client never sees what Fidelsya deleted. */
r.get('/trash', restorers, async (req, res) => {
  const filter = isFidelsya(req) ? {} : { 'deleted.support': { $ne: true } };
  const list = await (await trash()).find(filter).sort({ 'deleted.at': -1 }).limit(5000).toArray();
  res.json(
    list.map(({ _id, deleted, ...l }) => ({
      ...l,
      deleted: isFidelsya(req) ? deleted : { at: deleted.at, by: deleted.by },
    })),
  );
});

r.post('/trash/restore', restorers, async (req, res) => {
  const p = Ids.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose the leads to restore.' });
  const bin = await trash();
  const filter = { id: { $in: p.data.ids }, ...(isFidelsya(req) ? {} : { 'deleted.support': { $ne: true } }) };
  const found = await bin.find(filter).toArray();
  if (!found.length) return res.json([]);
  const col = await leads();
  const clash = await col.find({ id: { $in: found.map((l) => l.id) } }, { projection: { id: 1 } }).toArray();
  if (clash.length) return res.status(409).json({ error: `${clash.map((x) => x.id).join(', ')} already exist in the leads.` });
  const at = now();
  const back = found.map(({ _id, deleted, ...l }) => ({
    ...l,
    updatedAt: at,
    history: [
      { id: uid(), at, text: `Restored from the recycle bin by ${by(req)} (deleted ${deleted.at.slice(0, 10)} by ${deleted.by?.name || 'someone'})`, ...mark(req) },
      ...(l.history || []),
    ],
  }));
  await col.insertMany(back.map((l) => ({ ...l })));
  await bin.deleteMany({ id: { $in: found.map((l) => l.id) } });
  await logActivity(ACTIVITY.LEADS_RESTORED, { ...person(req.admin), req, note: `${back.length} lead(s): ${idList(back.map((l) => `${l.id} ${l.name}`))}` });
  return res.json(back);
});

/** Remove for good. Fidelsya only (the client can always get a deleted lead back). */
r.post('/trash/purge', async (req, res) => {
  if (!isFidelsya(req)) return res.status(403).json({ error: 'Only Fidelsya can remove leads permanently.' });
  const p = Ids.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose the leads.' });
  const bin = await trash();
  const found = await bin.find({ id: { $in: p.data.ids } }, { projection: { id: 1, name: 1 } }).toArray();
  const { deletedCount } = await bin.deleteMany({ id: { $in: p.data.ids } });
  await logActivity(ACTIVITY.LEADS_PURGED, { ...person(req.admin), req, note: `${deletedCount} lead(s) removed for good: ${idList(found.map((l) => `${l.id} ${l.name}`))}` });
  return res.json({ purged: deletedCount });
});

/**
 * Hand over: every OPEN lead credited to one person (assigned to them, or added by them and not
 * assigned to anyone) goes to another. Won / lost deals stay with the person who closed them.
 */
r.post('/handover', requirePerm('leads.handover'), async (req, res) => {
  const p = z
    .object({ from: z.string().trim().toLowerCase().email(), to: z.string().trim().toLowerCase().email(), note: str(300).default('') })
    .strict()
    .safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose who the leads go to.' });
  const { from, to, note } = p.data;
  if (from === to) return res.status(400).json({ error: 'Choose a different person.' });
  const db = await getDb();
  const [fromUser, toUser] = await Promise.all([
    db.collection('admins').findOne({ email: from }),
    db.collection('admins').findOne({ email: to, active: { $ne: false }, role: { $in: ['owner', 'management', 'sales'] } }),
  ]);
  if (!fromUser) return res.status(404).json({ error: 'Team member not found.' });
  if (!toUser) return res.status(400).json({ error: 'That person cannot take leads (not found, inactive or not sales / management).' });
  const col = await leads();
  const list = await col
    .find({
      status: { $in: OPEN },
      $or: [{ 'assignedTo.email': from }, { assignedTo: null, 'createdBy.email': from }],
    })
    .toArray();
  if (!list.length) return res.json({ moved: 0 });
  const at = now();
  const assignee = { ...person(toUser), at, by: req.actor };
  await col.bulkWrite(
    list.map((l) => ({
      updateOne: {
        filter: { id: l.id },
        update: {
          $set: { assignedTo: assignee, updatedAt: at },
          $push: {
            history: {
              $each: [{ id: uid(), at, text: `Handed over from ${fromUser.name} to ${toUser.name} by ${by(req)}${note ? ` · ${note}` : ''}`, ...mark(req) }],
              $position: 0,
            },
          },
        },
      },
    })),
  );
  await logActivity(ACTIVITY.LEADS_HANDED_OVER, {
    ...person(req.admin),
    req,
    target: person(toUser),
    note: `${list.length} open lead(s) from ${fromUser.name} to ${toUser.name}${note ? ` · ${note}` : ''}`,
  });
  return res.json({ moved: list.length });
});

/** The CSV is built in the browser; this only records that it happened (who, when, how many). */
r.post('/exported', requirePerm('leads.export'), async (req, res) => {
  const p = z.object({ count: z.number().int().min(0).max(1e6), filters: z.string().max(300).default('') }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Invalid request.' });
  await logActivity(ACTIVITY.LEADS_EXPORTED, { ...person(req.admin), req, note: `${p.data.count} lead(s)${p.data.filters ? ` · ${p.data.filters}` : ''}` });
  return res.json({ ok: true });
});

/** Give leads to a team member (or take them back with to: null). Credits that person in the reports. */
r.post('/assign', requirePerm('leads.assign'), async (req, res) => {
  const p = z
    .object({ ids: z.array(z.string().max(20)).min(1).max(5000), to: z.string().trim().toLowerCase().email().nullable() })
    .strict()
    .safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose the leads and the person.' });
  const db = await getDb();
  let assignee = null;
  if (p.data.to) {
    const u = await db.collection('admins').findOne({ email: p.data.to, active: { $ne: false }, role: { $in: ['owner', 'management', 'sales'] } });
    if (!u) return res.status(400).json({ error: 'That person cannot be assigned leads (not found, inactive or not sales / management).' });
    assignee = person(u);
  }
  const col = await leads();
  const at = now();
  const targets = await col.find({ id: { $in: p.data.ids }, ...scope(req) }).toArray();
  const moved = targets.filter((l) => (l.assignedTo?.email || null) !== (assignee?.email || null));
  if (moved.length) {
    await col.bulkWrite(
      moved.map((l) => ({
        updateOne: {
          filter: { id: l.id },
          update: {
            $set: { assignedTo: assignee ? { ...assignee, at, by: req.actor } : null, updatedAt: at },
            $push: {
              history: {
                $each: [
                  {
                    id: uid(),
                    at,
                    text: assignee
                      ? `Assigned to ${assignee.name}${l.assignedTo ? ` (was ${l.assignedTo.name})` : ''} by ${by(req)}`
                      : `Unassigned${l.assignedTo ? ` from ${l.assignedTo.name}` : ''} by ${by(req)}`,
                    ...mark(req),
                  },
                ],
                $position: 0,
              },
            },
          },
        },
      })),
    );
    await logActivity(ACTIVITY.LEAD_ASSIGNED, {
      ...person(req.admin),
      req,
      target: assignee,
      note: `${moved.length} lead(s): ${moved
        .slice(0, 20)
        .map((l) => l.id)
        .join(', ')}${moved.length > 20 ? '…' : ''}`,
    });
  }
  const updated = await col.find({ id: { $in: moved.map((l) => l.id) } }).toArray();
  return res.json(updated.map(strip));
});

export default r;
