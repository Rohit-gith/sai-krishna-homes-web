import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { fieldCls } from '@/features/admin/components/ui';
import logoImg from '@/assets/logo/logo.png';
import { PHOTOS, responsive } from '@/data/projects';
import { useForceDay } from '@/features/admin/useForceDay';
import { setupCrmApp } from '@/features/admin/pwa';

export default function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const checked = useAuthStore((s) => s.checked);
  const check = useAuthStore((s) => s.check);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  useForceDay();

  useEffect(() => {
    document.title = 'Admin login | Sai Krishna Homes';
    setupCrmApp(); // the CRM can be installed from the login page too
    if (!checked) check(); // already signed in on this device? skip the form
  }, [checked, check]);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError('');
    const err = await login(email, password);
    setBusy(false);
    if (err) return setError(err);
    return navigate(location.state?.from || '/admin', { replace: true });
  };

  return (
    <div className="grid min-h-screen bg-ivory font-sans lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          {...responsive(PHOTOS.pwGate, '50vw')}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
        <p className="absolute bottom-10 left-10 max-w-sm font-serif text-3xl leading-snug text-white">
          Every enquiry, every visit, every home sold, in one place.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} noValidate className="w-full max-w-sm">
          <span className="block h-[3.4rem] w-14 overflow-hidden">
            <img src={logoImg} alt="Sai Krishna Homes" className="h-auto w-full" />
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold text-navy-950">Admin login</h1>
          <p className="mt-2 text-slate-600">Sign in to manage leads, site visits and deals.</p>

          <label className="mt-8 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-navy-900">Email</span>
            <input
              className={fieldCls}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-navy-900">Password</span>
            <span className="relative block">
              <input
                className={fieldCls + ' pr-11'}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-slate-500"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 py-3.5 font-semibold text-white hover:bg-navy-800 disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}{' '}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Access is for Sai Krishna Homes staff only. Ask your administrator if you need an
            account.
          </p>
        </form>
      </div>
    </div>
  );
}
