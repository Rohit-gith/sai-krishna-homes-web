import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowRight, Phone, LayoutGrid } from 'lucide-react';
import ExploreMenu from '@/features/explore/ExploreMenu';
import ProjectsMenu from './ProjectsMenu';
import { PROJECT_PAGES, projectPath } from '@/data/projectPages';
import { CHAPTERS, chapterPath } from '@/features/explore/chapters';
import ChapterVisual from '@/features/explore/ChapterVisual';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Magnetic from '@/components/common/Magnetic';
import ThemeToggle from '@/components/common/ThemeToggle';
import { BOOK_VISIT, NAV_LINKS } from '@/constants/navLinks';
import { COMPANY } from '@/data/companyInfo';
import { useUiStore } from '@/store/useUiStore';
import { useScrolled } from '@/hooks/useScrollPosition';
import { cn } from '@/utils/cn';

// Luxury split layout: section links on the left, logo centred, company links + CTA on the right.
const LEFT = NAV_LINKS.filter((l) => l.side === 'left');
const RIGHT = NAV_LINKS.filter((l) => !l.side && l.to !== '/');

function DeskLink({ link }) {
  return (
    <NavLink
      to={link.to}
      className={({ isActive }) =>
        cn(
          'group relative py-2 text-[12px] font-bold uppercase tracking-[0.2em] transition-colors',
          isActive && !link.hash ? 'text-primary-700' : 'text-navy-900 hover:text-primary-700',
        )
      }
    >
      {({ isActive }) => (
        <>
          {link.label}
          <span
            className={cn(
              'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-primary-500 transition-transform duration-300',
              isActive && !link.hash ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
            )}
          />
        </>
      )}
    </NavLink>
  );
}

/** Opens the full-screen Explore table of contents. */
function ExploreButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 border border-primary-400/70 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
    >
      <LayoutGrid className="h-3.5 w-3.5 text-primary-600 group-hover:text-primary-300" /> Explore
    </button>
  );
}

export default function Navbar() {
  const [exploring, setExploring] = useState(false);
  const scrolled = useScrolled(40);
  const { pathname } = useLocation();
  const isOpen = useUiStore((s) => s.isMobileMenuOpen);
  const toggle = useUiStore((s) => s.toggleMobileMenu);
  const close = useUiStore((s) => s.closeMobileMenu);

  // Close mobile menu on route change
  useEffect(() => close(), [pathname, close]);

  // Lock page scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled ? 'border-primary-200/70 bg-ivory/95 shadow-soft backdrop-blur-xl' : 'border-primary-200/50 bg-ivory',
      )}
    >
      <div className="container">
        <div className="grid h-16 grid-cols-[auto_1fr] items-center md:h-[5.75rem] xl:grid-cols-[1fr_auto_1fr]">
          <nav className="hidden items-center gap-9 xl:flex" aria-label="Sections">
            {LEFT.map((link) => (link.to === '/projects' ? <ProjectsMenu key={link.to} /> : <DeskLink key={link.to} link={link} />))}
            <ExploreButton onClick={() => setExploring(true)} />
          </nav>

          <Logo className="xl:justify-self-center" />

          <div className="flex items-center justify-end gap-8">
            {/* 1024–1279px: all links sit together on the right */}
            <nav className="hidden items-center gap-7 lg:flex xl:hidden" aria-label="Main">
              {[...LEFT, ...RIGHT].map((link) =>
                link.to === '/projects' ? <ProjectsMenu key={link.to} align="right" /> : <DeskLink key={link.to} link={link} />,
              )}
              <ExploreButton onClick={() => setExploring(true)} />
            </nav>
            <nav className="hidden items-center gap-9 xl:flex" aria-label="Company">
              {RIGHT.map((link) => (
                <DeskLink key={link.to} link={link} />
              ))}
            </nav>
            <ThemeToggle className="-mr-3 lg:mr-0" />
            <Magnetic className="hidden sm:inline-flex">
              <Button to={BOOK_VISIT} size="sm">
                Book a Visit
              </Button>
            </Magnetic>
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center text-navy-950 lg:hidden"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu: full-height editorial list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-[calc(100svh-4rem)] overflow-y-auto border-t border-primary-200/60 bg-ivory lg:hidden"
          >
            <nav className="container flex flex-col py-6" aria-label="Mobile">
              {NAV_LINKS.map((link, i) => (
                <div key={link.to} className="border-b border-navy-900/10">
                  <NavLink to={link.to} end={link.to === '/'} className="flex items-baseline gap-4 py-4">
                    <span className="text-outline-gold font-serif text-2xl">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-serif text-3xl text-navy-950">{link.label}</span>
                  </NavLink>
                  {link.to === '/projects' && (
                    <div className="mb-4 ml-11 grid gap-2">
                      {PROJECT_PAGES.map((p) => (
                        <NavLink key={p.slug} to={projectPath(p.slug)} className="flex items-center gap-3">
                          <img src={p.card.sm} alt="" loading="lazy" className="h-11 w-16 object-cover" />
                          <span>
                            <span className="block font-serif text-lg leading-tight text-navy-950">{p.name}</span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">Current project</span>
                          </span>
                        </NavLink>
                      ))}
                      <NavLink to="/projects?tab=past" className="py-1 text-[12px] font-bold uppercase tracking-[0.2em] text-navy-900">
                        Past projects →
                      </NavLink>
                    </div>
                  )}
                </div>
              ))}
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">Explore</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {CHAPTERS.map((c) => (
                  <NavLink key={c.slug} to={chapterPath(c.slug)} className="group">
                    <ChapterVisual chapter={c} className="aspect-[4/3] w-full" />
                    <span className="mt-1.5 block font-serif text-base leading-tight text-navy-950">{c.title}</span>
                  </NavLink>
                ))}
              </div>
              <Button to={BOOK_VISIT} className="mt-8">
                Book a Visit <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href={`tel:${COMPANY.phone}`}
                className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-navy-900"
              >
                <Phone className="h-4 w-4 text-primary-600" /> {COMPANY.phoneDisplay}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <ExploreMenu open={exploring} onClose={() => setExploring(false)} />
    </header>
  );
}
