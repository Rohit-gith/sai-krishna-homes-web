import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  RefreshCw,
  Smartphone,
  Tablet,
  TerminalSquare,
} from 'lucide-react';
import { Btn, Field, Modal, fieldCls } from './ui';
import { ROLE_LABEL, TITLES, isManager } from '../access';
import { useAuthStore } from '../store/useAuthStore';
import { makePassword, useTeamStore } from '../store/useTeamStore';
import { useCrmStore } from '../store/useCrmStore';
import { OPEN_STATUSES } from '../constants';
import { fmtDateTime } from '../utils';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

/* Building blocks of the Team page: role badge, password box, the user / status / password dialogs. */

const ROLE_TONE = {
  superowner: 'bg-violet-50 text-violet-700 ring-violet-200',
  owner: 'bg-primary-50 text-primary-800 ring-primary-200',
  management: 'bg-amber-50 text-amber-800 ring-amber-200',
  sales: 'bg-sky-50 text-sky-700 ring-sky-200',
  site_visit: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export function RoleBadge({ role }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        ROLE_TONE[role] || 'bg-slate-100 text-slate-700 ring-slate-200',
      )}
    >
      {ROLE_LABEL[role] || role}
    </span>
  );
}

export function ActiveBadge({ active }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const strongEnough = (p) => p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p);

/** Password input with show/hide, generate and copy. */
export function PasswordBox({ value, onChange, label = 'Password', autoFocus }) {
  const [show, setShow] = useState(false);
  const toast = useUiStore((s) => s.showToast);
  return (
    <Field
      label={label}
      required
      error={
        value && !strongEnough(value) ? 'At least 10 characters, with letters and numbers' : ''
      }
    >
      <div className="flex gap-2">
        <span className="relative block flex-1">
          <input
            className={cn(fieldCls, 'pr-10 font-mono')}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="new-password"
            autoFocus={autoFocus}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-500"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
        <Btn
          variant="outline"
          title="Generate a strong password"
          onClick={() => {
            onChange(makePassword());
            setShow(true);
          }}
        >
          <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Generate</span>
        </Btn>
        <Btn
          variant="outline"
          title="Copy"
          disabled={!value}
          onClick={() =>
            navigator.clipboard?.writeText(value).then(
              () => toast('Password copied'),
              () => {},
            )
          }
        >
          <Copy className="h-4 w-4" />
        </Btn>
      </div>
    </Field>
  );
}

const everyday = (p) => p.group !== 'management';
const GROUPS = [
  ['Leads', (p) => everyday(p) && p.id.startsWith('leads.')],
  ['Calls & deals', (p) => p.id.startsWith('attempts.') || p.id.startsWith('deals.')],
  ['Website enquiries', (p) => everyday(p) && p.id.startsWith('enquiries.')],
  ['Site visits', (p) => everyday(p) && p.id.startsWith('visits.')],
  ['Reports', (p) => p.id.startsWith('reports.')],
  ['Owner-level powers', (p) => p.group === 'management'],
];

/** Grouped permission checkboxes. */
export function PermissionPicker({ permissions, value, onChange, defaults, locked = [] }) {
  // locked: ones this person may not change (Management can't pass on powers they don't have)
  const toggle = (id) =>
    locked.includes(id)
      ? undefined
      : onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const keepLocked = (list) => [
    ...new Set([
      ...list.filter((x) => !locked.includes(x)),
      ...value.filter((x) => locked.includes(x)),
    ]),
  ];
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-navy-900">
          Permissions{' '}
          <span className="font-normal text-slate-500">
            ({value.length} of {permissions.length})
          </span>
        </span>
        <span className="flex gap-3 text-xs font-semibold text-primary-700">
          {defaults && (
            <button
              type="button"
              onClick={() => onChange(keepLocked(defaults))}
              className="hover:underline"
            >
              Defaults for role
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange(keepLocked(permissions.map((p) => p.id)))}
            className="hover:underline"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onChange(keepLocked([]))}
            className="hover:underline"
          >
            None
          </button>
        </span>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 p-3">
        {GROUPS.map(([title, match]) => {
          const items = permissions.filter((p) => match(p));
          if (!items.length) return null;
          return (
            <fieldset key={title}>
              <legend className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {title}
              </legend>
              <div className="grid gap-1 sm:grid-cols-2">
                {items.map((p) => (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-xl p-2 text-sm hover:bg-slate-50',
                      value.includes(p.id) && 'bg-emerald-50/60',
                      locked.includes(p.id) && 'cursor-not-allowed opacity-60',
                    )}
                    title={locked.includes(p.id) ? 'Only the owner can change this' : undefined}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-700"
                      checked={value.includes(p.id)}
                      disabled={locked.includes(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span>
                      <span className="block font-medium text-navy-950">{p.label}</span>
                      {p.hint && <span className="block text-xs text-slate-500">{p.hint}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY = {
  title: '',
  name: '',
  email: '',
  phone: '',
  designation: '',
  role: 'sales',
  password: '',
  permissions: [],
  note: '',
};

/** Create (user = null) or edit a team member. */
export function UserFormModal({ open, onClose, user }) {
  const meta = useTeamStore((s) => s.meta);
  const createUser = useTeamStore((s) => s.createUser);
  const updateUser = useTeamStore((s) => s.updateUser);
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // shows the login details once, to hand over

  const me = useAuthStore((s) => s.user);
  // roles with a permission list the owner controls (everyone except the owner)
  const staffRole = (r) => r === 'management' || r === 'sales' || r === 'site_visit';
  const roleMeta = (r) => meta.roles.find((x) => x.id === r);
  const defaultsFor = (r) => roleMeta(r)?.defaultPermissions || [];
  const allowedFor = (r) => roleMeta(r)?.allowed || meta.permissions.map((p) => p.id);
  // which roles this person may give (Management: only sales and site visit executives)
  const canGive = meta.canCreate || meta.roles.map((r) => r.id);
  // Management can't change powers they don't have themselves
  const locked = isManager(me)
    ? []
    : allowedFor(f.role).filter((p) => !(me?.permissions || []).includes(p));

  useEffect(() => {
    if (!open) return;
    setErr({});
    setCreated(null);
    setF(
      user
        ? {
            ...EMPTY,
            title: user.title || '',
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            designation: user.designation || '',
            role: user.role,
            permissions: user.permissions || [],
          }
        : {
            ...EMPTY,
            role: canGive.includes('sales') ? 'sales' : canGive[0] || 'sales',
            permissions: defaultsFor(canGive.includes('sales') ? 'sales' : canGive[0] || 'sales'),
            password: makePassword(),
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const isStaff = staffRole(f.role);

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter the full name';
    if (!user && !/^\S+@\S+\.\S+$/.test(f.email.trim()))
      er.email = 'Enter a valid email (this is their login)';
    if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) er.phone = '10-digit mobile number';
    if (!user && !strongEnough(f.password)) er.password = 'Weak password';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    let res;
    if (user) {
      res = await updateUser(user.id, {
        title: f.title,
        name: f.name.trim(),
        phone: f.phone,
        designation: f.designation.trim(),
        ...(staffRole(user.role) ? { role: f.role, permissions: f.permissions } : {}),
        note: f.note.trim(),
      });
    } else {
      res = await createUser({
        title: f.title,
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone,
        designation: f.designation.trim(),
        role: f.role,
        password: f.password,
        ...(isStaff ? { permissions: f.permissions } : {}),
      });
    }
    setBusy(false);
    if (!res) return;
    if (user) {
      toast(`${res.name} updated`);
      onClose();
    } else {
      toast(`${res.name} can now log in`);
      setCreated({ name: res.name, email: res.email, password: f.password });
    }
  };

  if (created) {
    const text = `Sai Krishna Homes CRM login\nLink: ${window.location.origin}/login\nEmail: ${created.email}\nPassword: ${created.password}`;
    return (
      <Modal open={open} onClose={onClose} title="Account created">
        <p className="text-sm text-slate-600">
          Share these login details with <b>{created.name}</b> (by phone or a private message). The
          password is not shown again.
        </p>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-mono text-sm text-navy-950">
          {text}
        </pre>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>
            Done
          </Btn>
          <Btn
            onClick={() =>
              navigator.clipboard?.writeText(text).then(
                () => toast('Login details copied'),
                () => {},
              )
            }
          >
            <Copy className="h-4 w-4" /> Copy login details
          </Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? `Edit ${user.name}` : 'Add team member'}
      wide
    >
      <form onSubmit={save} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-[6.5rem_1fr] gap-2 sm:col-span-2">
            <Field label="Title">
              <select className={fieldCls} value={f.title} onChange={set('title')}>
                {TITLES.map(([v, l]) => (
                  <option key={l} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Full name" required error={err.name}>
              <input className={fieldCls} value={f.name} onChange={set('name')} autoFocus />
            </Field>
          </div>
          <Field label="Mobile" error={err.phone}>
            <input
              className={fieldCls}
              value={f.phone}
              inputMode="numeric"
              onChange={(e) =>
                setF((v) => ({ ...v, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
              }
            />
          </Field>
          <Field label="Email (login ID)" required={!user} error={err.email}>
            <input
              className={cn(fieldCls, user && 'bg-slate-50 text-slate-500')}
              type="email"
              value={f.email}
              onChange={set('email')}
              disabled={!!user}
              autoComplete="off"
            />
          </Field>
          <Field label="Role" required>
            {user && !staffRole(user.role) ? (
              <input
                className={cn(fieldCls, 'bg-slate-50 text-slate-500')}
                value={ROLE_LABEL[user.role]}
                disabled
              />
            ) : (
              <select
                className={fieldCls}
                value={f.role}
                onChange={(e) => {
                  const role = e.target.value;
                  setF((v) => ({
                    ...v,
                    role,
                    // new account, or made Management: start from the role's defaults; otherwise keep
                    // what they had, minus anything the new role can't hold
                    permissions:
                      !user || role === 'management'
                        ? defaultsFor(role)
                        : v.permissions.filter((p) => allowedFor(role).includes(p)),
                  }));
                }}
              >
                {meta.roles
                  .filter((r) => canGive.includes(r.id) && (!user || staffRole(r.id)))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
              </select>
            )}
          </Field>
          <Field label="Designation (optional)">
            <input
              className={fieldCls}
              value={f.designation}
              onChange={set('designation')}
              maxLength={40}
              placeholder={f.role === 'management' ? 'e.g. CMO, GM' : 'e.g. Senior sales'}
            />
          </Field>
        </div>

        {!user && (
          <PasswordBox
            value={f.password}
            onChange={(password) => setF((v) => ({ ...v, password }))}
            label="Password (share it with them)"
          />
        )}

        {f.role === 'management' && (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Everything the owner can do is ticked.</p>
            <p className="mt-1">
              For senior people such as the CMO or GM. Untick anything they should not do. Only the
              owner can change, reset or deactivate a Management account, and everything they do is
              recorded in the Activity log under their name.
            </p>
          </div>
        )}
        {isStaff ? (
          <PermissionPicker
            permissions={meta.permissions.filter((p) => allowedFor(f.role).includes(p.id))}
            value={f.permissions}
            onChange={(permissions) => setF((v) => ({ ...v, permissions }))}
            defaults={defaultsFor(f.role)}
            locked={locked}
          />
        ) : (
          <div className="rounded-xl bg-primary-50 p-3 text-sm text-primary-900">
            <p className="font-semibold">Full access, the same as you.</p>
            <p className="mt-1">
              For a partner or family member who runs things when you are away: add and manage the
              team, see all leads, visits and reports. Everything they do is recorded in the
              Activity log under their name. Owners cannot deactivate or reset each other.
            </p>
          </div>
        )}

        {user && (
          <Field label="Reason for the change (optional, saved in the history)">
            <input
              className={fieldCls}
              value={f.note}
              onChange={set('note')}
              placeholder="e.g. Can now import Excel files"
            />
          </Field>
        )}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit" disabled={busy}>
            <Check className="h-4 w-4" />{' '}
            {busy ? 'Saving…' : user ? 'Save changes' : 'Create account'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/** Activate / deactivate with an optional reason. */
/** Open leads that count for this person (assigned to them, or added by them and not assigned). */
export function useOpenLeadsOf(email) {
  const leads = useCrmStore((s) => s.leads);
  return useMemo(
    () =>
      email
        ? leads.filter(
            (l) =>
              OPEN_STATUSES.includes(l.status) &&
              (l.assignedTo ? l.assignedTo.email === email : l.createdBy?.email === email),
          )
        : [],
    [leads, email],
  );
}

/** Active people who can take leads (owners and sales), except this person. */
function useTakers(email) {
  const users = useTeamStore((s) => s.users);
  return useMemo(
    () =>
      users
        .filter(
          (u) => u.active && u.email !== email && ['owner', 'management', 'sales'].includes(u.role),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users, email],
  );
}

function TakerSelect({ email, value, onChange, keepLabel }) {
  const takers = useTakers(email);
  return (
    <select
      className={fieldCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Give the leads to"
    >
      <option value="">{keepLabel || 'Choose a person…'}</option>
      {takers.map((u) => (
        <option key={u.email} value={u.email}>
          {u.name} ({ROLE_LABEL[u.role]})
        </option>
      ))}
    </select>
  );
}

/** Give every open lead of one person to another (e.g. they are leaving or on long leave). */
export function HandoverModal({ open, onClose, user }) {
  const handover = useCrmStore((s) => s.handoverLeads);
  const toast = useUiStore((s) => s.showToast);
  const openLeads = useOpenLeadsOf(user?.email);
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTo('');
    setNote('');
  }, [open]);
  if (!user) return null;
  const submit = async () => {
    if (!to || busy) return;
    setBusy(true);
    const moved = await handover(user.email, to, note.trim());
    setBusy(false);
    if (moved == null) return;
    toast(`${moved} open lead(s) handed over`);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={`Hand over ${user.name}’s leads`}>
      {openLeads.length === 0 ? (
        <p className="text-sm text-slate-600">{user.name} has no open leads right now.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            All <b>{openLeads.length} open lead(s)</b> of {user.name} go to the person you choose,
            with their calls and history. Won and lost deals stay credited to {user.name}.
          </p>
          <Field label="Give the leads to" className="mt-4">
            <TakerSelect email={user.email} value={to} onChange={setTo} />
          </Field>
          <Field label="Reason (optional, saved in each lead’s history)" className="mt-4">
            <input
              className={fieldCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Left the company"
            />
          </Field>
        </>
      )}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Btn variant="outline" onClick={onClose}>
          {openLeads.length ? 'Cancel' : 'Close'}
        </Btn>
        {openLeads.length > 0 && (
          <Btn onClick={submit} disabled={!to || busy}>
            {busy ? 'Handing over…' : `Hand over ${openLeads.length} lead(s)`}
          </Btn>
        )}
      </div>
    </Modal>
  );
}

export function StatusModal({ open, onClose, user }) {
  const setActive = useTeamStore((s) => s.setActive);
  const toast = useUiStore((s) => s.showToast);
  const handover = useCrmStore((s) => s.handoverLeads);
  const openLeads = useOpenLeadsOf(user?.email);
  const [note, setNote] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setNote('');
    setTo('');
  }, [open]);
  if (!user) return null;
  const deactivating = user.active;
  const submit = async () => {
    setBusy(true);
    if (deactivating && to) {
      const moved = await handover(user.email, to, note.trim() || 'Account deactivated');
      if (moved == null) {
        setBusy(false);
        return;
      }
    }
    const u = await setActive(user.id, !user.active, note.trim());
    setBusy(false);
    if (!u) return;
    toast(`${u.name} is now ${u.active ? 'active' : 'inactive'}`);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={deactivating ? `Deactivate ${user.name}?` : `Activate ${user.name}?`}
    >
      <p className="text-sm text-slate-600">
        {deactivating
          ? 'They are logged out at once and cannot log in until you activate them again. Their leads and history stay as they are.'
          : 'They can log in again with their current password.'}
      </p>
      {deactivating && openLeads.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">
            {user.name} has {openLeads.length} open lead(s).
          </p>
          <p className="mb-2 text-xs text-amber-900/80">
            Give them to someone so no customer is left without a follow-up.
          </p>
          <TakerSelect
            email={user.email}
            value={to}
            onChange={setTo}
            keepLabel="Keep them with this person"
          />
        </div>
      )}
      <Field label="Reason (optional, saved in the history)" className="mt-4">
        <input
          className={fieldCls}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={deactivating ? 'e.g. Left the company' : 'e.g. Back from leave'}
        />
      </Field>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Btn variant="outline" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant={deactivating ? 'danger' : 'success'} onClick={submit} disabled={busy}>
          {busy ? 'Saving…' : deactivating ? 'Deactivate' : 'Activate'}
        </Btn>
      </div>
    </Modal>
  );
}

/** Set a new password for someone else. */
export function ResetPasswordModal({ open, onClose, user }) {
  const resetPassword = useTeamStore((s) => s.resetPassword);
  const toast = useUiStore((s) => s.showToast);
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!open) return;
    setPassword(makePassword());
    setNote('');
    setDone(false);
  }, [open]);
  if (!user) return null;
  const submit = async () => {
    if (!strongEnough(password)) return;
    setBusy(true);
    const ok = await resetPassword(user.id, password, note.trim());
    setBusy(false);
    if (ok) setDone(true);
  };
  const text = `Sai Krishna Homes CRM\nLink: ${window.location.origin}/login\nEmail: ${user.email}\nNew password: ${password}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={done ? 'Password changed' : `New password for ${user.name}`}
    >
      {done ? (
        <>
          <p className="text-sm text-slate-600">
            {user.name} has been logged out everywhere. Share the new password privately:
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-mono text-sm">
            {text}
          </pre>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Btn variant="outline" onClick={onClose}>
              Done
            </Btn>
            <Btn
              onClick={() =>
                navigator.clipboard?.writeText(text).then(
                  () => toast('Copied'),
                  () => {},
                )
              }
            >
              <Copy className="h-4 w-4" /> Copy
            </Btn>
          </div>
        </>
      ) : (
        <>
          <PasswordBox value={password} onChange={setPassword} label="New password" />
          <Field label="Reason (optional, saved in the history)" className="mt-4">
            <input
              className={fieldCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Forgot password"
            />
          </Field>
          <p className="mt-3 text-xs text-slate-500">
            They will be logged out on every device and must use this new password.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Btn variant="outline" onClick={onClose}>
              Cancel
            </Btn>
            <Btn onClick={submit} disabled={busy || !strongEnough(password)}>
              <KeyRound className="h-4 w-4" /> {busy ? 'Saving…' : 'Set new password'}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ---------- history / activity wording ---------- */

export const ACTIVITY_LABEL = {
  login: 'Logged in',
  login_failed: 'Failed login',
  login_blocked: 'Login blocked (too many tries)',
  logout: 'Logged out',
  admin_created: 'Account created',
  user_updated: 'Account changed',
  user_activated: 'Activated',
  user_deactivated: 'Deactivated',
  password_reset: 'Password reset',
  password_changed: 'Changed own password',
  lead_assigned: 'Leads assigned',
  leads_exported: 'Leads exported',
  leads_deleted: 'Leads deleted (recycle bin)',
  leads_restored: 'Leads restored',
  leads_purged: 'Leads deleted forever',
  leads_archive_restored: 'Restored from the archive (Fidelsya)',
  leads_archive_purged: 'Removed from the archive (Fidelsya)',
  leads_handed_over: 'Leads handed over',
  enquiry_received: 'Website enquiry received',
  enquiry_deleted: 'Website enquiry deleted',
  enquiry_converted: 'Enquiry turned into a lead',
  lead_created: 'Lead added',
  lead_updated: 'Lead edited',
  lead_status_changed: 'Lead status changed',
  attempt_logged: 'Call / follow-up logged',
  deal_won: 'Deal won',
  deal_lost: 'Deal lost',
  deal_reopened: 'Deal reopened',
  leads_imported: 'Leads imported (Excel)',
  visit_recorded: 'Site visit recorded',
  visit_updated: 'Site visit edited',
  visit_deleted: 'Site visit deleted',
  project_created: 'Project added',
  project_updated: 'Project changed',
  project_deleted: 'Project deleted',
  project_published: 'Project shown on website',
  project_unpublished: 'Project hidden from website',
  lead_duplicate_added: 'Duplicate lead added anyway',
  deal_value_confirmed: 'Unusual deal value confirmed',
};

/** Human wording for a permission / role change record. */
const FIELD_LABEL = {
  title: 'title',
  designation: 'designation',
  email: 'email',
  project: 'project',
  config: 'BHK',
  source: 'source',
  budget: 'budget',
  dealValue: 'deal value',
  nextFollowUp: 'next follow-up',
  notes: 'notes',
  location: 'location',
  rera: 'RERA',
  rating: 'rating',
  outcome: 'outcome',
  feedback: 'feedback',
  customerName: 'customer',
  people: 'people',
  at: 'visit time',
};

export function describeChanges(changes, permLabel) {
  if (!changes) return '';
  const parts = [];
  if (changes.name) parts.push(`name “${changes.name.from}” → “${changes.name.to}”`);
  if (changes.phone) parts.push(`mobile ${changes.phone.from || '—'} → ${changes.phone.to || '—'}`);
  if (changes.role)
    parts.push(
      `role ${ROLE_LABEL[changes.role.from] || changes.role.from || '—'} → ${ROLE_LABEL[changes.role.to] || changes.role.to}`,
    );
  if (changes.permissions?.added?.length)
    parts.push(`+ ${changes.permissions.added.map(permLabel).join(', ')}`);
  if (changes.permissions?.removed?.length)
    parts.push(`− ${changes.permissions.removed.map(permLabel).join(', ')}`);
  // anything else (lead fields, visit fields, website details): "BHK “2 BHK” → “3 BHK”"
  for (const [k, c] of Object.entries(changes)) {
    if (['name', 'phone', 'role', 'permissions'].includes(k) || !c || typeof c !== 'object')
      continue;
    if (!('from' in c) && !('to' in c)) continue;
    const label = FIELD_LABEL[k] || k.replace(/^web\./, 'website ');
    const val = (v) =>
      v === '' || v === null || v === undefined ? '—' : `“${String(v).slice(0, 60)}”`;
    parts.push(`${label} ${val(c.from)} → ${val(c.to)}`);
  }
  return parts.join(' · ');
}

export const HISTORY_LABEL = {
  created: 'Account created',
  updated: 'Changed',
  activated: 'Activated',
  deactivated: 'Deactivated',
  password_reset: 'Password reset',
  password_changed: 'Changed own password',
};

/** What kind of device a user-agent is: a phone, a tablet, a computer, or a tool (Postman, a script). */
export function deviceKind(ua = '') {
  if (!ua || ua === 'command line' || /Postman|Thunder|curl|axios|node/i.test(ua)) return 'tool';
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet';
  if (/iPhone|iPod|Android|Mobile/.test(ua)) return 'mobile';
  return 'computer';
}

const KIND = {
  mobile: { icon: Smartphone, label: 'Mobile' },
  tablet: { icon: Tablet, label: 'Tablet' },
  computer: { icon: Laptop, label: 'Laptop / computer' },
  tool: { icon: TerminalSquare, label: 'Tool or script' },
};

/** "📱 Chrome on Android · Device A3F2 · IP 223.181.53.89", plus a "New device" tag on a first login from that browser. */
export function DeviceInfo({ a, className }) {
  const kind = KIND[deviceKind(a.device)];
  const Icon = kind.icon;
  return (
    <span className={cn('block text-xs text-slate-400', className)}>
      <span title={kind.label}>
        <Icon className="mr-1 inline-block h-3.5 w-3.5 -translate-y-px" aria-hidden="true" />
        <span className="sr-only">{kind.label}: </span>
      </span>
      {deviceName(a.device)}
      {a.deviceId && (
        <span title="This browser's own ID: tells two devices on the same WiFi apart">
          {' '}
          · Device {a.deviceId.slice(0, 4).toUpperCase()}
        </span>
      )}{' '}
      · IP {a.ip}
      {a.newDevice && (
        <span className="ml-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
          New device
        </span>
      )}
    </span>
  );
}

/** Short "Chrome on Android" / "Safari on iPad" from a user-agent string. */
export function deviceName(ua = '') {
  if (!ua || ua === 'command line') return ua ? 'Command line' : '—';
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser\//.test(ua)
        ? 'Samsung Internet'
        : /Chrome\/|CriOS\//.test(ua)
          ? 'Chrome'
          : /Firefox\/|FxiOS\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : /Postman|Thunder|curl|axios|node/i.test(ua)
                ? ua.split('/')[0]
                : 'Browser';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPad/.test(ua)
      ? 'iPad'
      : /iPhone|iPod/.test(ua)
        ? 'iPhone'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Mac OS X/.test(ua)
            ? 'Mac'
            : /Linux/.test(ua)
              ? 'Linux'
              : '';
  return os ? `${browser} on ${os}` : browser;
}

export const fmtIST = (iso) => (iso ? fmtDateTime(iso) : '—');

export function usePermLabel() {
  const permissions = useTeamStore((s) => s.meta.permissions);
  return useMemo(() => {
    const m = Object.fromEntries(permissions.map((p) => [p.id, p.label]));
    return (id) => m[id] || id;
  }, [permissions]);
}
