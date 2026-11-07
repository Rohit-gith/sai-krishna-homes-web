import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { ATTEMPT_OUTCOMES, ATTEMPT_TYPES } from '@/features/admin/constants';
import { Card, OutcomeBadge, StatusBadge, fieldCls } from '@/features/admin/components/ui';
import { fmtDateTime } from '@/features/admin/utils';

export default function AttemptsPage() {
  const leads = useCrmStore((s) => s.leads);
  const [type, setType] = useState('');
  const [outcome, setOutcome] = useState('');

  const all = useMemo(
    () =>
      leads
        .flatMap((l) => l.attempts.map((a) => ({ ...a, lead: l })))
        .sort((a, b) => b.at.localeCompare(a.at)),
    [leads],
  );
  const rows = all.filter((a) => (!type || a.type === type) && (!outcome || a.outcome === outcome));

  const summary = ATTEMPT_OUTCOMES.map((o) => ({ ...o, count: all.filter((a) => a.outcome === o.id).length }));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold">Attempts</h1>
      <p className="mt-1 text-sm text-slate-500">Every call, WhatsApp, visit and meeting across all leads. Log new ones from a lead’s page.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOutcome(outcome === o.id ? '' : o.id)}
            className={`rounded-2xl border bg-white p-4 text-left transition-shadow hover:shadow-soft ${outcome === o.id ? 'border-navy-900' : 'border-slate-200'}`}
          >
            <p className="font-display text-2xl font-bold">{o.count}</p>
            <OutcomeBadge outcome={o.id} />
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:w-[30rem]">
        <select className={fieldCls} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">All types</option>
          {ATTEMPT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className={fieldCls} value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Outcome">
          <option value="">All outcomes</option>
          {ATTEMPT_OUTCOMES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      <Card className="mt-4 divide-y divide-slate-100">
        {rows.map((a) => (
          <Link key={a.id} to={`/admin/leads/${a.lead.id}`} className="flex flex-col gap-2 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-32 shrink-0 text-xs text-slate-500">{fmtDateTime(a.at)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{a.lead.name}</span>
              <span className="text-xs text-slate-500">{a.lead.id}{a.note ? ` · ${a.note}` : ''}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{a.type}</span>
              <OutcomeBadge outcome={a.outcome} />
              <StatusBadge status={a.lead.status} />
            </span>
          </Link>
        ))}
        {rows.length === 0 && <p className="p-10 text-center text-slate-500">No attempts found.</p>}
      </Card>
    </div>
  );
}
