import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  IndianRupee,
  PhoneCall,
  Smile,
  Star,
  Target,
  Trophy,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { api } from '@/services/crmApi';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { fetchActivity, useTeamStore } from '@/features/admin/store/useTeamStore';
import { Card, OutcomeBadge, StatusBadge, fieldCls } from '@/features/admin/components/ui';
import { OutcomeTag, Stars } from '@/features/admin/components/visitUi';
import { CHART, Donut } from '@/features/admin/components/charts';
import {
  ACTIVITY_LABEL,
  ActiveBadge,
  RoleBadge,
  DeviceInfo,
} from '@/features/admin/components/teamUi';
import { PERIODS, periodRange } from '@/features/admin/visits';
import {
  IDLE_DAYS,
  daysSince,
  isIdleLead,
  isOverdueLead,
  lastTouch,
} from '@/features/admin/attention';
import { OPEN_STATUSES } from '@/features/admin/constants';
import { fmtDate, fmtDateTime, inr, inrShort } from '@/features/admin/utils';
import PageLoader from '@/components/common/PageLoader';
import { cn } from '@/utils/cn';

const PAGE = 25;
const inPeriod = (iso, from, to) => !!iso && (!from || iso >= from) && (!to || iso <= to);
/** A lead counts for the person it is assigned to; if nobody is assigned, for whoever added it (same as Reports). */
const creditOf = (l) => l.assignedTo || l.createdBy;

function Tile({ icon: Icon, label, value, sub, tone }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap font-display text-2xl font-bold leading-none">
          {value}
        </span>
        <span className="block text-xs font-semibold text-slate-500">{label}</span>
        {sub && <span className="block text-[11px] text-slate-400">{sub}</span>}
      </span>
    </Card>
  );
}

function Section({ title, count, children, empty }) {
  return (
    <Card className="mt-6 p-4 sm:p-6">
      <h2 className="font-display text-lg font-bold">
        {title}
        {count !== undefined && (
          <span className="ml-2 text-sm font-semibold text-slate-400">{count}</span>
        )}
      </h2>
      {count === 0 ? <p className="mt-3 text-sm text-slate-500">{empty}</p> : children}
    </Card>
  );
}

function More({ shown, total, onMore }) {
  if (shown >= total) return null;
  return (
    <button
      type="button"
      onClick={onMore}
      className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-50"
    >
      Show more ({total - shown} left)
    </button>
  );
}

/** Owner / co-owner: everything one team member did in a period, on one page. */
export default function PersonPage() {
  const { id } = useParams();
  const users = useTeamStore((s) => s.users);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const teamError = useTeamStore((s) => s.error);
  const loadTeam = useTeamStore((s) => s.load);
  const leads = useCrmStore((s) => s.leads);
  const [period, setPeriod] = useState('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [visits, setVisits] = useState(null);
  const [log, setLog] = useState(null);
  const [limits, setLimits] = useState({
    leads: PAGE,
    calls: PAGE,
    visits: PAGE,
    log: PAGE,
    attention: PAGE,
  });
  const more = (k) => () => setLimits((v) => ({ ...v, [k]: v[k] + PAGE }));

  useEffect(() => {
    if (!useTeamStore.getState().loaded) loadTeam();
  }, [loadTeam]);
  const user = users.find((u) => u.id === id);
  const email = user?.email;
  const { from, to } = periodRange(period, custom);

  useEffect(() => {
    if (user) document.title = `${user.name} | Sai Krishna Homes`;
  }, [user]);

  // site visits and logins come from the server for the period
  useEffect(() => {
    if (!email) return undefined;
    let live = true;
    setVisits(null);
    setLog(null);
    setLimits({ leads: PAGE, calls: PAGE, visits: PAGE, log: PAGE, attention: PAGE });
    const qs = new URLSearchParams(Object.entries({ from, to, guide: email }).filter(([, v]) => v));
    api(`/visits?${qs}`).then(
      (v) => live && setVisits(v),
      () => live && setVisits([]),
    );
    fetchActivity({ email, from, to, limit: 500 }).then(
      (a) => live && setLog(a),
      () => live && setLog([]),
    );
    return () => {
      live = false;
    };
  }, [email, from, to]);

  // leads and calls are already loaded for the owner (all leads)
  const work = useMemo(() => {
    if (!email) return null;
    const mine = leads.filter((l) => creditOf(l)?.email === email);
    const added = mine.filter((l) => inPeriod(l.createdAt, from, to));
    const won = mine.filter((l) => l.closed?.result === 'won' && inPeriod(l.closed.at, from, to));
    const lost = mine.filter((l) => l.closed?.result === 'lost' && inPeriod(l.closed.at, from, to));
    const calls = leads
      .flatMap((l) =>
        (l.attempts || [])
          .filter((a) => a.byEmail === email && inPeriod(a.at, from, to))
          .map((a) => ({ ...a, lead: l })),
      )
      .sort((a, b) => (a.at < b.at ? 1 : -1));
    return {
      mine,
      attention: mine
        .filter((l) => isOverdueLead(l) || isIdleLead(l))
        .sort((a, b) => (lastTouch(a) < lastTouch(b) ? -1 : 1)),
      added,
      open: mine.filter((l) => OPEN_STATUSES.includes(l.status)),
      won,
      lost,
      wonValue: won.reduce((s, l) => s + (Number(l.closed.value || l.dealValue) || 0), 0),
      calls,
      connected: calls.filter((a) => ['connected', 'interested'].includes(a.outcome)).length,
      // the person's leads touched in this period: added, closed or called
      list: mine
        .filter(
          (l) =>
            inPeriod(l.createdAt, from, to) ||
            inPeriod(l.closed?.at, from, to) ||
            calls.some((c) => c.lead.id === l.id),
        )
        .sort((a, b) => ((a.updatedAt || a.createdAt) < (b.updatedAt || b.createdAt) ? 1 : -1)),
    };
  }, [leads, email, from, to]);

  if (!teamLoaded && !teamError) return <PageLoader />;
  if (!user)
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-navy-950">This team member was not found.</p>
        <Link to="/admin/team" className="mt-4 inline-block text-sm font-semibold text-primary-700">
          ← Back to Team
        </Link>
      </div>
    );

  const isVisit = user.role === 'site_visit';
  const showSales = !isVisit || work.mine.length > 0 || work.calls.length > 0;
  const showVisits = isVisit || (visits && visits.length > 0);
  const vs = visits || [];
  const rated = vs.length
    ? Math.round((vs.reduce((s, v) => s + v.rating, 0) / vs.length) * 10) / 10
    : null;
  const sat = {
    s: vs.filter((v) => v.rating >= 4).length,
    n: vs.filter((v) => v.rating === 3).length,
    x: vs.filter((v) => v.rating <= 2).length,
  };
  const closedN = work.won.length + work.lost.length;
  const periodLabel = PERIODS.find((p) => p.id === period)?.label;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/admin/team"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" /> Team
      </Link>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold">{user.name}</h1>
            <RoleBadge role={user.role} />
            <ActiveBadge active={user.active} />
          </div>
          <p className="mt-1 break-all text-sm text-slate-500">
            {user.email}
            {user.phone ? ` · +91 ${user.phone}` : ''} · Last login {fmtDateTime(user.lastLoginAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>
      {period === 'custom' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm lg:justify-end">
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

      {showSales && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile
              icon={UserPlus}
              label="Leads added"
              value={work.added.length}
              sub={periodLabel}
              tone="bg-sky-50 text-sky-700"
            />
            <Tile
              icon={Target}
              label="Open right now"
              value={work.open.length}
              sub="all time"
              tone="bg-amber-50 text-amber-800"
            />
            <Tile
              icon={Trophy}
              label="Won"
              value={work.won.length}
              sub={periodLabel}
              tone="bg-emerald-50 text-emerald-700"
            />
            <Tile
              icon={XCircle}
              label="Lost"
              value={work.lost.length}
              sub={periodLabel}
              tone="bg-rose-50 text-rose-700"
            />
            <Tile
              icon={PhoneCall}
              label="Calls & follow-ups"
              value={work.calls.length}
              sub={`${work.connected} connected`}
              tone="bg-violet-50 text-violet-700"
            />
            <Tile
              icon={IndianRupee}
              label="Sold value"
              value={inrShort(work.wonValue)}
              sub={periodLabel}
              tone="bg-emerald-50 text-emerald-700"
            />
            <Tile
              icon={Target}
              label="Conversion"
              value={closedN ? `${Math.round((work.won.length / closedN) * 100)}%` : '—'}
              sub="won out of closed"
              tone="bg-slate-100 text-slate-700"
            />
            <Tile
              icon={UserPlus}
              label="Total leads"
              value={work.mine.length}
              sub="all time"
              tone="bg-slate-100 text-slate-700"
            />
          </div>

          <Card className="mt-6 grid gap-8 p-4 sm:p-6 md:grid-cols-2">
            <Donut
              title="Deals closed in this period"
              centerLabel="closed"
              slices={[
                { id: 'won', label: 'Won', value: work.won.length, color: CHART.good },
                { id: 'lost', label: 'Lost', value: work.lost.length, color: CHART.bad },
              ]}
            />
            <Donut
              title="Leads added in this period · where they stand now"
              centerLabel="leads"
              slices={[
                {
                  id: 'won',
                  label: 'Won',
                  value: work.added.filter((l) => l.status === 'won').length,
                  color: CHART.good,
                },
                {
                  id: 'open',
                  label: 'Still open',
                  value: work.added.filter((l) => OPEN_STATUSES.includes(l.status)).length,
                  color: CHART.mid,
                },
                {
                  id: 'lost',
                  label: 'Lost',
                  value: work.added.filter((l) => l.status === 'lost').length,
                  color: CHART.bad,
                },
              ]}
            />
          </Card>

          {work.attention.length > 0 && (
            <Card className="mt-6 border-amber-200 bg-amber-50/40 p-4 sm:p-6">
              <h2 className="font-display text-lg font-bold">
                Needs attention
                <span className="ml-2 text-sm font-semibold text-amber-700">
                  {work.attention.length}
                </span>
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Open leads with a missed follow-up date, or no call / message for {IDLE_DAYS}+ days
                (right now, whatever the period).
              </p>
              <ul className="mt-3 divide-y divide-amber-100 text-sm">
                {work.attention.slice(0, limits.attention).map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="min-w-0 flex-1">
                      <Link
                        to={`/admin/leads/${l.id}`}
                        className="font-semibold text-navy-950 hover:text-primary-700"
                      >
                        {l.name}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {' '}
                        · {l.id} · {l.phone}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {isOverdueLead(l) && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                          Follow-up missed · {fmtDate(l.nextFollowUp)}
                        </span>
                      )}
                      {isIdleLead(l) && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                          No contact for {daysSince(lastTouch(l))} days
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <More
                shown={limits.attention}
                total={work.attention.length}
                onMore={more('attention')}
              />
            </Card>
          )}

          <Section
            title="Leads"
            count={work.list.length}
            empty="No leads added, closed or called in this period."
          >
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="py-2 pr-3 font-semibold">Customer</th>
                    <th className="py-2 pr-3 font-semibold">Project</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 pr-3 font-semibold">Added</th>
                    <th className="py-2 font-semibold">Deal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {work.list.slice(0, limits.leads).map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 pr-3">
                        <Link
                          to={`/admin/leads/${l.id}`}
                          className="font-semibold text-navy-950 hover:text-primary-700"
                        >
                          {l.name}
                        </Link>
                        <span className="block text-xs text-slate-500">
                          {l.id} · {l.phone}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">{l.project || '—'}</td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">{fmtDate(l.createdAt)}</td>
                      <td className="py-2.5 text-slate-600">
                        {l.closed?.result === 'won' ? inr(l.closed.value || l.dealValue) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <More shown={limits.leads} total={work.list.length} onMore={more('leads')} />
          </Section>

          <Section
            title="Calls & follow-ups"
            count={work.calls.length}
            empty="No calls or follow-ups logged in this period."
          >
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {work.calls.slice(0, limits.calls).map((a) => (
                <li
                  key={`${a.lead.id}-${a.id}`}
                  className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4"
                >
                  <span className="w-32 shrink-0 text-xs text-slate-500">{fmtDateTime(a.at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-navy-950">{a.type}</span>
                    <span className="text-slate-600"> with </span>
                    <Link
                      to={`/admin/leads/${a.lead.id}`}
                      className="font-semibold text-navy-950 hover:text-primary-700"
                    >
                      {a.lead.name}
                    </Link>
                    {a.note && <span className="block text-slate-600">“{a.note}”</span>}
                  </span>
                  <OutcomeBadge outcome={a.outcome} />
                </li>
              ))}
            </ul>
            <More shown={limits.calls} total={work.calls.length} onMore={more('calls')} />
          </Section>
        </>
      )}

      {showVisits && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile
              icon={CalendarCheck}
              label="Site visits"
              value={visits ? vs.length : '…'}
              sub={periodLabel}
              tone="bg-emerald-50 text-emerald-700"
            />
            <Tile
              icon={UserPlus}
              label="People shown around"
              value={vs.reduce((s, v) => s + (v.people || 1), 0)}
              tone="bg-sky-50 text-sky-700"
            />
            <Tile
              icon={Star}
              label="Average rating"
              value={rated ?? '—'}
              sub="out of 5"
              tone="bg-amber-50 text-amber-800"
            />
            <Tile
              icon={Smile}
              label="Satisfied"
              value={sat.s}
              sub={`${sat.x} not satisfied`}
              tone="bg-emerald-50 text-emerald-700"
            />
          </div>
          <Card className="mt-6 grid gap-8 p-4 sm:p-6 md:grid-cols-2">
            <Donut
              title="Customer satisfaction"
              centerLabel="visits"
              slices={[
                { id: 's', label: 'Satisfied (4–5★)', value: sat.s, color: CHART.good },
                { id: 'n', label: 'Neutral (3★)', value: sat.n, color: CHART.mid },
                { id: 'x', label: 'Not satisfied (1–2★)', value: sat.x, color: CHART.bad },
              ]}
            />
            <div>
              <p className="text-sm font-semibold text-navy-950">What customers decided</p>
              <table className="mt-4 w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['booking', 'Wants to book'],
                    ['follow_up', 'Follow up'],
                    ['thinking', 'Thinking about it'],
                    ['not_interested', 'Not interested'],
                  ].map(([k, label]) => (
                    <tr key={k}>
                      <td className="py-2 text-slate-600">{label}</td>
                      <td className="py-2 text-right font-semibold">
                        {vs.filter((v) => v.outcome === k).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Section
            title="Site visits & feedback"
            count={visits ? vs.length : undefined}
            empty="No site visits in this period."
          >
            {!visits ? (
              <p className="mt-3 text-sm text-slate-500">Loading…</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {vs.slice(0, limits.visits).map((v) => (
                  <li key={v.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-navy-950">{v.customerName}</span>
                      <Stars rating={v.rating} />
                      <OutcomeTag outcome={v.outcome} />
                      <span className="text-xs text-slate-500">
                        {fmtDateTime(v.at)} · {v.project || '—'}
                        {v.people > 1 ? ` · ${v.people} people` : ''}
                      </span>
                    </div>
                    {v.feedback && <p className="mt-1 text-slate-600">“{v.feedback}”</p>}
                  </li>
                ))}
              </ul>
            )}
            <More shown={limits.visits} total={vs.length} onMore={more('visits')} />
          </Section>
        </>
      )}

      <Section
        title="Logins & actions"
        count={log ? log.length : undefined}
        empty="No logins or actions in this period."
      >
        {!log ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {log.slice(0, limits.log).map((a, i) => (
              <li
                key={`${a.at}-${i}`}
                className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-start sm:gap-4"
              >
                <span className="w-32 shrink-0 text-xs text-slate-500">{fmtDateTime(a.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-navy-950">
                    {ACTIVITY_LABEL[a.type] || a.type}
                  </span>
                  {a.target?.name && a.target.email !== user.email && (
                    <span className="text-slate-600"> · {a.target.name}</span>
                  )}
                  {a.note && <span className="text-slate-600"> · {a.note}</span>}
                  <DeviceInfo a={a} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <More shown={limits.log} total={log?.length || 0} onMore={more('log')} />
      </Section>
    </div>
  );
}
