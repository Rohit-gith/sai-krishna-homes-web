import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, IndianRupee, Plus, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { STATUSES, OPEN_STATUSES, PROJECTS } from '@/features/admin/constants';
import { Card, StatusBadge, Btn } from '@/features/admin/components/ui';
import LeadFormModal from '@/features/admin/components/LeadFormModal';
import { inrShort, fmtDate, fmtDateTime, isToday, isOverdue } from '@/features/admin/utils';

function Kpi({ icon: Icon, label, value, sub, tone }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-display text-[1.75rem] font-bold leading-none text-navy-950">{value}</p>
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const leads = useCrmStore((s) => s.leads);
  const clearDemo = useCrmStore((s) => s.clearDemo);
  const [adding, setAdding] = useState(false);

  const m = useMemo(() => {
    const open = leads.filter((l) => OPEN_STATUSES.includes(l.status));
    const won = leads.filter((l) => l.status === 'won');
    const lost = leads.filter((l) => l.status === 'lost');
    const closed = won.length + lost.length;
    const weekAgo = Date.now() - 7 * 864e5;
    const attempts = leads.flatMap((l) => l.attempts.map((a) => ({ ...a, lead: l })));
    return {
      total: leads.length,
      open,
      pipeline: open.reduce((s, l) => s + (l.dealValue || l.budget || 0), 0),
      wonValue: won.reduce((s, l) => s + (l.closed?.value || l.dealValue || 0), 0),
      won,
      lost,
      conversion: closed ? Math.round((won.length / closed) * 100) : 0,
      newThisWeek: leads.filter((l) => new Date(l.createdAt) >= weekAgo).length,
      attemptsWeek: attempts.filter((a) => new Date(a.at) >= weekAgo).length,
      dueToday: open.filter((l) => isToday(l.nextFollowUp)),
      overdue: open.filter((l) => isOverdue(l.nextFollowUp)),
      byStatus: STATUSES.map((s) => ({ ...s, count: leads.filter((l) => l.status === s.id).length })),
      byProject: PROJECTS.map((p) => {
        const pl = leads.filter((l) => l.project === p);
        return {
          name: p,
          leads: pl.length,
          won: pl.filter((l) => l.status === 'won').length,
          value: pl.filter((l) => l.status === 'won').reduce((s, l) => s + (l.closed?.value || l.dealValue || 0), 0),
        };
      }),
      recent: leads
        .flatMap((l) => l.history.map((h) => ({ ...h, lead: l })))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8),
    };
  }, [leads]);

  const maxStatus = Math.max(1, ...m.byStatus.map((s) => s.count));
  const hasDemo = leads.some((l) => l.demo);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-700">Sai Krishna Homes</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Dashboard</h1>
        </div>
        <Btn onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add new lead
        </Btn>
      </div>

      {hasDemo && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>Showing <b>sample leads</b> (names start with “Sample:”) so you can try every feature. Remove them before real use.</p>
          <Btn variant="outline" className="shrink-0" onClick={() => window.confirm('Remove all sample leads?') && clearDemo()}>
            Remove sample data
          </Btn>
        </div>
      )}

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={IndianRupee} label="Open pipeline value" value={inrShort(m.pipeline)} sub={`${m.open.length} open deals`} tone="bg-violet-50 text-violet-700" />
        <Kpi icon={Trophy} label="Won (sales value)" value={inrShort(m.wonValue)} sub={`${m.won.length} deals won`} tone="bg-emerald-50 text-emerald-700" />
        <Kpi icon={Target} label="Conversion rate" value={`${m.conversion}%`} sub={`${m.won.length} won / ${m.lost.length} lost`} tone="bg-amber-50 text-amber-700" />
        <Kpi icon={Users} label="Total leads" value={m.total} sub={`${m.newThisWeek} new · ${m.attemptsWeek} attempts this week`} tone="bg-sky-50 text-sky-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Pipeline by status */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Pipeline by status</h2>
            <Link to="/admin/leads" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          <ul className="mt-5 space-y-3">
            {m.byStatus.map((s) => (
              <li key={s.id}>
                <Link to={`/admin/leads?status=${s.id}`} className="group grid grid-cols-[7rem_1fr_2rem] items-center gap-3">
                  <StatusBadge status={s.id} className="justify-self-start" />
                  <span className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <span className={`block h-full rounded-full ${s.bar} transition-all group-hover:opacity-80`} style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                  </span>
                  <span className="text-right text-sm font-bold">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Follow-ups */}
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <CalendarClock className="h-5 w-5 text-primary-600" /> Follow-ups
          </h2>
          {m.overdue.length === 0 && m.dueToday.length === 0 && <p className="mt-4 text-sm text-slate-500">Nothing due today. 🎉</p>}
          <ul className="mt-4 divide-y divide-slate-100">
            {[...m.overdue.map((l) => [l, true]), ...m.dueToday.map((l) => [l, false])].map(([l, late]) => (
              <li key={l.id}>
                <Link to={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{l.name}</span>
                    <span className="text-xs text-slate-500">{l.id} · {l.phone}</span>
                  </span>
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${late ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
                    {late && <AlertTriangle className="h-3 w-3" />}
                    {late ? `Overdue · ${fmtDate(l.nextFollowUp)}` : 'Today'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* By project */}
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-primary-600" /> By project
          </h2>
          <ul className="mt-4 space-y-4">
            {m.byProject.map((p) => (
              <li key={p.name} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold">{p.name}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <span><b className="block text-lg">{p.leads}</b><span className="text-slate-500">leads</span></span>
                  <span><b className="block text-lg">{p.won}</b><span className="text-slate-500">won</span></span>
                  <span><b className="block text-lg">{inrShort(p.value)}</b><span className="text-slate-500">sold</span></span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Activity */}
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {m.recent.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                <span className="min-w-0 flex-1">
                  <Link to={`/admin/leads/${h.lead.id}`} className="font-semibold hover:underline">{h.lead.name}</Link>
                  <span className="text-slate-600"> · {h.text}</span>
                  <span className="block text-xs text-slate-400">{fmtDateTime(h.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <LeadFormModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
