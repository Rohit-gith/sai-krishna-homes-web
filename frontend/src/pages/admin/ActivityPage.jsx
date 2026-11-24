import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchActivity, useTeamStore } from '@/features/admin/store/useTeamStore';
import { Btn, Card, fieldCls } from '@/features/admin/components/ui';
import {
  ACTIVITY_LABEL,
  describeChanges,
  DeviceInfo,
  fmtIST,
  usePermLabel,
} from '@/features/admin/components/teamUi';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { istSince } from '@/features/admin/utils';

const PERIODS = [
  ['', 'All time'],
  ['1', 'Today'],
  ['7', 'Last 7 days'],
  ['30', 'Last 30 days'],
  ['90', 'Last 3 months'],
  ['365', 'Last 1 year'],
];
const TONE = {
  login: 'bg-emerald-50 text-emerald-700',
  logout: 'bg-slate-100 text-slate-600',
  login_failed: 'bg-rose-50 text-rose-700',
  login_blocked: 'bg-rose-100 text-rose-800',
  user_deactivated: 'bg-rose-50 text-rose-700',
  user_activated: 'bg-emerald-50 text-emerald-700',
  password_reset: 'bg-amber-50 text-amber-800',
  password_changed: 'bg-amber-50 text-amber-800',
  deal_won: 'bg-emerald-50 text-emerald-700',
  deal_lost: 'bg-rose-50 text-rose-700',
  deal_reopened: 'bg-amber-50 text-amber-800',
  lead_created: 'bg-sky-50 text-sky-700',
  attempt_logged: 'bg-violet-50 text-violet-700',
  visit_recorded: 'bg-teal-50 text-teal-700',
  visit_deleted: 'bg-rose-50 text-rose-700',
  leads_deleted: 'bg-rose-50 text-rose-700',
  leads_purged: 'bg-rose-100 text-rose-800',
  enquiry_received: 'bg-primary-50 text-primary-800',
  lead_duplicate_added: 'bg-amber-50 text-amber-800',
  deal_value_confirmed: 'bg-violet-50 text-violet-700',
};

/** "Open SKH-0042 →" for entries about a lead. */
function RefLink({ a }) {
  if (a.ref?.kind !== 'lead') return null;
  return (
    <Link
      to={`/admin/leads/${a.ref.id}`}
      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
    >
      Open {a.ref.id} <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

const since = (days) => {
  if (!days) return '';
  return istSince(days); // India days
};

/** Who logged in when, and every change to the team (owner / Fidelsya only). */
export default function ActivityPage() {
  const fidelsya = useAuthStore((s) => s.user?.role === 'superowner');
  const users = useTeamStore((s) => s.users);
  const loadTeam = useTeamStore((s) => s.load);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const permLabel = usePermLabel();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [period, setPeriod] = useState('30');
  const [limit, setLimit] = useState(300);

  const load = useCallback(async () => {
    setError('');
    try {
      setList(await fetchActivity({ email, type, from: since(period), limit }));
    } catch (e) {
      setError(e.message);
      setList([]);
    }
  }, [email, type, period, limit]);

  useEffect(() => {
    document.title = 'Activity log | Sai Krishna Homes';
    if (!teamLoaded) loadTeam();
  }, [teamLoaded, loadTeam]);
  useEffect(() => {
    load();
    // keep it live: new entries appear by themselves while the page is open
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 30 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const people = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Activity log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every login and logout, failed login, account change, password reset, lead assignment
            and export, newest first.
          </p>
        </div>
        <Btn variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Btn>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <select
          className={fieldCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Person"
        >
          <option value="">Everyone</option>
          {people.map((u) => (
            <option key={u.id} value={u.email}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        <select
          className={fieldCls}
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="What happened"
        >
          <option value="">Everything</option>
          {Object.entries(ACTIVITY_LABEL)
            // the archive is Fidelsya's own: only Fidelsya gets those filters
            .filter(([id]) => !id.startsWith('leads_archive_') || fidelsya)
            .map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
        </select>
        <select
          className={fieldCls}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="When"
        >
          {PERIODS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <Card className="mt-4 overflow-hidden">
        {!list ? (
          <p className="p-10 text-center text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-3 py-3">What</th>
                    <th className="px-3 py-3">Who</th>
                    <th className="px-3 py-3">Details</th>
                    <th className="px-3 py-3">Device · IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((a, i) => (
                    <tr key={`${a.at}-${i}`} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {fmtIST(a.at)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
                            TONE[a.type] || 'bg-sky-50 text-sky-700',
                          )}
                        >
                          {ACTIVITY_LABEL[a.type] || a.type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-semibold">{a.name || a.email || '—'}</span>
                        <span className="text-xs text-slate-500">{a.email}</span>
                      </td>
                      <td className="max-w-md px-3 py-3 text-slate-600">
                        {a.target && (
                          <span className="block">
                            → <b className="text-navy-950">{a.target.name}</b>{' '}
                            <span className="text-xs text-slate-500">{a.target.email}</span>
                          </span>
                        )}
                        {a.changes && (
                          <span className="block">{describeChanges(a.changes, permLabel)}</span>
                        )}
                        {a.note && <span className="block">{a.note}</span>}
                        <RefLink a={a} />
                      </td>
                      <td className="px-3 py-3">
                        <DeviceInfo a={a} className="text-slate-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {list.map((a, i) => (
                <li key={`${a.at}-${i}`} className="p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        TONE[a.type] || 'bg-sky-50 text-sky-700',
                      )}
                    >
                      {ACTIVITY_LABEL[a.type] || a.type}
                    </span>
                    <span className="text-xs text-slate-500">{fmtIST(a.at)}</span>
                  </div>
                  <p className="mt-2 font-semibold">{a.name || a.email}</p>
                  {a.target && <p className="text-slate-600">→ {a.target.name}</p>}
                  {a.changes && (
                    <p className="text-slate-600">{describeChanges(a.changes, permLabel)}</p>
                  )}
                  {a.note && <p className="text-slate-600">{a.note}</p>}
                  <RefLink a={a} />
                  <DeviceInfo a={a} className="mt-1" />
                </li>
              ))}
            </ul>
            {list.length === 0 && (
              <p className="p-10 text-center text-slate-500">Nothing recorded for these filters.</p>
            )}
          </>
        )}
      </Card>
      {list && list.length >= limit && (
        <div className="mt-4 text-center">
          <Btn variant="outline" onClick={() => setLimit((n) => n + 300)}>
            Show older
          </Btn>
        </div>
      )}
    </div>
  );
}
