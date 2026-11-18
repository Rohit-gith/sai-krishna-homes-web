import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Home } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Scroll "journey": a gold rail on the right (desktop) with a little house that travels down as the
 * visitor scrolls, lighting each stop it passes; a thin gold progress bar on phones.
 * stops: [{ id, label }] — ids of elements on the page.
 */
export function JourneyRail({ stops }) {
  const reduce = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.25 });
  // GPU-only motion: the house moves with transform (y in px of the rail), the fill with scaleY
  const rail = useRef(null);
  const [railH, setRailH] = useState(0);
  useEffect(() => {
    const measure = () => setRailH(rail.current?.offsetHeight || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const y = useTransform(p, (v) => v * railH);
  // phones: the house travels along the top bar (kept inside the screen edges)
  const mobileX = useTransform(p, (v) => {
    const w = typeof window !== 'undefined' ? document.documentElement.clientWidth : 390;
    const t = Math.min(1, Math.max(0, v)); // the spring can overshoot past the end
    // x is the badge's left edge (22px wide): keep 4px clear of both screen edges
    return 4 + t * Math.max(0, w - 30);
  });
  const [active, setActive] = useState(0);
  // phones: the section name hangs under the house for a moment each time a new section starts.
  // The pill's own shift runs 0 → -100% with progress, so it never runs off either screen edge.
  const houseCentre = useTransform(mobileX, (x) => x + 11);
  const pillShift = useTransform(p, (v) => `${-Math.min(1, Math.max(0, v)) * 100}%`);
  const [flash, setFlash] = useState(false);
  const seen = useRef(false);
  useEffect(() => {
    if (!seen.current) {
      seen.current = true; // not on page load, only when the visitor reaches a new section
      return undefined;
    }
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1800);
    return () => clearTimeout(t);
  }, [active]);

  // which stop is in view: section tops are measured once (and on resize / late image loads),
  // then each scroll just compares numbers, so scrolling never forces a layout
  const tops = useRef([]);
  useEffect(() => {
    const measure = () => {
      tops.current = stops.map((x) => {
        const el = document.getElementById(x.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      });
    };
    measure();
    const t1 = setTimeout(measure, 1200);
    const t2 = setTimeout(measure, 4000);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, [stops]);
  useMotionValueEvent(scrollY, 'change', (v) => {
    const line = v + window.innerHeight * 0.45;
    let i = 0;
    tops.current.forEach((t, k) => {
      if (t <= line) i = k;
    });
    setActive((cur) => (cur === i ? cur : i));
  });

  return (
    <>
      {/* phones: gold progress bar at the top, with the little house riding along it */}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-[55] h-[3px] md:top-[5.75rem] lg:hidden">
        <motion.div className="h-full origin-left bg-gradient-to-r from-primary-500 to-primary-300 will-change-transform" style={{ scaleX: reduce ? scrollYProgress : p }} />
        <motion.span
          className="absolute -top-[9px] left-0 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-navy-900 text-primary-300 shadow-[0_4px_12px_-2px_rgba(8,38,32,0.6)] ring-2 ring-primary-400 will-change-transform"
          style={{ x: mobileX }}
        >
          <Home className="h-3 w-3" />
        </motion.span>
        <motion.div className="absolute left-0 top-[18px]" style={{ x: houseCentre }}>
          <AnimatePresence mode="wait">
            {flash && stops[active] && (
              <motion.span
                key={stops[active].id}
                role="status"
                className="block whitespace-nowrap rounded-full bg-navy-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-200 shadow-[0_6px_16px_-6px_rgba(8,38,32,0.6)] ring-1 ring-primary-400/60"
                style={{ x: pillShift }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {stops[active].label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* desktop: the rail */}
      <nav aria-label="Page journey" className="fixed right-5 top-1/2 z-[45] hidden h-[56vh] -translate-y-1/2 lg:block">
        <div ref={rail} className="relative h-full w-px bg-navy-900/15">
          <motion.div className="absolute inset-0 w-px origin-top bg-primary-400 will-change-transform" style={{ scaleY: reduce ? scrollYProgress : p }} />
          {stops.map((s, i) => {
            const at = `${(i / (stops.length - 1)) * 100}%`;
            const on = i <= active;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="group absolute right-0 flex -translate-y-1/2 translate-x-1/2 items-center"
                style={{ top: at }}
                aria-label={s.label}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute right-5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow transition-all duration-300',
                    i === active ? 'bg-navy-900 text-primary-200 opacity-100' : 'bg-white text-navy-900 opacity-0 group-hover:opacity-100',
                  )}
                >
                  {s.label}
                </span>
                <span className={cn('block h-2.5 w-2.5 rounded-full border-2 transition-colors duration-300', on ? 'border-primary-400 bg-primary-400' : 'border-navy-900/25 bg-ivory')} />
              </a>
            );
          })}
          {/* the little house travelling down */}
          <motion.span className="absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-primary-300 shadow-[0_6px_18px_-4px_rgba(8,38,32,0.6)] ring-2 ring-primary-400 will-change-transform" style={{ y }}>
            <Home className="h-4 w-4" />
          </motion.span>
        </div>
      </nav>
    </>
  );
}

/** Each section opens like a curtain lifting as it scrolls into view (once). */
export function Reveal({ id, children }) {
  const reduce = useReducedMotion();
  if (reduce) return <div id={id}>{children}</div>;
  return (
    <motion.div
      id={id}
      className="scroll-mt-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** A short line between sections that makes the visitor want to see the next one. */
export function HookLine({ children, emoji, dark = false }) {
  return (
    <div className={cn('hook-line relative pb-2 pt-10 text-center md:pb-4 md:pt-12', dark ? 'bg-navy-950' : 'bg-ivory')}>
      <motion.p
        className={cn('mx-auto max-w-2xl px-6 font-serif text-[1.35rem] italic leading-snug md:text-[1.9rem]', dark ? 'text-primary-200' : 'text-navy-900')}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {emoji && (
          <motion.span
            className="mr-2 inline-block not-italic"
            initial={{ scale: 0, rotate: -30 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.25 }}
          >
            {emoji}
          </motion.span>
        )}
        {children}
      </motion.p>
      <motion.span
        aria-hidden="true"
        className="mx-auto mt-4 block h-8 w-px bg-primary-400"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{ originY: 0 }}
      />
    </div>
  );
}
