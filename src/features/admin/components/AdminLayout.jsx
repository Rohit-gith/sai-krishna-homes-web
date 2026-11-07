import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, PhoneCall, Users, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCrmStore } from '../store/useCrmStore';
import Toast from '@/components/ui/Toast';
import PageLoader from '@/components/common/PageLoader';
import logoImg from '@/assets/logo/logo.png';
import { cn } from '@/utils/cn';
import { useForceDay } from '../useForceDay';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/leads', label: 'Leads & deals', icon: Users },
  { to: '/admin/attempts', label: 'Attempts', icon: PhoneCall },
  { to: '/admin/enquiries', label: 'Website enquiries', icon: Inbox, badge: true },
];

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-3">
      <span className="block h-[2.2rem] w-9 overflow-hidden">
        <img src={logoImg} alt="" className="h-auto w-full" />
      </span>
      <span className="leading-tight">
        <span className="block font-serif text-lg font-semibold tracking-wide text-white">Sai Krishna</span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary-300">Admin · CRM</span>
      </span>
    </Link>
  );
}

function SideNav({ onNavigate }) {
  const unread = useCrmStore((s) => s.enquiries.filter((e) => !e.read).length);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-navy-950 px-4 py-6 text-white">
      <div className="px-2">
        <Brand />
      </div>
      <nav className="mt-10 flex flex-col gap-1" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && unread > 0 && (
              <span className="rounded-full bg-primary-400 px-2 py-0.5 text-[11px] font-bold text-navy-950">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/65 hover:text-white">
          <ExternalLink className="h-4 w-4" /> View website
        </a>
        <p className="truncate px-3 text-xs text-white/40">{user?.email}</p>
        <button
          type="button"
          onClick={() => {
            logout();
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
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useForceDay();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.title = 'Admin | Sai Krishna Homes';
  }, []);

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
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-white">
          <Menu className="h-6 w-6" />
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute inset-y-0 left-0 w-72"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <SideNav onNavigate={() => setOpen(false)} />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-5 p-2 text-white/70">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Toast />
    </div>
  );
}
