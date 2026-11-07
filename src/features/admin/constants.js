/** Lead pipeline. Order matters: it is the sales funnel left → right. */
export const STATUSES = [
  { id: 'new', label: 'New', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 ring-sky-200', bar: 'bg-sky-500' },
  { id: 'contacted', label: 'Contacted', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 ring-amber-200', bar: 'bg-amber-500' },
  { id: 'visit', label: 'Site visit', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 ring-violet-200', bar: 'bg-violet-500' },
  { id: 'negotiation', label: 'Negotiation', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 ring-orange-200', bar: 'bg-orange-500' },
  { id: 'won', label: 'Won', dot: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-600' },
  { id: 'lost', label: 'Lost', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-rose-200', bar: 'bg-rose-500' },
];
export const STATUS = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
export const OPEN_STATUSES = ['new', 'contacted', 'visit', 'negotiation'];
/** Won / Lost are closed through the "commit" dialog, never by bulk update. */
export const CLOSED_STATUSES = ['won', 'lost'];

export const PROJECTS = ['Panchawati Residency', 'Sai Krishna Residency'];
export const CONFIGS = ['Studio', '1 BHK', '2 BHK', '3 BHK', 'Commercial'];
export const SOURCES = ['Website', 'Walk-in', 'Phone call', 'WhatsApp', 'Referral', 'Facebook', 'Instagram', 'Excel import', 'Other'];

export const ATTEMPT_TYPES = ['Call', 'WhatsApp', 'Site visit', 'Email', 'Meeting'];
export const ATTEMPT_OUTCOMES = [
  { id: 'connected', label: 'Connected', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { id: 'interested', label: 'Interested', badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { id: 'callback', label: 'Call back later', badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { id: 'no-answer', label: 'No answer', badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
  { id: 'not-interested', label: 'Not interested', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
];
export const OUTCOME = Object.fromEntries(ATTEMPT_OUTCOMES.map((o) => [o.id, o]));

export const LOST_REASONS = ['Budget mismatch', 'Bought elsewhere', 'Location', 'Loan not approved', 'Not responding', 'Plan postponed', 'Other'];

/**
 * Demo login. There is no backend yet, so this only keeps casual visitors out; it is NOT real
 * security (anyone can read it in the browser). Replace with server-side auth before going live.
 */
export const DEMO_ADMIN = { email: 'admin@saikrishnahomes.in', password: 'Admin@2026' };
