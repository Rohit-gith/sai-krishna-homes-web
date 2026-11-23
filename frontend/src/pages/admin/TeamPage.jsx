import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  BarChart3,
  History,
  KeyRound,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { fetchActivity, useTeamStore } from '@/features/admin/store/useTeamStore';
import { Btn, Card, Modal, fieldCls } from '@/features/admin/components/ui';
import {
  ACTIVITY_LABEL,
  ActiveBadge,
  HISTORY_LABEL,
  HandoverModal,
  ResetPasswordModal,
  RoleBadge,
  StatusModal,
  UserFormModal,
  describeChanges,
  DeviceInfo,
  fmtIST,
  usePermLabel,
} from '@/features/admin/components/teamUi';
import { ROLE_LABEL, can } from '@/features/admin/access';
import PageLoader from '@/components/common/PageLoader';
import { cn } from '@/utils/cn';

/** Can the signed-in person change this account? (mirrors the server rules) */
function manageable(me, u) {
  if (!me || u.email === me.email) return false;
  if (me.role === 'superowner') return true;
  // the owner manages Management (CMO, GM) and staff; Management manages staff only
  if (me.role === 'owner') return u.role !== 'owner' && u.role !== 'superowner';
  return u.role === 'sales' || u.role === 'site_visit';
}

/** Account history + everything this person did, newest first. */
function HistoryModal({ open, onClose, user }) {
  const permLabel = usePermLabel();
  const [log, setLog] = useState(null);
  const [tab, setTab] = useState('account');
  useEffect(() => {
    if (!open || !user) return;
    setTab('account');
    setLog(null);
    fetchActivity({ email: user.email, limit: 300 })
      .then(setLog)
      .catch(() => setLog([]));
  }, [open, user]);
  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title={`${user.name} · history`} wide>
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
        <span>
          Created {fmtIST(user.createdAt)}
          {user.createdBy ? ` by ${user.createdBy.name}` : ''}
        </span>
        <span>Last login {fmtIST(user.lastLoginAt)}</span>
      </div>
      <div
        className="mb-4 inline-flex rounded-xl border border-slate-200 p-1 text-sm font-semibold"
        role="tablist"
      >
        {[
          ['account', 'Account changes'],
          ['activity', 'Logins & actions'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'rounded-lg px-3 py-1.5',
              tab === id ? 'bg-navy-900 text-white' : 'text-slate-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'account' ? (
        <ol className="space-y-2.5 border-l-2 border-slate-100 pl-4">
          {(user.history || []).map((h, i) => (
            <li key={`${h.at}-${i}`} className="relative text-sm">
              <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400" />
              <span className="font-semibold text-navy-950">
                {HISTORY_LABEL[h.action] || h.action}
              </span>
              {h.action === 'created' && h.role && (
                <span className="text-slate-600"> as {ROLE_LABEL[h.role] || h.role}</span>
              )}
              {h.changes && (
                <span className="text-slate-600"> · {describeChanges(h.changes, permLabel)}</span>
              )}
              {h.note && <span className="text-slate-600"> · “{h.note}”</span>}
              <span className="block text-xs text-slate-400">
                {fmtIST(h.at)}
                {h.by?.name ? ` · by ${h.by.name}` : ''}
              </span>
            </li>
          ))}
          {!(user.history || []).length && (
            <p className="text-sm text-slate-500">No changes recorded yet.</p>
          )}
        </ol>
      ) : !log ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {log.map((a, i) => (
            <li
              key={`${a.at}-${i}`}
              className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-start sm:gap-4"
            >
              <span className="w-36 shrink-0 text-xs text-slate-500">{fmtIST(a.at)}</span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-navy-950">
                  {ACTIVITY_LABEL[a.type] || a.type}
                </span>
                {a.email !== user.email && a.name && (
                  <span className="text-slate-600"> · by {a.name}</span>
                )}
                {a.target && a.target.email !== user.email && (
                  <span className="text-slate-600"> · {a.target.name}</span>
                )}
                {a.changes && (
                  <span className="text-slate-600"> · {describeChanges(a.changes, permLabel)}</span>
                )}
                {a.note && <span className="text-slate-600"> · {a.note}</span>}
                <DeviceInfo a={a} />
              </span>
            </li>
          ))}
          {log.length === 0 && <p className="py-6 text-center text-slate-500">No activity yet.</p>}
        </ul>
      )}
    </Modal>
  );
}

export default function TeamPage() {
  const me = useAuthStore((s) => s.user);
  const { users, loaded, loading, error, load } = useTeamStore();
  const permLabel = usePermLabel();
  const meta = useTeamStore((s) => s.meta);
  const totalFor = (role) =>
    meta.roles.find((r) => r.id === role)?.allowed?.length ?? meta.permissions.length;
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null); // user, or 'new'
  const [statusFor, setStatusFor] = useState(null);
  const [passwordFor, setPasswordFor] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [handoverFor, setHandoverFor] = useState(null);

  useEffect(() => {
    document.title = 'Team | Sai Krishna Homes';
    if (!loaded) load();
  }, [loaded, load]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!status || (status === 'active') === u.active) &&
        (!t || [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(t))),
    );
  }, [users, q, role, status]);

  const stats = useMemo(
    () => ({
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
      sales: users.filter((u) => u.role === 'sales').length,
      visit: users.filter((u) => u.role === 'site_visit').length,
    }),
    [users],
  );

  if (!loaded && loading) return <PageLoader />;
  if (error && !loaded)
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center">
        <p className="font-semibold text-rose-700">{error}</p>
        <Btn className="mt-4" onClick={load}>
          Try again
        </Btn>
      </div>
    );

  // the latest version of an open dialog's user (after saving, the list has the fresh copy)
  const fresh = (u) => (u && u !== 'new' ? users.find((x) => x.id === u.id) || u : u);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-slate-500">
            Logins for your sales and site-visit team: what each person can do, and who is active.
          </p>
        </div>
        <Btn onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add team member
        </Btn>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Active', stats.active, UserCheck, 'text-emerald-700 bg-emerald-50'],
          ['Inactive', stats.inactive, UserX, 'text-slate-600 bg-slate-100'],
          ['Sales executives', stats.sales, Users, 'text-sky-700 bg-sky-50'],
          ['Site visit executives', stats.visit, ShieldCheck, 'text-emerald-700 bg-emerald-50'],
        ].map(([label, n, Icon, tone]) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone)}>
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
          <span className="sr-only">Search team</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={cn(fieldCls, 'pl-10')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or mobile"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:w-[26rem]">
          <select
            className={fieldCls}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Role"
          >
            <option value="">All roles</option>
            {['superowner', 'owner', 'management', 'sales', 'site_visit']
              .filter((r) => users.some((u) => u.role === r))
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
          </select>
          <select
            className={fieldCls}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
          >
            <option value="">Active & inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((u) => {
          const mine = u.email === me?.email;
          const canManage = manageable(me, u);
          const staff = u.role === 'sales' || u.role === 'site_visit';
          const mgmt = u.role === 'management';
          return (
            <Card key={u.id} className={cn('p-4 sm:p-5', !u.active && 'bg-slate-50/70')}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={'/admin/team/' + u.id}
                      className={cn(
                        'text-[16px] font-semibold hover:text-primary-700 hover:underline',
                        !u.active && 'text-slate-500',
                      )}
                    >
                      {u.name}
                    </Link>
                    {mine && (
                      <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[11px] font-bold text-white">
                        You
                      </span>
                    )}
                    <RoleBadge role={u.role} />
                    {u.designation && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-navy-900 ring-1 ring-inset ring-slate-200">
                        {u.designation}
                      </span>
                    )}
                    <ActiveBadge active={u.active} />
                  </div>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {u.email}
                    {u.phone ? ` · +91 ${u.phone}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Last login {fmtIST(u.lastLoginAt)} · Added {fmtIST(u.createdAt)}
                    {u.createdBy?.name ? ` by ${u.createdBy.name}` : ''}
                  </p>
                  {mgmt && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {meta.permissions.every((p) => u.permissions.includes(p.id)) ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Full access, like the owner
                        </span>
                      ) : (
                        <>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Not allowed:
                          </span>
                          {meta.permissions
                            .filter((p) => !u.permissions.includes(p.id))
                            .map((p) => (
                              <span
                                key={p.id}
                                className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
                              >
                                {p.label}
                              </span>
                            ))}
                        </>
                      )}
                    </div>
                  )}
                  {staff && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {u.permissions.length ? (
                        u.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                          >
                            {permLabel(p)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-semibold text-rose-600">
                          No permissions: can log in but cannot do anything
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        ({u.permissions.length} of {totalFor(u.role)})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 xl:max-w-[36rem] xl:justify-end">
                  <Link
                    to={'/admin/team/' + u.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
                  >
                    <BarChart3 className="h-4 w-4" /> View work
                  </Link>
                  <Btn variant="outline" onClick={() => setHistoryFor(u)}>
                    <History className="h-4 w-4" /> History
                  </Btn>
                  {canManage && (
                    <>
                      <Btn variant="outline" onClick={() => setEditing(u)}>
                        <Pencil className="h-4 w-4" />{' '}
                        {staff || mgmt ? 'Edit & permissions' : 'Edit'}
                      </Btn>
                      {(u.role === 'sales' || mgmt) && can(me, 'leads.handover') && (
                        <Btn variant="outline" onClick={() => setHandoverFor(u)}>
                          <ArrowRightLeft className="h-4 w-4" /> Hand over leads
                        </Btn>
                      )}
                      <Btn variant="outline" onClick={() => setPasswordFor(u)}>
                        <KeyRound className="h-4 w-4" /> Reset password
                      </Btn>
                      <Btn
                        variant={u.active ? 'outline' : 'success'}
                        className={u.active ? 'text-rose-700 hover:border-rose-400' : ''}
                        onClick={() => setStatusFor(u)}
                      >
                        <Power className="h-4 w-4" /> {u.active ? 'Deactivate' : 'Activate'}
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <Card className="p-10 text-center text-slate-500">
            {users.length
              ? 'Nobody matches these filters.'
              : 'No team members yet. Add your first sales executive.'}
          </Card>
        )}
      </div>

      <UserFormModal
        open={!!editing}
        user={editing === 'new' ? null : fresh(editing)}
        onClose={() => setEditing(null)}
      />
      <StatusModal open={!!statusFor} user={fresh(statusFor)} onClose={() => setStatusFor(null)} />
      <ResetPasswordModal
        open={!!passwordFor}
        user={fresh(passwordFor)}
        onClose={() => setPasswordFor(null)}
      />
      <HandoverModal
        open={!!handoverFor}
        user={fresh(handoverFor)}
        onClose={() => setHandoverFor(null)}
      />
      <HistoryModal
        open={!!historyFor}
        user={fresh(historyFor)}
        onClose={() => setHistoryFor(null)}
      />
    </div>
  );
}
