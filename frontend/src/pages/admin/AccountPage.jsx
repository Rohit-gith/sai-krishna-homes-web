import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { PERMISSION_LABEL, ROLE_LABEL, TITLES, isManager } from '@/features/admin/access';
import { api } from '@/services/crmApi';
import { Btn, Card, Field, fieldCls } from '@/features/admin/components/ui';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

const strong = (p) => p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p);

/** My account: who I am, what I can do, and change my own password. */
export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'My account | Sai Krishna Homes';
  }, []);

  const permLabel = (id) => PERMISSION_LABEL[id] || id;
  const saveTitle = async (title) => {
    try {
      const me = await api('/auth/me', { method: 'PATCH', body: { title } });
      useAuthStore.setState((s) => ({ user: { ...s.user, ...me } }));
      toast('Saved');
    } catch (e2) {
      toast(e2.message, 'error');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!f.current) return setErr('Enter your current password.');
    if (!strong(f.next))
      return setErr('New password: at least 10 characters, with letters and numbers.');
    if (f.next !== f.confirm) return setErr('The two new passwords do not match.');
    setErr('');
    setBusy(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: f.current, newPassword: f.next },
      });
      setF({ current: '', next: '', confirm: '' });
      toast('Password changed. Other devices have been logged out.');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const input = (k, label, autoComplete) => (
    <Field label={label} required>
      <input
        className={cn(fieldCls, 'font-mono')}
        type={show ? 'text' : 'password'}
        value={f[k]}
        onChange={(e) => setF((v) => ({ ...v, [k]: e.target.value }))}
        autoComplete={autoComplete}
      />
    </Field>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold">My account</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Profile</h2>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-slate-500">
                Title
                <span className="block text-[11px]">How the CRM greets you</span>
              </dt>
              <dd>
                <select
                  className={cn(fieldCls, 'w-28 py-1.5')}
                  value={user?.title || ''}
                  onChange={(e) => saveTitle(e.target.value)}
                  aria-label="Title"
                >
                  {TITLES.map(([v, l]) => (
                    <option key={l} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            {[
              ['Name', user?.name],
              ['Login email', user?.email],
              ['Role', ROLE_LABEL[user?.role] || user?.role],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-all text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-semibold text-navy-900">What you can do</h3>
          {isManager(user) ? (
            <p className="mt-2 text-sm text-slate-600">
              Everything in the CRM, including managing the team.
            </p>
          ) : user?.permissions?.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {user.permissions.map((p) => (
                <li
                  key={p}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {permLabel(p)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-rose-600">No permissions yet. Ask the owner.</p>
          )}
          {!isManager(user) && (
            <p className="mt-3 text-xs text-slate-500">
              Need more access? Only the owner can change your permissions.
            </p>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <KeyRound className="h-5 w-5 text-primary-600" /> Change password
          </h2>
          <form onSubmit={submit} noValidate className="mt-4 space-y-3">
            {input('current', 'Current password', 'current-password')}
            {input('next', 'New password', 'new-password')}
            {input('confirm', 'Confirm new password', 'new-password')}
            <p className="text-xs text-slate-500">
              At least 10 characters, with letters and numbers. Your other devices will be logged
              out.
            </p>
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-950"
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{' '}
              {show ? 'Hide passwords' : 'Show passwords'}
            </button>
            {err && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700"
              >
                {err}
              </p>
            )}
            <Btn type="submit" disabled={busy} className="w-full">
              <Check className="h-4 w-4" /> {busy ? 'Saving…' : 'Change password'}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
