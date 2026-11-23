import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  RefreshCw,
  ScrollText,
  UserCircle,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCrmStore } from '../store/useCrmStore';
import { useTeamStore } from '../store/useTeamStore';
import { useUiStore } from '@/store/useUiStore';
import { ROLE_LABEL, can, fullName, hasLeadAccess } from '../access';
import Toast from '@/components/ui/Toast';
import PageLoader from '@/components/common/PageLoader';
import logoImg from '@/assets/logo/logo.png';
import { cn } from '@/utils/cn';
import { useForceDay } from '../useForceDay';

// show: who sees the link (the pages themselves are protected too, and the server checks everything)
const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, show: hasLeadAccess },
  { to: '/admin/leads', label: 'Leads & deals', icon: Users, show: hasLeadAccess },
  { to: '/admin/attempts', label: 'Attempts', icon: PhoneCall, show: hasLeadAccess },
  {
    to: '/admin/enquiries',
    label: 'Website enquiries',
    icon: Inbox,
    badge: true,
    show: (u) => can(u, 'enquiries.view'),
  },
  {
    to: '/admin/visits',
    label: 'Site visits',
    icon: CalendarCheck,
    show: (u) => can(u, 'visits.log') || can(u, 'visits.view_all'),
  },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, show: (u) => can(u, 'reports.view') },
  {
    to: '/admin/team',
    label: 'Team',
    icon: UsersRound,
    show: (u) => can(u, 'team.manage'),
    divider: true,
  },
  {
    to: '/admin/projects',
    label: 'Projects',
    icon: Building2,
    show: (u) => can(u, 'projects.manage'),
  },
  {
    to: '/admin/activity',
    label: 'Activity log',
    icon: ScrollText,
    show: (u) => can(u, 'activity.view'),
  },
  { to: '/admin/account', label: 'My account', icon: UserCircle },
];

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-3">
      <span className="block h-[2.2rem] w-9 overflow-hidden">
        <img src={logoImg} alt="" className="h-auto w-full" />
      </span>
      <span className="leading-tight">
        <span className="block font-serif text-lg font-semibold tracking-wide text-white">
          Sai Krishna
        </span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary-300">
          Admin · CRM
        </span>
      </span>
    </Link>
  );
}

function SideNav({ onNavigate }) {
  const unread = useCrmStore((s) => s.enquiries.filter((e) => !e.read).length);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const load = useCrmStore((s) => s.load);
  const loading = useCrmStore((s) => s.loading);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-navy-950 px-4 py-5 text-white">
      <div className="px-2">
        <Brand />
      </div>
      <nav className="mt-8 flex flex-col gap-1" aria-label="Admin">
        {NAV.filter((n) => !n.show || n.show(user)).map(
          ({ to, label, icon: Icon, end, badge, divider }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-75',
                  divider && 'mt-4',
                  isActive
                    ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#CFA557]'
                    : 'text-white/65 hover:bg-white/[0.03] hover:text-white',
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{label}</span>
              {badge && unread > 0 && (
                <span className="rounded-full bg-primary-400 px-2 py-0.5 text-[11px] font-bold text-navy-950">
                  {unread}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/65 hover:text-white disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh data
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/65 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" /> View website
        </a>
        <p className="truncate px-3 text-xs text-white/40" title={user?.email}>
          <span className="block truncate text-[13px] font-semibold text-white/85">
            {fullName(user)}
          </span>
          {user?.email}
          <span className="block text-[11px] font-semibold text-primary-300/80">
            {ROLE_LABEL[user?.role] || user?.role}
            {user?.designation ? ` · ${user.designation}` : ''}
          </span>
        </p>
        <button
          type="button"
          onClick={async () => {
            await logout();
            useCrmStore.getState().reset();
            useTeamStore.getState().reset();
            navigate('/login', { replace: true });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}

/** Admin shell. Redirects to /login when not signed in. */
export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const checked = useAuthStore((s) => s.checked);
  const check = useAuthStore((s) => s.check);
  const loaded = useCrmStore((s) => s.loaded);
  const loadError = useCrmStore((s) => s.loadError);
  const load = useCrmStore((s) => s.load);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useForceDay();

  // ask the server who is logged in, then fetch the CRM data once
  useEffect(() => {
    if (!checked) check();
  }, [checked, check]);
  useEffect(() => {
    if (user && !loaded) load();
    // signed out (or session expired): drop the data so the next person on this device never sees it
    if (!user && checked) {
      useCrmStore.getState().reset();
      useTeamStore.getState().reset();
    }
  }, [user, checked, loaded, load]);

  // new website enquiries arrive on their own, with a message
  const toast = useUiStore((s) => s.showToast);
  useEffect(() => {
    if (!user || !loaded) return undefined;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const fresh = await useCrmStore.getState().pollEnquiries();
      if (fresh.length)
        toast(
          `New website enquiry: ${fresh[0].name}${fresh.length > 1 ? ` and ${fresh.length - 1} more` : ''}. See Website enquiries.`,
        );
    };
    const t = setInterval(check, 30 * 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', check);
    };
  }, [user, loaded, toast]);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.title = 'Admin | Sai Krishna Homes';
  }, []);

  if (!checked) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-navy-950 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SideNav />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-navy-950 px-4 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute inset-y-0 left-0 w-72"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <SideNav onNavigate={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-5 p-2 text-white/70"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {loadError && !loaded ? (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center">
            <p className="font-semibold text-rose-700">Could not load the data.</p>
            <p className="mt-1 text-sm text-slate-600">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : !loaded ? (
          <PageLoader />
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <Toast />
    </div>
  );
}
