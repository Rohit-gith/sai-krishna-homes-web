import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  History,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Smile,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { api } from '@/services/crmApi';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { can, hasLeadAccess, isManager } from '@/features/admin/access';
import GreetingBanner from '@/features/admin/components/GreetingBanner';
import { Btn, Card, Modal, fieldCls } from '@/features/admin/components/ui';
import {
  OutcomeTag,
  SatisfactionBadge,
  Stars,
  VisitFormModal,
} from '@/features/admin/components/visitUi';
import {
  PERIODS,
  SATISFACTION,
  VISIT_OUTCOMES,
  periodRange,
  satisfactionOf,
} from '@/features/admin/visits';
import { fmtDateTime } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

const PAGE = 30;

export default function VisitsPage() {
  const me = useAuthStore((s) => s.user);
  const toast = useUiStore((s) => s.showToast);
  const seeAll = isManager(me) || can(me, 'visits.view_all');
  const canLog = can(me, 'visits.log');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [guides, setGuides] = useState([]);
  const [period, setPeriod] = useState('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [guide, setGuide] = useState('');
  const [sat, setSat] = useState('');
  const [outcome, setOutcome] = useState('');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState(null); // visit, or 'new'
  const [historyOf, setHistoryOf] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const { from, to } = periodRange(period, custom);
    const qs = new URLSearchParams(Object.entries({ from, to, guide }).filter(([, v]) => v));
    try {
      setList(await api(`/visits${qs.toString() ? `?${qs}` : ''}`));
    } catch (e) {
      setError(e.message);
      setList([]);
    }
  }, [period, custom, guide]);

  useEffect(() => {
    document.title = 'Site visits | Sai Krishna Homes';
    api('/visits/guides').then(setGuides, () => setGuides([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setLimit(PAGE), [period, custom, guide, sat, outcome, q]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    return (list || []).filter(
      (v) =>
        (!sat || satisfactionOf(v.rating) === sat) &&
        (!outcome || v.outcome === outcome) &&
        (!t ||
          [v.id, v.customerName, v.feedback, v.leadId].some((x) => x?.toLowerCase().includes(t)) ||
          (digits.length >= 4 && v.phone.includes(digits))),
    );
  }, [list, sat, outcome, q]);

  const stats = useMemo(() => {
    const n = rows.length;
    return {
      visits: n,
      people: rows.reduce((s, v) => s + (v.people || 1), 0),
      avg: n ? (rows.reduce((s, v) => s + v.rating, 0) / n).toFixed(1) : '—',
      satisfied: n ? Math.round((rows.filter((v) => v.rating >= 4).length / n) * 100) : 0,
      booking: rows.filter((v) => v.outcome === 'booking').length,
    };
  }, [rows]);

  const remove = async (v) => {
    if (!window.confirm(`Delete visit ${v.id} (${v.customerName})? This cannot be undone.`)) return;
    try {
      await api(`/visits/${v.id}`, { method: 'DELETE' });
      toast(`${v.id} deleted`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const mayEdit = (v) =>
    can(me, 'visits.manage') || v.guide?.email === me?.email || v.createdBy?.email === me?.email;
  const filtered = Boolean(guide || sat || outcome || q.trim());

  return (
    <div className="mx-auto max-w-7xl">
      {/* this is the first page for site-visit executives: greet them here */}
      {!hasLeadAccess(me) && (
        <GreetingBanner subtitle="Welcome back. Your site visits, ratings and customer feedback are below.">
          {canLog && (
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-navy-950 shadow-[0_10px_25px_-12px_rgba(8,38,32,0.5)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Plus className="h-4 w-4" /> Record a visit
            </button>
          )}
        </GreetingBanner>
      )}
      <div
        className={cn(
          'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
          !hasLeadAccess(me) && 'mt-6',
        )}
      >
        <div>
          <h1 className="font-display text-3xl font-bold">Site visits</h1>
          <p className="mt-1 text-sm text-slate-500">
            {seeAll
              ? 'Every customer shown around the projects, with their rating and feedback.'
              : 'Customers you showed around, with their rating and feedback.'}
          </p>
        </div>
        {canLog && hasLeadAccess(me) && (
          <Btn onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Record a visit
          </Btn>
        )}
      </div>

      <div className="-mx-4 mt-5 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {[
          ['Visits', stats.visits, MapPinned, 'text-navy-900 bg-slate-100'],
          ['People shown around', stats.people, Users, 'text-sky-700 bg-sky-50'],
          [
            'Average rating',
            stats.avg === '—' ? '—' : `${stats.avg} ★`,
            Star,
            'text-primary-700 bg-primary-50',
          ],
          ['Satisfied', `${stats.satisfied}%`, Smile, 'text-emerald-700 bg-emerald-50'],
          ['Want to book', stats.booking, CalendarCheck, 'text-emerald-700 bg-emerald-50'],
        ].map(([label, n, Icon, tone]) => (
          <Card
            key={label}
            className="flex min-w-[10rem] shrink-0 snap-start items-center gap-3 p-4 sm:min-w-0"
          >
            <span
              className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold leading-none">{n}</span>
              <span className="text-xs font-semibold text-slate-500">{label}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:gap-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search visits</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={cn(fieldCls, 'pl-10')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer, mobile, feedback or visit ID"
          />
        </label>
        <div
          className={cn(
            'grid grid-cols-2 gap-2 sm:gap-3',
            seeAll ? 'sm:grid-cols-4 lg:w-[44rem]' : 'sm:grid-cols-3 lg:w-[33rem]',
          )}
        >
          <select
            className={fieldCls}
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
          {seeAll && (
            <select
              className={fieldCls}
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              aria-label="Executive"
            >
              <option value="">Everyone</option>
              {guides.map((g) => (
                <option key={g.email} value={g.email}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <select
            className={fieldCls}
            value={sat}
            onChange={(e) => setSat(e.target.value)}
            aria-label="Satisfaction"
          >
            <option value="">Any rating</option>
            {Object.entries(SATISFACTION).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label} {id === 'satisfied' ? '(4-5★)' : id === 'neutral' ? '(3★)' : '(1-2★)'}
              </option>
            ))}
          </select>
          <select
            className={fieldCls}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            aria-label="Outcome"
          >
            <option value="">Any outcome</option>
            {VISIT_OUTCOMES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {period === 'custom' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
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

      <div className="mt-4 space-y-3">
        {!list ? (
          <Card className="p-10 text-center text-slate-500">Loading…</Card>
        ) : (
          rows.slice(0, limit).map((v) => (
            <Card key={v.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-semibold">{v.customerName}</span>
                    <Stars rating={v.rating} />
                    <SatisfactionBadge rating={v.rating} />
                    <OutcomeTag outcome={v.outcome} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    +91 {v.phone}
                    {v.project ? ` · ${v.project}` : ''}
                    {v.config ? ` · ${v.config}` : ''}
                    {` · ${v.people || 1} ${v.people > 1 ? 'people' : 'person'}`}
                  </p>
                  {v.feedback && (
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      “{v.feedback}”
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {v.id} · {fmtDateTime(v.at)} · shown by{' '}
                    <b className="text-navy-900">{v.guide?.name}</b>
                    {v.leadId &&
                      (can(me, 'leads.view_all') || isManager(me) ? (
                        <>
                          {' · '}
                          <Link
                            to={`/admin/leads/${v.leadId}`}
                            className="font-semibold text-primary-700 hover:underline"
                          >
                            Lead {v.leadId} →
                          </Link>
                        </>
                      ) : (
                        ` · Lead ${v.leadId}`
                      ))}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Btn variant="outline" onClick={() => setHistoryOf(v)}>
                    <History className="h-4 w-4" /> History
                  </Btn>
                  {mayEdit(v) && (
                    <Btn variant="outline" onClick={() => setEditing(v)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Btn>
                  )}
                  {can(me, 'visits.manage') && (
                    <button
                      type="button"
                      aria-label={`Delete ${v.id}`}
                      onClick={() => remove(v)}
                      className="rounded-xl p-2.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
        {list && rows.length === 0 && (
          <Card className="p-10 text-center text-slate-500">
            {filtered || list.length
              ? 'No visits match these filters.'
              : canLog
                ? 'No visits recorded in this period. Record your first one.'
                : 'No visits recorded in this period.'}
          </Card>
        )}
      </div>
      {rows.length > limit && (
        <div className="mt-4 text-center">
          <Btn variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
            Show more ({rows.length - limit} left)
          </Btn>
        </div>
      )}

      <VisitFormModal
        open={!!editing}
        visit={editing === 'new' ? null : editing}
        guides={seeAll ? guides : []}
        me={me}
        onClose={() => setEditing(null)}
        onSaved={() => {
          load();
          // a visit can move a lead to 'Site visit': refresh the CRM data quietly
          if (can(me, 'leads.view_all') || isManager(me)) useCrmStore.getState().load();
        }}
      />
      <Modal
        open={!!historyOf}
        onClose={() => setHistoryOf(null)}
        title={historyOf ? `${historyOf.id} · history` : ''}
      >
        {historyOf && (
          <ol className="space-y-2.5 border-l-2 border-slate-100 pl-4">
            {(historyOf.history || []).map((h) => (
              <li key={h.id} className="relative text-sm">
                <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400" />
                <span className="font-semibold text-navy-950">{h.text}</span>
                {h.note && <span className="text-slate-600"> · “{h.note}”</span>}
                {h.changes && (
                  <span className="block text-xs text-slate-600">
                    {Object.entries(h.changes)
                      .map(([k, c]) => `${k}: ${c.from ?? '—'} → ${c.to ?? '—'}`)
                      .join(' · ')}
                  </span>
                )}
                <span className="block text-xs text-slate-400">
                  {fmtDateTime(h.at)}
                  {h.by?.name ? ` · by ${h.by.name}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </div>
  );
}
