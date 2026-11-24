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
import { setupCrmApp } from '../pwa';

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
    // overscroll-contain: reaching the end of the menu never scrolls the page behind it
    <div className="flex h-full touch-pan-y flex-col overflow-y-auto overscroll-contain bg-navy-950 px-4 py-5 text-white [-webkit-overflow-scrolling:touch]">
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

  // installable as an app + notifications, only inside the CRM
  useEffect(() => setupCrmApp(), []);

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

  // the CRM stays live by itself (no "Refresh" needed): while it is on screen, every 15 s it fetches
  // only what changed (leads) and new website enquiries (with a message). Coming back to it (another
  // tab, or the phone app brought back) updates at once; after more than 3 minutes away it reloads
  // everything, so a change of role or permission shows too. Nothing runs while it is hidden.
  const toast = useUiStore((s) => s.showToast);
  useEffect(() => {
    if (!user || !loaded) return undefined;
    let hiddenAt = 0;
    const check = async () => {
      if (document.visibilityState !== 'visible') {
        hiddenAt = hiddenAt || Date.now();
        return;
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = 0;
      const crm = useCrmStore.getState();
      if (away > 3 * 60 * 1000) await crm.load();
      else await crm.sync();
      const fresh = await crm.pollEnquiries();
      if (fresh.length)
        toast(
          `New website enquiry: ${fresh[0].name}${fresh.length > 1 ? ` and ${fresh.length - 1} more` : ''}. See Website enquiries.`,
        );
    };
    const t = setInterval(check, 15 * 1000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
    };
  }, [user, loaded, toast]);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.title = 'Admin | Sai Krishna Homes';
  }, []);

  // phone menu open: freeze the page behind it (also on iPhone, where overflow:hidden alone is not
  // enough), close it with Esc / the back gesture's Escape, and put the page back where it was
  useEffect(() => {
    if (!open) return undefined;
    const y = window.scrollY;
    const b = document.body.style;
    const keep = {
      position: b.position,
      top: b.top,
      left: b.left,
      right: b.right,
      overflow: b.overflow,
    };
    Object.assign(b, {
      position: 'fixed',
      top: `-${y}px`,
      left: '0',
      right: '0',
      overflow: 'hidden',
    });
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      Object.assign(b, keep);
      window.scrollTo(0, y);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

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
            className="fixed inset-0 z-50 overscroll-none lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* the dark backdrop can't be dragged: a swipe on it does nothing but a tap closes */}
            <div
              className="absolute inset-0 touch-none bg-navy-950/60"
              onClick={() => setOpen(false)}
            />
            <motion.div
              // dvh: the full visible height, steady while the phone's address bar shows / hides
              className="absolute left-0 top-0 h-[100dvh] w-72 max-w-[85vw] shadow-2xl will-change-transform"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.28 }}
            >
              <SideNav onNavigate={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 z-10 rounded-full bg-navy-950/95 p-2 text-white/80 shadow-lg ring-1 ring-white/10 hover:text-white"
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
