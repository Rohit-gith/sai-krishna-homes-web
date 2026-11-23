/*
 * Fidelsya (superowner) sees everything. The client (owner and staff) must never see that Fidelsya did
 * anything: no "created by", no history line, no call, no visit made by Fidelsya.
 *
 * How: every record Fidelsya writes is marked (history entries / attempts get `support: true`; people
 * fields get email "support"), and every response to a non-Fidelsya user goes through these cleaners.
 * The data stays complete in the database, and Fidelsya still sees it all.
 */

export const isFidelsya = (req) => req.admin?.role === 'superowner';

/** Spread into anything Fidelsya writes: `{ ...mark(req), text }` */
export const mark = (req) => (isFidelsya(req) ? { support: true } : {});

const isSupportPerson = (p) => !!p && (p.email === 'support' || p.email === 'script' || p.role === 'superowner');
const visibleHistory = (list) => (list || []).filter((h) => !h.support && !isSupportPerson(h.by));

export function cleanLead(l) {
  if (!l || typeof l !== 'object' || !Array.isArray(l.history)) return l; // only lead records
  const out = { ...l, history: visibleHistory(l.history), attempts: (l.attempts || []).filter((a) => !a.support && a.byEmail !== 'support') };
  if (isSupportPerson(l.createdBy)) out.createdBy = null;
  if (out.assignedTo && isSupportPerson(out.assignedTo.by)) out.assignedTo = { ...out.assignedTo, by: null };
  if (out.closed && (out.closed.support || out.closed.by === 'Support team')) {
    const { by, support, ...rest } = out.closed;
    out.closed = rest;
  }
  return out;
}

/** null = the client must not see this visit at all (Fidelsya showed the customer around itself). */
export function cleanVisit(v) {
  if (!v || typeof v !== 'object' || !v.guide) return v; // only visit records
  if (isSupportPerson(v.guide)) return null;
  const out = { ...v, history: visibleHistory(v.history) };
  if (isSupportPerson(v.createdBy)) out.createdBy = null;
  return out;
}

export function cleanUserView(u) {
  return { ...u, createdBy: isSupportPerson(u.createdBy) ? null : u.createdBy, history: visibleHistory(u.history) };
}

/**
 * Router middleware: for anyone but Fidelsya, run every JSON response through `clean`
 * (objects and arrays; items cleaned to null are dropped from arrays).
 */
export const hideFidelsya = (clean) => (req, res, next) => {
  if (isFidelsya(req)) return next();
  const send = res.json.bind(res);
  res.json = (body) => {
    if (Array.isArray(body)) return send(body.map(clean).filter((x) => x !== null));
    if (body && typeof body === 'object' && !body.error) {
      const c = clean(body);
      return send(c === null ? { ok: true } : c);
    }
    return send(body);
  };
  return next();
};
