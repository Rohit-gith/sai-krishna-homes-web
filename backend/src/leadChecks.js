import { can, isManager } from './permissions.js';

/*
 * Two safety checks on leads, so the data stays clean:
 *  1. Duplicate lead: the same mobile number already belongs to another lead (two people calling
 *     the same customer). The person is told who has it; they can still add it on purpose.
 *  2. Deal value: a won deal's value that looks like a typo (₹65 crore instead of ₹6.5 crore).
 *     A small mistake only needs a "yes, it's correct"; a value far outside any real flat price is
 *     blocked for sales staff and needs the owner / Management to confirm it.
 * Every "add anyway" / "value is correct" is kept on the lead and in the Activity log.
 */

/** The 10-digit mobile number inside anything people type ("+91 94370 99999" → "9437099999"). */
export const phoneKey = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
};

/** Other leads (and leads in the recycle bin) with the same mobile number. */
export async function findDuplicates(db, req, phone, excludeId) {
  const key = phoneKey(phone);
  if (key.length !== 10) return [];
  const q = { phoneKey: key, ...(excludeId ? { id: { $ne: excludeId } } : {}) };
  const opts = { projection: { _id: 0, id: 1, name: 1, status: 1, createdAt: 1, createdBy: 1, assignedTo: 1 }, limit: 10 };
  const [live, binned] = await Promise.all([
    db.collection('leads').find(q, opts).toArray(),
    db.collection('leads_trash').find(q, opts).toArray(),
  ]);
  const me = req.admin.email;
  const seeAll = can(req.admin, 'leads.view_all');
  return [...live.map((l) => ({ l, inBin: false })), ...binned.map((l) => ({ l, inBin: true }))].map(({ l, inBin }) => {
    const owner = l.assignedTo || l.createdBy;
    // staff only learn who has the customer, not the customer's details on someone else's lead
    const visible = seeAll || l.createdBy?.email === me || l.assignedTo?.email === me;
    return {
      ...(visible ? { id: l.id, name: l.name } : {}),
      status: l.status,
      owner: owner?.name || 'Not assigned',
      createdAt: l.createdAt,
      inBin,
    };
  });
}

/** A short line for history / the activity log: "SKH-0003 (with Ravi Kumar)". */
export const duplicateLine = (list) =>
  list.map((d) => `${d.id || 'a lead'} (with ${d.owner}${d.inBin ? ', in the recycle bin' : ''})`).join(', ');

// ₹ limits. Below / above the HARD limits it is surely a typo; outside the USUAL range it may be.
export const VALUE_RULES = { hardMin: 1e5, hardMax: 5e8, usualMin: 1e6, usualMax: 5e7, ratio: 3 };
const lakhCrore = (v) => (v >= 1e7 ? `₹${+(v / 1e7).toFixed(2)} crore` : `₹${+(v / 1e5).toFixed(2)} lakh`);

/**
 * Does this won-deal value look wrong? → { level: 'ok' | 'warn' | 'block', reasons: [] }
 * Compared with: fixed sensible limits, the customer's budget, and this project's other won deals.
 */
export async function checkDealValue(db, value, lead) {
  const v = Number(value) || 0;
  const reasons = [];
  let level = 'ok';
  if (v <= 0) return { level, reasons };
  const R = VALUE_RULES;
  if (v < R.hardMin || v > R.hardMax) {
    level = 'block';
    reasons.push(`${lakhCrore(v)} is outside any real flat price (${lakhCrore(R.hardMin)} – ${lakhCrore(R.hardMax)}).`);
  } else if (v < R.usualMin || v > R.usualMax) {
    level = 'warn';
    reasons.push(`${lakhCrore(v)} is unusual for a flat (most are ${lakhCrore(R.usualMin)} – ${lakhCrore(R.usualMax)}).`);
  }
  const budget = Number(lead?.budget) || 0;
  if (budget > 0 && (v > budget * R.ratio || v < budget / R.ratio)) {
    if (level === 'ok') level = 'warn';
    reasons.push(`It is very different from the customer's budget (${lakhCrore(budget)}).`);
  }
  if (lead?.project) {
    const won = await db
      .collection('leads')
      .find({ project: lead.project, status: 'won', dealValue: { $gt: 0 }, id: { $ne: lead.id } }, { projection: { _id: 0, dealValue: 1 } })
      .limit(500)
      .toArray();
    if (won.length >= 3) {
      const sorted = won.map((x) => x.dealValue).sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      if (v > median * R.ratio || v < median / R.ratio) {
        if (level === 'ok') level = 'warn';
        reasons.push(`Other ${lead.project} deals are around ${lakhCrore(median)}.`);
      }
    }
  }
  return { level, reasons };
}

/** Owner, Fidelsya and Management may confirm even a "surely a typo" value; staff may not. */
export const mayOverrideValue = (user) => isManager(user) || user?.role === 'management';
