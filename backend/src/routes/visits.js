import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ACTIVITY, logActivity } from '../audit.js';
import { getDb, nextSeq } from '../db.js';
import { can, isManager } from '../permissions.js';
import { requireAdmin } from '../security.js';
import { cleanVisit, hideFidelsya, mark } from '../clientView.js';

/*
 * Site visits: a site-visit executive records every customer they showed around (when, who, which
 * project, 1-5 rating, feedback, outcome). Rating 4-5 = satisfied, 3 = neutral, 1-2 = not satisfied.
 * A visit is linked to the CRM lead with the same mobile number, and that lead's history notes it.
 * Who sees what: owner / Fidelsya / "See all site visits" → every visit; "Record site visits" → their own.
 */
const r = Router();
r.use(requireAdmin, hideFidelsya(cleanVisit)); // nothing Fidelsya did reaches the client

export const OUTCOMES = ['booking', 'follow_up', 'thinking', 'not_interested'];
const now = () => new Date().toISOString();
const uid = () => randomUUID().slice(0, 8);
const visitId = (n) => `VIS-${String(n).padStart(4, '0')}`;
const person = (u) => ({ email: u.email, name: u.name, role: u.role });
const strip = ({ _id, ...v }) => v;
export const satisfaction = (rating) => (rating >= 4 ? 'satisfied' : rating === 3 ? 'neutral' : 'not_satisfied');

const seeAll = (u) => isManager(u) || can(u, 'visits.view_all');
const scope = (req) => (seeAll(req.admin) ? {} : { 'guide.email': req.admin.email });
const mayUse = (req, res, next) =>
  seeAll(req.admin) || can(req.admin, 'visits.log') ? next() : res.status(403).json({ error: 'You do not have permission for this. Please ask the owner.' });

const str = (max) => z.string().trim().max(max);
const VisitIn = z
  .object({
    at: z.string().datetime({ offset: true }).optional(), // when the visit happened (default: now)
    customerName: str(80).min(2),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    project: str(80).default(''),
    config: str(40).default(''),
    people: z.coerce.number().int().min(1).max(50).default(1), // how many came
    rating: z.coerce.number().int().min(1).max(5),
    feedback: str(2000).default(''),
    outcome: z.enum(OUTCOMES).default('thinking'),
    guideEmail: z.string().trim().toLowerCase().email().optional(), // owner records on behalf of someone
  })
  .strict();

/** Find the lead with this mobile (newest first) to link the visit to. */
async function linkLead(db, phone) {
  const lead = await db.collection('leads').findOne({ phone }, { sort: { createdAt: -1 }, projection: { id: 1, name: 1, status: 1, closed: 1 } });
  return lead || null;
}

r.get('/', mayUse, async (req, res) => {
  const q = z
    .object({
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
      guide: z.string().trim().toLowerCase().email().optional(),
      leadId: z.string().max(20).optional(),
    })
    .safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: 'Invalid filter.' });
  const { from, to, guide, leadId } = q.data;
  const filter = { ...scope(req) };
  if (from || to) filter.at = { ...(from ? { $gte: new Date(from).toISOString() } : {}), ...(to ? { $lte: new Date(to).toISOString() } : {}) };
  if (guide && seeAll(req.admin)) filter['guide.email'] = guide;
  if (leadId) filter.leadId = leadId;
  const db = await getDb();
  const list = await db.collection('visits').find(filter).sort({ at: -1 }).limit(5000).toArray();
  return res.json(list.map(strip));
});

/**
 * Recording a visit: the executive types the customer's full mobile; if that customer is already a
 * lead, return just enough to fill the form (name, project, BHK). Executives without lead access only
 * ever learn about the one customer whose number they already have — never a list.
 */
r.get('/lookup', mayUse, async (req, res) => {
  const phone = String(req.query.phone || '');
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ error: 'Enter a 10-digit mobile number.' });
  const db = await getDb();
  const lead = await db.collection('leads').findOne({ phone }, { sort: { createdAt: -1 }, projection: { _id: 0, id: 1, name: 1, project: 1, config: 1 } });
  const visits = await db.collection('visits').countDocuments({ phone });
  return res.json({ lead: lead || null, previousVisits: visits });
});

/** People a visit can be recorded for (owner's dropdown). */
r.get('/guides', mayUse, async (req, res) => {
  const db = await getDb();
  const filter = seeAll(req.admin) ? { active: { $ne: false }, role: { $in: ['site_visit', 'sales', 'management', 'owner'] } } : { email: req.admin.email };
  const list = await db.collection('admins').find(filter, { projection: { _id: 0, email: 1, name: 1, role: 1 } }).sort({ name: 1 }).toArray();
  return res.json(list);
});

r.post('/', mayUse, async (req, res) => {
  if (!can(req.admin, 'visits.log')) return res.status(403).json({ error: 'You do not have permission to record visits.' });
  const p = VisitIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Please check the visit details.' });
  const d = p.data;
  const db = await getDb();

  let guide = req.actor;
  if (d.guideEmail && d.guideEmail !== req.admin.email) {
    if (!seeAll(req.admin)) return res.status(403).json({ error: 'You can only record your own visits.' });
    const g = await db.collection('admins').findOne({ email: d.guideEmail, active: { $ne: false } });
    if (!g) return res.status(400).json({ error: 'That team member was not found or is inactive.' });
    guide = person(g);
  }
  const at = d.at ? new Date(d.at).toISOString() : now();
  if (Date.parse(at) > Date.now() + 5 * 60 * 1000) return res.status(400).json({ error: 'A visit cannot be in the future.' });

  const stamp = now();
  const lead = await linkLead(db, d.phone);
  const visit = {
    id: visitId(await nextSeq(db, 'visit')),
    at,
    customerName: d.customerName,
    phone: d.phone,
    project: d.project,
    config: d.config,
    people: d.people,
    rating: d.rating,
    satisfaction: satisfaction(d.rating),
    feedback: d.feedback,
    outcome: d.outcome,
    guide,
    leadId: lead?.id || null,
    createdBy: { ...req.actor, at: stamp },
    createdAt: stamp,
    updatedAt: stamp,
    history: [{ id: uid(), at: stamp, by: req.actor, text: `Visit recorded${guide.email !== req.actor.email ? ` for ${guide.name}` : ''}` }],
  };
  await db.collection('visits').insertOne({ ...visit });

  // note it on the lead, and move an early-stage lead to "Site visit"
  if (lead) {
    const set = { updatedAt: stamp };
    if (!lead.closed && ['new', 'contacted'].includes(lead.status)) set.status = 'visit';
    await db.collection('leads').updateOne(
      { id: lead.id },
      {
        $set: set,
        $push: {
          history: {
            $each: [{ id: uid(), at: stamp, ...mark(req), text: `Site visit ${visit.id} by ${guide.name} · ${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)} · ${d.outcome.replace('_', ' ')}` }],
            $position: 0,
          },
        },
      },
    );
  }
  await logActivity(ACTIVITY.VISIT_RECORDED, {
    email: req.admin.email,
    name: req.admin.name,
    req,
    target: { name: visit.customerName, email: '' },
    ref: visit.leadId ? { kind: 'lead', id: visit.leadId } : { kind: 'visit', id: visit.id },
    note: [visit.id, visit.project, `${visit.rating}★`, visit.outcome.replace('_', ' '), visit.guide?.email !== req.admin.email && visit.guide?.name && `guide: ${visit.guide.name}`]
      .filter(Boolean)
      .join(' · '),
  });
  return res.status(201).json(visit);
});

const Patch = VisitIn.omit({ guideEmail: true }).partial().extend({ note: str(300).default('') }).strict();

r.patch('/:id', mayUse, async (req, res) => {
  const p = Patch.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Please check the visit details.' });
  const db = await getDb();
  const v = await db.collection('visits').findOne({ id: req.params.id, ...scope(req) });
  if (!v) return res.status(404).json({ error: 'Visit not found.' });
  if (!can(req.admin, 'visits.manage') && v.createdBy?.email !== req.actor.email && v.guide.email !== req.actor.email) {
    return res.status(403).json({ error: 'Only the owner can change someone else’s visit.' });
  }
  const { note, ...d } = p.data;
  const set = {};
  const changes = {};
  for (const [k, val] of Object.entries(d)) {
    const value = k === 'at' ? new Date(val).toISOString() : val;
    if (value !== v[k]) {
      set[k] = value;
      changes[k] = { from: v[k], to: value };
    }
  }
  if (set.rating) set.satisfaction = satisfaction(set.rating);
  if (set.phone) set.leadId = (await linkLead(db, set.phone))?.id || null;
  if (!Object.keys(set).length) return res.json(strip(v));
  const at = now();
  const updated = await db.collection('visits').findOneAndUpdate(
    { _id: v._id },
    {
      $set: { ...set, updatedAt: at },
      $push: { history: { $each: [{ id: uid(), at, by: req.actor, text: `Changed: ${Object.keys(changes).join(', ')}`, changes, note }], $position: 0 } },
    },
    { returnDocument: 'after' },
  );
  await logActivity(ACTIVITY.VISIT_UPDATED, {
    email: req.admin.email,
    name: req.admin.name,
    req,
    target: { name: updated.customerName, email: '' },
    ref: updated.leadId ? { kind: 'lead', id: updated.leadId } : { kind: 'visit', id: updated.id },
    changes,
    note: `${updated.id} · Changed: ${Object.keys(changes).join(', ')}`,
  });
  return res.json(strip(updated));
});

r.delete('/:id', async (req, res) => {
  if (!can(req.admin, 'visits.manage')) return res.status(403).json({ error: 'Only the owner can delete a visit.' });
  const db = await getDb();
  const v = await db.collection('visits').findOneAndDelete({ id: req.params.id });
  if (!v) return res.status(404).json({ error: 'Visit not found.' });
  // the deleted visit stays on record here
  await logActivity(ACTIVITY.VISIT_DELETED, {
    email: req.admin.email,
    name: req.admin.name,
    req,
    target: { name: v.customerName, email: '' },
    note: [v.id, `+91 ${v.phone}`, v.project, `${v.rating}★`, v.at?.slice(0, 10), v.guide?.name && `guide: ${v.guide.name}`].filter(Boolean).join(' · '),
  });
  return res.json({ ok: true });
});

export default r;
