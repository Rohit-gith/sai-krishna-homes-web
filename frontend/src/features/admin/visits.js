import { istDayEnd, istDayStart, istSince } from './utils';

/** Site-visit wording shared by the Visits page, the Reports page and the lead page. */
export const VISIT_OUTCOMES = [
  {
    id: 'booking',
    label: 'Wants to book',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  { id: 'follow_up', label: 'Follow up', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { id: 'thinking', label: 'Thinking about it', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { id: 'not_interested', label: 'Not interested', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
];
export const VISIT_OUTCOME = Object.fromEntries(VISIT_OUTCOMES.map((o) => [o.id, o]));

export const SATISFACTION = {
  satisfied: { label: 'Satisfied', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  neutral: { label: 'Neutral', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  not_satisfied: { label: 'Not satisfied', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
};
export const satisfactionOf = (rating) =>
  rating >= 4 ? 'satisfied' : rating === 3 ? 'neutral' : 'not_satisfied';

/** Date ranges used by Visits and Reports. days = how far back from today. */
export const PERIODS = [
  { id: '7', label: 'Last week', days: 7 },
  { id: '30', label: 'Last month', days: 30 },
  { id: '61', label: 'Last 2 months', days: 61 },
  { id: '92', label: 'Last 3 months', days: 92 },
  { id: '183', label: 'Last 6 months', days: 183 },
  { id: '365', label: 'Last 1 year', days: 365 },
  { id: '730', label: 'Last 2 years', days: 730 },
  { id: 'all', label: 'All time', days: 0 },
  { id: 'custom', label: 'Custom dates…', days: 0 },
];

/** { from, to } ISO strings for a period id (custom uses the given yyyy-mm-dd dates). */
export function periodRange(id, custom = {}) {
  if (id === 'all') return { from: '', to: '' };
  if (id === 'custom') {
    // only complete, sensible dates (while someone is still typing the year it reads "0002")
    const ok = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && Number(d.slice(0, 4)) >= 2000;
    return {
      from: ok(custom.from) ? istDayStart(custom.from) : '',
      to: ok(custom.to) ? istDayEnd(custom.to) : '',
    };
  }
  const days = PERIODS.find((p) => p.id === id)?.days || 30;
  return { from: istSince(days), to: '' }; // counted in India days
}
