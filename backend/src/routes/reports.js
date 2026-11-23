import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { can } from '../permissions.js';
import { requireAdmin } from '../security.js';

/*
 * Team reports for a period [from, to]:
 *  sales  — per person: leads they brought (created by them, or assigned to them), won / lost in the
 *           period (count + value), still open, calls/visits logged, conversion %.
 *  visits — per site-visit executive: visits, people shown around, average rating, satisfied /
 *           neutral / not satisfied, outcomes, latest feedback.
 * A lead counts for the person it is assigned to; if nobody is assigned, for whoever created it.
 */
const r = Router();
r.use(requireAdmin, (req, res, next) =>
  can(req.admin, 'reports.view') ? next() : res.status(403).json({ error: 'You do not have permission for this. Please ask the owner.' }),
);

const OPEN = ['new', 'contacted', 'visit', 'negotiation'];
const inRange = (iso, from, to) => !!iso && iso >= from && iso <= to;
const round1 = (n) => Math.round(n * 10) / 10;

r.get('/', async (req, res) => {
  const q = z
    .object({
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
    })
    .safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: 'Invalid dates.' });
  const from = q.data.from ? new Date(q.data.from).toISOString() : '1970-01-01T00:00:00.000Z';
  const to = q.data.to ? new Date(q.data.to).toISOString() : new Date(Date.now() + 864e5).toISOString();
  if (from > to) return res.status(400).json({ error: '"From" must be before "To".' });

  const db = await getDb();
  const [admins, leads, visits] = await Promise.all([
    db.collection('admins').find({}, { projection: { email: 1, name: 1, role: 1, active: 1 } }).toArray(),
    db.collection('leads').find({}, { projection: { _id: 0, id: 1, status: 1, closed: 1, dealValue: 1, createdAt: 1, createdBy: 1, assignedTo: 1, attempts: 1, source: 1 } }).toArray(),
    db.collection('visits').find({ at: { $gte: from, $lte: to } }, { projection: { _id: 0 } }).sort({ at: -1 }).toArray(),
  ]);
  // Fidelsya never shows up in the client's reports
  const hidden = new Set(['script', 'support', ...admins.filter((a) => a.role === 'superowner').map((a) => a.email)]);
  const known = new Map(admins.map((a) => [a.email, a]));
  const credit = (l) => {
    const p = l.assignedTo?.email ? l.assignedTo : l.createdBy?.email ? l.createdBy : null;
    return p && !hidden.has(p.email) ? p : null;
  };

  /* ---------- sales ---------- */
  const rows = new Map();
  const row = (email, name) => {
    if (!rows.has(email)) {
      const a = known.get(email);
      rows.set(email, {
        email,
        name: a?.name || name || email,
        role: a?.role || '',
        active: a ? a.active !== false : false,
        newLeads: 0,
        open: 0,
        won: 0,
        wonValue: 0,
        lost: 0,
        attempts: 0,
        connected: 0,
      });
    }
    return rows.get(email);
  };
  for (const a of admins) if (a.role === 'sales') row(a.email, a.name); // everyone in sales, even with 0
  let unassignedNew = 0;
  // every lead that came in during the period, by where it stands now (for the pie chart)
  const status = { open: 0, won: 0, lost: 0 };
  for (const l of leads) {
    const p = credit(l);
    if (inRange(l.createdAt, from, to)) {
      status[l.status === 'won' ? 'won' : l.status === 'lost' ? 'lost' : 'open'] += 1;
      if (p) {
        const r1 = row(p.email, p.name);
        r1.newLeads += 1;
        if (OPEN.includes(l.status)) r1.open += 1;
      } else unassignedNew += 1;
    }
    if (p && l.closed && inRange(l.closed.at, from, to)) {
      const r1 = row(p.email, p.name);
      if (l.closed.result === 'won') {
        r1.won += 1;
        r1.wonValue += Number(l.closed.value || l.dealValue) || 0;
      } else r1.lost += 1;
    }
    // calls / WhatsApp / visits / meetings logged in the period, by whoever logged them
    for (const at of l.attempts || []) {
      if (!inRange(at.at, from, to)) continue;
      const email = at.byEmail || admins.find((a) => a.name === at.by)?.email;
      if (!email || hidden.has(email)) continue;
      const r1 = row(email, at.by);
      r1.attempts += 1;
      if (['connected', 'interested'].includes(at.outcome)) r1.connected += 1;
    }
  }
  const sales = [...rows.values()]
    .filter((x) => x.role !== 'site_visit' || x.newLeads || x.won || x.lost || x.attempts)
    .map((x) => ({ ...x, conversion: x.won + x.lost ? round1((x.won / (x.won + x.lost)) * 100) : null }))
    .sort((a, b) => b.won - a.won || b.newLeads - a.newLeads || a.name.localeCompare(b.name));

  /* ---------- site visits ---------- */
  const g = new Map();
  for (const a of admins) if (a.role === 'site_visit') g.set(a.email, { email: a.email, name: a.name, active: a.active !== false, list: [] });
  for (const v of visits) {
    if (hidden.has(v.guide?.email)) continue;
    if (!g.has(v.guide.email)) {
      const a = known.get(v.guide.email);
      g.set(v.guide.email, { email: v.guide.email, name: a?.name || v.guide.name, active: a ? a.active !== false : false, list: [] });
    }
    g.get(v.guide.email).list.push(v);
  }
  const visitRows = [...g.values()]
    .map(({ list, ...p }) => {
      const n = list.length;
      const count = (fn) => list.filter(fn).length;
      return {
        ...p,
        visits: n,
        people: list.reduce((s, v) => s + (v.people || 1), 0),
        avgRating: n ? round1(list.reduce((s, v) => s + v.rating, 0) / n) : null,
        satisfied: count((v) => v.rating >= 4),
        neutral: count((v) => v.rating === 3),
        notSatisfied: count((v) => v.rating <= 2),
        outcomes: {
          booking: count((v) => v.outcome === 'booking'),
          follow_up: count((v) => v.outcome === 'follow_up'),
          thinking: count((v) => v.outcome === 'thinking'),
          not_interested: count((v) => v.outcome === 'not_interested'),
        },
        latestFeedback: list
          .filter((v) => v.feedback)
          .slice(0, 5)
          .map((v) => ({ id: v.id, at: v.at, customerName: v.customerName, rating: v.rating, feedback: v.feedback })),
      };
    })
    .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));

  const sum = (list, k) => list.reduce((s, x) => s + (x[k] || 0), 0);
  const totalVisits = sum(visitRows, 'visits');
  res.json({
    from,
    to,
    sales,
    visits: visitRows,
    totals: {
      status,
      newLeads: sum(sales, 'newLeads') + unassignedNew,
      unassignedNew,
      won: sum(sales, 'won'),
      wonValue: sum(sales, 'wonValue'),
      lost: sum(sales, 'lost'),
      attempts: sum(sales, 'attempts'),
      visits: totalVisits,
      people: sum(visitRows, 'people'),
      satisfied: sum(visitRows, 'satisfied'),
      notSatisfied: sum(visitRows, 'notSatisfied'),
      avgRating: totalVisits ? round1(visitRows.reduce((s, x) => s + (x.avgRating || 0) * x.visits, 0) / totalVisits) : null,
    },
  });
});

export default r;
