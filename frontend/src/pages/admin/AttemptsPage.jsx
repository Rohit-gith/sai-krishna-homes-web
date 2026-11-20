import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Search, X } from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { ATTEMPT_OUTCOMES, ATTEMPT_TYPES, OUTCOME } from '@/features/admin/constants';
import { Card, OutcomeBadge, StatusBadge, fieldCls } from '@/features/admin/components/ui';
import { fmtDateTime } from '@/features/admin/utils';
import { cn } from '@/utils/cn';

const PERIODS = [
  { id: '', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
];
const PAGE = 20;
// compact selects on phones so all three fit on one row
const sel = 'min-w-0 truncate px-2.5 text-sm sm:px-4 sm:text-base';

const since = (period) => {
  if (!period) return '';
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period !== 'today') d.setDate(d.getDate() - Number(period) + 1);
  return d.toISOString();
};

/** One attempt line (used inside a customer card and in the timeline). */
function AttemptRow({ a, showLead }) {
  const body = (
    <>
      <span className="w-32 shrink-0 text-xs text-slate-500">{fmtDateTime(a.at)}</span>
      <span className="min-w-0 flex-1">
        {showLead && (
          <span className="block truncate font-semibold">
            {a.lead.name} <span className="font-normal text-slate-500">· {a.lead.id}</span>
          </span>
        )}
        <span className={cn('block text-sm', showLead ? 'text-slate-500' : 'text-slate-700')}>
          {a.note || <i className="text-slate-400">No note</i>}
        </span>
        {a.by && <span className="block text-[11px] text-slate-400">by {a.by}</span>}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
          {a.type}
        </span>
        <OutcomeBadge outcome={a.outcome} />
      </span>
    </>
  );
  return showLead ? (
    <Link
      to={`/admin/leads/${a.lead.id}`}
      className="flex flex-col gap-2 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
    >
      {body}
    </Link>
  ) : (
    <div className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      {body}
    </div>
  );
}

/** A customer with all their (matching) attempts, newest first; tap to open the list. */
function CustomerCard({ lead, attempts, open, onToggle }) {
  const last = attempts[0];
  const counts = ATTEMPT_OUTCOMES.map((o) => ({
    ...o,
    n: attempts.filter((a) => a.outcome === o.id).length,
  })).filter((o) => o.n);
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-col gap-3 p-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[15px] font-semibold">{lead.name}</span>
            <StatusBadge status={lead.status} />
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {lead.id} · +91 {lead.phone}
            {lead.project ? ` · ${lead.project}` : ''}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {counts.map((o) => (
              <span
                key={o.id}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                  o.badge,
                )}
              >
                {o.n} {o.label}
              </span>
            ))}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-4 sm:text-right">
          <span>
            <span className="block text-xs text-slate-500">Last attempt</span>
            <span className="block text-sm font-semibold">{fmtDateTime(last.at)}</span>
            <span className="block text-xs text-slate-500">
              {last.type} · {OUTCOME[last.outcome]?.label || last.outcome}
            </span>
          </span>
          <span className="flex flex-col items-center">
            <span className="font-display text-2xl font-bold leading-none">{attempts.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {attempts.length === 1 ? 'attempt' : 'attempts'}
            </span>
          </span>
          <ChevronDown
            className={cn('h-5 w-5 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <div className="divide-y divide-slate-100">
            {attempts.map((a) => (
              <AttemptRow key={a.id} a={a} />
            ))}
          </div>
          <Link
            to={`/admin/leads/${lead.id}`}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-primary-700 hover:underline"
          >
            Open {lead.id} to log a new attempt <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AttemptsPage() {
  const leads = useCrmStore((s) => s.leads);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [period, setPeriod] = useState('');
  const [view, setView] = useState('customers');
  const [openId, setOpenId] = useState(null);
  const [limit, setLimit] = useState(PAGE);

  const all = useMemo(
    () =>
      leads
        .flatMap((l) => l.attempts.map((a) => ({ ...a, lead: l })))
        .sort((a, b) => b.at.localeCompare(a.at)),
    [leads],
  );

  // search by name, phone (any part) or lead ID
  const term = q.trim().toLowerCase();
  const digits = term.replace(/\D/g, '');
  const matchLead = (l) =>
    !term ||
    l.name.toLowerCase().includes(term) ||
    l.id.toLowerCase().includes(term) ||
    (digits.length >= 3 && l.phone.includes(digits));
  const from = since(period);
  const rows = all.filter(
    (a) =>
      (!type || a.type === type) &&
      (!outcome || a.outcome === outcome) &&
      (!from || a.at >= from) &&
      matchLead(a.lead),
  );

  // group by customer, customers with the most recent attempt first
  const customers = useMemo(() => {
    const map = new Map();
    for (const a of rows) {
      if (!map.has(a.lead.id)) map.set(a.lead.id, { lead: a.lead, attempts: [] });
      map.get(a.lead.id).attempts.push(a);
    }
    return [...map.values()];
  }, [rows]);

  const summary = ATTEMPT_OUTCOMES.map((o) => ({
    ...o,
    count: all.filter((a) => a.outcome === o.id).length,
  }));
  const filtered = Boolean(term || type || outcome || period);
  const shownCount = view === 'customers' ? customers.length : rows.length;
  const nAttempts = `${rows.length} ${rows.length === 1 ? 'attempt' : 'attempts'}`;
  const resetFilters = () => {
    setQ('');
    setType('');
    setOutcome('');
    setPeriod('');
    setLimit(PAGE);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold">Attempts</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every call, WhatsApp, visit and meeting across all leads. Log new ones from a lead’s page.
      </p>

      {/* phones: one swipeable row; wider screens: five tiles */}
      <div className="-mx-4 mt-5 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {summary.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOutcome(outcome === o.id ? '' : o.id)}
            className={`min-w-[8.5rem] shrink-0 snap-start rounded-2xl border bg-white p-3 text-left transition-shadow hover:shadow-soft sm:min-w-0 sm:p-4 ${outcome === o.id ? 'border-navy-900' : 'border-slate-200'}`}
          >
            <p className="font-display text-2xl font-bold">{o.count}</p>
            <OutcomeBadge outcome={o.id} />
          </button>
        ))}
      </div>

      {/* search + filters */}
      <div className="mt-4 grid gap-2 sm:gap-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search customer</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={cn(fieldCls, 'pl-10 pr-10')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search name, mobile or lead ID (SKH-0105)"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-navy-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[34rem]">
          <select
            className={cn(fieldCls, sel)}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Date"
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            className={cn(fieldCls, sel)}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Type"
          >
            <option value="">All types</option>
            {ATTEMPT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            className={cn(fieldCls, sel)}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            aria-label="Outcome"
          >
            <option value="">All outcomes</option>
            {ATTEMPT_OUTCOMES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* view switch + result count */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold"
          role="tablist"
          aria-label="View"
        >
          {[
            ['customers', 'By customer'],
            ['timeline', 'Timeline'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => {
                setView(id);
                setLimit(PAGE);
              }}
              className={cn(
                'rounded-lg px-3.5 py-1.5',
                view === id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          {view === 'customers'
            ? `${customers.length} ${customers.length === 1 ? 'customer' : 'customers'} · ${nAttempts}`
            : nAttempts}
          {filtered && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-3 font-semibold text-primary-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>
      </div>

      <Card className="mt-3 divide-y divide-slate-100">
        {view === 'customers'
          ? customers
              .slice(0, limit)
              .map((c) => (
                <CustomerCard
                  key={c.lead.id}
                  lead={c.lead}
                  attempts={c.attempts}
                  open={
                    openId === c.lead.id ||
                    (customers.length === 1 && openId !== `closed:${c.lead.id}`)
                  }
                  onToggle={() =>
                    setOpenId((cur) =>
                      cur === c.lead.id || (customers.length === 1 && cur !== `closed:${c.lead.id}`)
                        ? `closed:${c.lead.id}`
                        : c.lead.id,
                    )
                  }
                />
              ))
          : rows.slice(0, limit).map((a) => <AttemptRow key={a.id} a={a} showLead />)}
        {shownCount === 0 && (
          <p className="p-10 text-center text-slate-500">
            {filtered ? 'No attempts match these filters.' : 'No attempts found.'}
          </p>
        )}
      </Card>

      {shownCount > limit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary-500"
          >
            Show {Math.min(PAGE, shownCount - limit)} more ({shownCount - limit} left)
          </button>
        </div>
      )}
    </div>
  );
}
