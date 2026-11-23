import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarCheck,
  Download,
  IndianRupee,
  MapPinned,
  PhoneCall,
  Smile,
  Star,
  Target,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { api } from '@/services/crmApi';
import { Btn, Card, fieldCls } from '@/features/admin/components/ui';
import { Stars } from '@/features/admin/components/visitUi';
import { CHART, Donut } from '@/features/admin/components/charts';
import { PERIODS, periodRange } from '@/features/admin/visits';
import { downloadCsv, fmtDate, fmtDateTime, inr, inrShort } from '@/features/admin/utils';
import { cn } from '@/utils/cn';

function Tile({ icon: Icon, label, value, sub, tone }) {
  return (
    <Card className="flex min-w-[11rem] shrink-0 snap-start items-center gap-3 p-4 sm:min-w-0">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block whitespace-nowrap font-display font-bold leading-none',
            String(value).length > 6 ? 'text-xl' : 'text-2xl',
          )}
        >
          {value}
        </span>
        <span className="block text-xs font-semibold text-slate-500">{label}</span>
        {sub && <span className="block text-[11px] text-slate-400">{sub}</span>}
      </span>
    </Card>
  );
}

const Inactive = () => (
  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
    Inactive
  </span>
);

/** Satisfied / neutral / not satisfied as one bar. */
function SatBar({ s, n, x }) {
  const total = s + n + x;
  if (!total) return <span className="text-xs text-slate-400">—</span>;
  const pct = (v) => `${(v / total) * 100}%`;
  return (
    <span className="block w-full max-w-[13rem]">
      {/* same colours as the satisfaction donut; small gaps keep the segments apart */}
      <span className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {[
          [s, CHART.good],
          [n, CHART.mid],
          [x, CHART.bad],
        ]
          .filter(([v]) => v > 0)
          .map(([v, color]) => (
            <span
              key={color}
              className="rounded-full"
              style={{ width: pct(v), background: color }}
            />
          ))}
      </span>
      <span className="mt-1 block text-[11px] text-slate-500">
        {s} satisfied · {n} neutral · {x} not
      </span>
    </span>
  );
}

/** Team performance for a period: sales executives (leads, deals) and site-visit executives (visits, ratings). */
export default function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null); // whose feedback is expanded

  const load = useCallback(async () => {
    setError('');
    const { from, to } = periodRange(period, custom);
    if (period === 'custom' && (!from || !to)) return;
    const qs = new URLSearchParams(Object.entries({ from, to }).filter(([, v]) => v));
    try {
      setData(await api(`/reports${qs.toString() ? `?${qs}` : ''}`));
    } catch (e) {
      setError(e.message);
    }
  }, [period, custom]);

  useEffect(() => {
    document.title = 'Reports | Sai Krishna Homes';
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const label = PERIODS.find((p) => p.id === period)?.label;
  const rangeText = data
    ? `${period === 'all' ? 'All time' : `${fmtDate(data.from)} – ${fmtDate(data.to > new Date().toISOString() ? new Date().toISOString() : data.to)}`}`
    : '';

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      [`Sai Krishna Homes team report · ${rangeText}`],
      [],
      [
        'SALES',
        'Email',
        'Active',
        'New leads',
        'Still open',
        'Won',
        'Won value (Rs)',
        'Lost',
        'Conversion %',
        'Calls & follow-ups',
        'Connected',
      ],
      ...data.sales.map((s) => [
        s.name,
        s.email,
        s.active ? 'Yes' : 'No',
        s.newLeads,
        s.open,
        s.won,
        s.wonValue,
        s.lost,
        s.conversion ?? '',
        s.attempts,
        s.connected,
      ]),
      ['Website / not assigned', '', '', data.totals.unassignedNew],
      [],
      [
        'SITE VISITS',
        'Email',
        'Active',
        'Visits',
        'People',
        'Average rating',
        'Satisfied',
        'Neutral',
        'Not satisfied',
        'Want to book',
        'Follow up',
        'Thinking',
        'Not interested',
      ],
      ...data.visits.map((v) => [
        v.name,
        v.email,
        v.active ? 'Yes' : 'No',
        v.visits,
        v.people,
        v.avgRating ?? '',
        v.satisfied,
        v.neutral,
        v.notSatisfied,
        v.outcomes.booking,
        v.outcomes.follow_up,
        v.outcomes.thinking,
        v.outcomes.not_interested,
      ]),
    ];
    downloadCsv(`sai-krishna-team-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const t = data?.totals;
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            How each team member is doing{rangeText ? ` · ${rangeText}` : ''}. A lead counts for the
            person it is assigned to, else for whoever added it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={cn(fieldCls, 'w-auto')}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Period"
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <Btn variant="outline" onClick={exportCsv} disabled={!data}>
            <Download className="h-4 w-4" /> Export
          </Btn>
        </div>
      </div>
      {period === 'custom' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm sm:justify-end">
          <span className="text-slate-500">From</span>
          <input
            type="date"
            className={cn(fieldCls, 'w-auto')}
            value={custom.from}
            onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            className={cn(fieldCls, 'w-auto')}
            value={custom.to}
            onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
          />
        </div>
      )}
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {!data ? (
        <Card className="mt-6 p-10 text-center text-slate-500">
          {period === 'custom' ? 'Pick both dates.' : 'Loading…'}
        </Card>
      ) : (
        <>
          <div className="-mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 xl:grid-cols-6">
            <Tile
              icon={UserPlus}
              label="New leads"
              value={t.newLeads}
              sub={t.unassignedNew ? `${t.unassignedNew} not assigned` : label}
              tone="bg-sky-50 text-sky-700"
            />
            <Tile
              icon={Trophy}
              label="Deals won"
              value={t.won}
              sub={`${t.lost} lost`}
              tone="bg-emerald-50 text-emerald-700"
            />
            <Tile
              icon={IndianRupee}
              label="Won value"
              value={inrShort(t.wonValue)}
              tone="bg-primary-50 text-primary-700"
            />
            <Tile
              icon={PhoneCall}
              label="Calls & follow-ups"
              value={t.attempts}
              tone="bg-slate-100 text-navy-900"
            />
            <Tile
              icon={MapPinned}
              label="Site visits"
              value={t.visits}
              sub={`${t.people} people`}
              tone="bg-violet-50 text-violet-700"
            />
            <Tile
              icon={Smile}
              label="Satisfied visitors"
              value={t.visits ? `${Math.round((t.satisfied / t.visits) * 100)}%` : '—'}
              sub={t.avgRating ? `avg ${t.avgRating} ★` : ''}
              tone="bg-emerald-50 text-emerald-700"
            />
          </div>

          {/* Charts: where things stand, at a glance (each with its own table of numbers) */}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Card className="p-5">
              <Donut
                title="Leads that came in"
                centerLabel="leads"
                slices={[
                  { id: 'won', label: 'Won', value: t.status?.won || 0, color: CHART.good },
                  { id: 'open', label: 'Still open', value: t.status?.open || 0, color: CHART.mid },
                  { id: 'lost', label: 'Lost', value: t.status?.lost || 0, color: CHART.bad },
                ]}
                emptyText="No new leads in this period."
              />
            </Card>
            <Card className="p-5">
              <Donut
                title="Deals closed in this period"
                centerLabel="closed"
                slices={[
                  { id: 'won', label: 'Won', value: t.won, color: CHART.good },
                  { id: 'lost', label: 'Lost', value: t.lost, color: CHART.bad },
                ]}
                emptyText="No deals were closed in this period."
              />
            </Card>
            <Card className="p-5">
              <Donut
                title="Site visit satisfaction"
                centerLabel="visits"
                slices={[
                  { id: 'sat', label: 'Satisfied (4-5★)', value: t.satisfied, color: CHART.good },
                  {
                    id: 'neu',
                    label: 'Neutral (3★)',
                    value: Math.max(0, t.visits - t.satisfied - t.notSatisfied),
                    color: CHART.mid,
                  },
                  {
                    id: 'not',
                    label: 'Not satisfied (1-2★)',
                    value: t.notSatisfied,
                    color: CHART.bad,
                  },
                ]}
                emptyText="No site visits in this period."
              />
            </Card>
          </div>

          {/* Sales */}
          <h2 className="mt-8 flex items-center gap-2 font-display text-xl font-bold">
            <Target className="h-5 w-5 text-primary-600" /> Sales executives
          </h2>
          <Card className="mt-3 overflow-hidden">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Team member</th>
                    <th className="px-3 py-3 text-right">New leads</th>
                    <th className="px-3 py-3 text-right">Still open</th>
                    <th className="px-3 py-3 text-right">Won</th>
                    <th className="px-3 py-3 text-right">Won value</th>
                    <th className="px-3 py-3 text-right">Lost</th>
                    <th className="px-3 py-3 text-right">Conversion</th>
                    <th className="px-3 py-3 text-right">Calls & follow-ups</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.sales.map((s) => (
                    <tr key={s.email}>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{s.name}</span>
                        {!s.active && <Inactive />}
                        <span className="block text-xs text-slate-500">{s.email}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">{s.newLeads}</td>
                      <td className="px-3 py-3 text-right">{s.open}</td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                        {s.won}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        {s.wonValue ? inr(s.wonValue) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-rose-600">{s.lost}</td>
                      <td className="px-3 py-3 text-right">
                        {s.conversion == null ? '—' : `${s.conversion}%`}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {s.attempts}
                        {s.attempts > 0 && (
                          <span className="block text-[11px] text-slate-400">
                            {s.connected} connected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {t.unassignedNew > 0 && (
                    <tr className="bg-slate-50/60 text-slate-500">
                      <td className="px-4 py-3 italic">Website / not assigned</td>
                      <td className="px-3 py-3 text-right font-semibold">{t.unassignedNew}</td>
                      <td colSpan={6} className="px-3 py-3 text-xs">
                        Assign these leads from the Leads page to give someone credit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {data.sales.map((s) => (
                <li key={s.email} className="p-4">
                  <p className="font-semibold">
                    {s.name}
                    {!s.active && <Inactive />}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      ['New', s.newLeads],
                      ['Won', s.won],
                      ['Lost', s.lost],
                      ['Open', s.open],
                      ['Conversion', s.conversion == null ? '—' : `${s.conversion}%`],
                      ['Calls', s.attempts],
                    ].map(([k, v]) => (
                      <span key={k} className="rounded-xl bg-slate-50 p-2">
                        <span className="block text-base font-bold">{v}</span>
                        {k}
                      </span>
                    ))}
                  </div>
                  {s.wonValue > 0 && (
                    <p className="mt-2 text-sm font-semibold text-emerald-700">
                      Won {inr(s.wonValue)}
                    </p>
                  )}
                </li>
              ))}
              {t.unassignedNew > 0 && (
                <li className="p-4 text-sm text-slate-500">
                  {t.unassignedNew} new website / not-assigned leads
                </li>
              )}
            </ul>
            {data.sales.length === 0 && (
              <p className="p-8 text-center text-slate-500">
                No sales executives yet. Add them on the Team page.
              </p>
            )}
          </Card>

          {/* Site visits */}
          <h2 className="mt-8 flex items-center gap-2 font-display text-xl font-bold">
            <CalendarCheck className="h-5 w-5 text-primary-600" /> Site visit executives
          </h2>
          <div className="mt-3 space-y-3">
            {data.visits.map((v) => (
              <Card key={v.email} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="min-w-0 xl:w-56">
                    <p className="font-semibold">
                      {v.name}
                      {!v.active && <Inactive />}
                    </p>
                    <p className="text-xs text-slate-500">{v.email}</p>
                  </div>
                  <div className="grid flex-1 grid-cols-2 items-start gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-5">
                    <span>
                      <span className="block font-display text-2xl font-bold leading-none">
                        {v.visits}
                      </span>
                      <span className="text-xs text-slate-500">visits</span>
                    </span>
                    <span>
                      <span className="block font-display text-2xl font-bold leading-none">
                        {v.people}
                      </span>
                      <span className="text-xs text-slate-500">people</span>
                    </span>
                    <span>
                      {v.avgRating ? (
                        <>
                          <Stars rating={Math.round(v.avgRating)} />
                          <span className="block text-xs text-slate-500">avg {v.avgRating} ★</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">No rating</span>
                      )}
                    </span>
                    <SatBar s={v.satisfied} n={v.neutral} x={v.notSatisfied} />
                    <span className="text-xs text-slate-600">
                      <b className="text-emerald-700">{v.outcomes.booking}</b> want to book
                      <br />
                      {v.outcomes.follow_up} follow up · {v.outcomes.thinking} thinking
                      <br />
                      {v.outcomes.not_interested} not interested
                    </span>
                  </div>
                  {v.latestFeedback.length > 0 && (
                    <Btn
                      variant="outline"
                      onClick={() => setOpen(open === v.email ? null : v.email)}
                    >
                      <BarChart3 className="h-4 w-4" />{' '}
                      {open === v.email ? 'Hide feedback' : 'Feedback'}
                    </Btn>
                  )}
                </div>
                {open === v.email && (
                  <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    {v.latestFeedback.map((f) => (
                      <li key={f.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <span className="flex flex-wrap items-center gap-2">
                          <b>{f.customerName}</b>
                          <Stars rating={f.rating} />
                          <span className="text-xs text-slate-400">
                            {f.id} · {fmtDateTime(f.at)}
                          </span>
                        </span>
                        <span className="mt-1 block text-slate-700">“{f.feedback}”</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
            {data.visits.length === 0 && (
              <Card className="p-8 text-center text-slate-500">
                <Star className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-2">No site visit executives or visits in this period.</p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
