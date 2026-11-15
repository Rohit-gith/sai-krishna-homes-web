import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const MARIGOLD = ['#F59E0B', '#FBBF24', '#F97316', '#FCD34D', '#EA580C'];

/** A soft shower of marigold petals (one-off, ~3.5 s). Transform/opacity only, so it stays light. */
export function PetalShower({ count = 26, className = 'fixed inset-0 z-[120]' }) {
  const reduce = useReducedMotion();
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.6 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 140,
        spin: (Math.random() - 0.5) * 720,
        size: 10 + Math.random() * 10,
        color: MARIGOLD[i % MARIGOLD.length],
      })),
    [count],
  );
  if (reduce) return null;
  return (
    <span aria-hidden="true" className={`pointer-events-none overflow-hidden ${className}`}>
      {petals.map((p) => (
        <motion.svg
          key={p.i}
          viewBox="0 0 20 28"
          className="absolute -top-10 will-change-transform"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.4 }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
          animate={{ y: '115vh', x: [0, p.drift * 0.5, p.drift], rotate: p.spin, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn', times: [0, 0.1, 0.85, 1] }}
        >
          <path d="M10 1 C17 6 19 15 15 23 C13 27 7 27 5 23 C1 15 3 6 10 1 Z" fill={p.color} />
          <path d="M10 4 V24" stroke="rgba(120,53,15,0.35)" strokeWidth="1" />
        </motion.svg>
      ))}
    </span>
  );
}

/** Gold line-art namaste (folded hands) that draws itself. */
export function Namaste({ className = 'h-14 w-14', delay = 0 }) {
  const lines = [
    'M50 6 C46 6 44 10 42 16 L32 52 C30 60 26 66 20 72 L14 78 C11 81 12 86 16 88 L34 96 C40 99 46 100 50 100 C54 100 60 99 66 96 L84 88 C88 86 89 81 86 78 L80 72 C74 66 70 60 68 52 L58 16 C56 10 54 6 50 6 Z',
    'M50 10 V97',
    'M45 26 L40 48 M55 26 L60 48',
    'M32 99 L29 110 M68 99 L71 110',
  ];
  return (
    <svg viewBox="0 0 100 112" className={className} aria-label="Namaste" role="img">
      {lines.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="#E8C06A"
          strokeWidth={i === 0 ? 3.2 : 2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: delay + i * 0.15, ease: [0.45, 0, 0.2, 1] }}
        />
      ))}
    </svg>
  );
}
