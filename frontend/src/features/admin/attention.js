import { OPEN_STATUSES } from './constants';
import { isOverdue } from './utils';

/*
 * Leads that need the owner's attention (same rules on the Dashboard and a person's page):
 *  - overdue: still open and the follow-up date has passed
 *  - idle:    still open and nobody has called / messaged the customer for IDLE_DAYS days
 */
export const IDLE_DAYS = 7;

/** When the customer was last contacted (latest call / WhatsApp / visit), else when the lead came in. */
export const lastTouch = (l) =>
  (l.attempts || []).reduce((t, a) => (a.at > t ? a.at : t), l.createdAt || '');

export const isOpen = (l) => OPEN_STATUSES.includes(l.status);
export const isOverdueLead = (l) => isOpen(l) && !!l.nextFollowUp && isOverdue(l.nextFollowUp);
export const isIdleLead = (l, now = Date.now()) =>
  isOpen(l) && !!lastTouch(l) && now - Date.parse(lastTouch(l)) > IDLE_DAYS * 864e5;
export const needsAttention = (l) => isOverdueLead(l) || isIdleLead(l);

export const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 864e5));

/** Who a lead counts for: the person it is assigned to, else whoever added it. */
export const creditOf = (l) => l.assignedTo || l.createdBy || null;

/** Per person: { email, name, overdue, idle, total } — people with something waiting, worst first. */
export function attentionByPerson(leads) {
  const m = new Map();
  for (const l of leads) {
    const o = isOverdueLead(l);
    const i = isIdleLead(l);
    if (!o && !i) continue;
    const p = creditOf(l);
    const key = p?.email || '';
    if (!m.has(key))
      m.set(key, { email: key, name: p?.name || 'Not assigned', overdue: 0, idle: 0, total: 0 });
    const r = m.get(key);
    if (o) r.overdue += 1;
    if (i) r.idle += 1;
    r.total += 1;
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
