import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Phone, X } from 'lucide-react';
import SkLogo from './SkLogo';
import { SK, SK_NAV } from '../data';
import { cn } from '@/utils/cn';

export default function SkNavbar({ onEnquire }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-500',
        scrolled ? 'border-b border-white/5 bg-sk-ink/85 py-3 backdrop-blur-xl' : 'py-5 md:py-7',
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <SkLogo />

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
          {SK_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative font-lux text-[13px] font-medium uppercase tracking-[0.16em] text-sk-ivory/80 transition-colors hover:text-sk-ivory"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-sk-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${SK.phone}`}
            className="hidden items-center gap-2 font-lux text-sm font-medium text-sk-ivory/90 hover:text-sk-gold-light xl:flex"
          >
            <Phone className="h-4 w-4 text-sk-gold" /> {SK.phoneDisplay}
          </a>
          <button
            type="button"
            onClick={onEnquire}
            className="hidden rounded-full border border-sk-gold/60 px-5 py-2.5 font-lux text-xs font-semibold uppercase tracking-[0.18em] text-sk-gold-light transition-all hover:bg-sk-gold hover:text-sk-ink sm:block"
          >
            Enquire Now
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-sk-ivory lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-sk-ink px-6 pb-10 pt-6 lg:hidden"
          >
            <div className="flex items-center justify-between">
              <SkLogo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-sk-ivory"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-14 flex flex-col gap-1" aria-label="Mobile">
              {SK_NAV.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-white/5 py-4 font-serif text-3xl text-sk-ivory"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onEnquire();
                }}
                className="rounded-full bg-sk-gold py-4 font-lux text-sm font-semibold uppercase tracking-[0.18em] text-sk-ink"
              >
                Book a Site Visit
              </button>
              <a
                href={`tel:${SK.phone}`}
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-4 font-lux text-sm text-sk-ivory"
              >
                <Phone className="h-4 w-4 text-sk-gold" /> {SK.phoneDisplay}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
