import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, Calculator, ChevronDown, History, LayoutGrid, RotateCw } from 'lucide-react';
import { PROJECT_PAGES, projectPath } from '@/data/projectPages';
import { cn } from '@/utils/cn';

const EXTRA = [
  { to: '/projects', label: 'All projects', icon: LayoutGrid },
  { to: '/projects?tab=past', label: 'Past projects', icon: History },
  { to: '/explore/virtual-tour', label: '360° virtual tour', icon: RotateCw },
  { to: '/explore/emi-calculator', label: 'EMI calculator', icon: Calculator },
];

/** Desktop "Projects" link with a hover/focus mega-panel of current projects and quick links. */
export default function ProjectsMenu({ align = 'left' }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const { pathname, search } = useLocation();

  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hide()}>
      <NavLink
        to="/projects"
        aria-haspopup="true"
        aria-expanded={open}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-1 py-2 text-[12px] font-bold uppercase tracking-[0.2em] transition-colors',
            isActive ? 'text-primary-700' : 'text-navy-900 hover:text-primary-700',
          )
        }
      >
        {({ isActive }) => (
          <>
            Projects
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
            <span className={cn('absolute inset-x-0 -bottom-0.5 h-px origin-left bg-primary-500 transition-transform duration-300', isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100')} />
          </>
        )}
      </NavLink>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            className={cn('absolute top-full z-50 pt-5', align === 'left' ? '-left-6' : '-right-24')}
          >
            <div className="grid w-[46rem] grid-cols-[1fr_1fr_13rem] gap-4 border border-primary-200/70 bg-ivory p-4 shadow-[0_40px_80px_-30px_rgba(8,38,32,0.45)]">
              {PROJECT_PAGES.map((p) => (
                <Link key={p.slug} to={projectPath(p.slug)} className="group block bg-white p-2.5 transition-shadow hover:shadow-soft">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-navy-100">
                    <img src={p.card.sm} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 bg-ivory px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.2em] text-navy-900">Current</span>
                  </span>
                  <span className="mt-3 flex items-start justify-between gap-2 px-1">
                    <span>
                      <span className="block font-serif text-lg leading-tight text-navy-950">{p.name}</span>
                      <span className="mt-1 block text-[12px] text-slate-500">{p.location.split(' · ')[0]}</span>
                    </span>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-primary-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 px-1 pb-1 text-[10.5px] font-semibold text-slate-500">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary-600" /> RERA {p.rera}
                  </span>
                </Link>
              ))}
              <ul className="flex flex-col border-l border-primary-200/70 pl-4">
                <li className="pb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary-700">Discover</li>
                {EXTRA.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link to={to} className="flex items-center gap-3 border-b border-navy-900/10 py-3 text-[13.5px] font-semibold text-navy-900 hover:text-primary-700">
                      <Icon className="h-4 w-4 text-primary-600" /> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
