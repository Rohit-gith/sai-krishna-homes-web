import { useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Sai Krishna Homes mark: a classical arch (home / doorway) framing a peacock feather (mor pankh),
 * Krishna's emblem. Rendered in champagne gold.
 */
export function SkMark({ className }) {
  const id = useId().replace(/:/g, '');
  const gold = `skGold${id}`;
  return (
    <svg viewBox="0 0 48 58" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1DDA8" />
          <stop offset="0.5" stopColor="#C9A65A" />
          <stop offset="1" stopColor="#9C7A35" />
        </linearGradient>
      </defs>
      {/* Arch */}
      <path d="M5 55V24a19 19 0 0 1 38 0v31" stroke={`url(#${gold})`} strokeWidth="1.8" />
      <path d="M9.5 55V24.5a14.5 14.5 0 0 1 29 0V55" stroke={`url(#${gold})`} strokeWidth="0.8" opacity="0.55" />
      <path d="M1 55.5h46" stroke={`url(#${gold})`} strokeWidth="1.8" strokeLinecap="round" />
      {/* Feather stem */}
      <path d="M24 51V30" stroke={`url(#${gold})`} strokeWidth="1.2" strokeLinecap="round" />
      {/* Feather barbs */}
      <g stroke={`url(#${gold})`} strokeWidth="0.9" strokeLinecap="round" opacity="0.85">
        <path d="M24 34.5 18.5 30.5M24 34.5l5.5-4" />
        <path d="M24 39.5 17.5 35M24 39.5l6.5-4.5" />
        <path d="M24 44.5 18.5 41M24 44.5l5.5-3.5" />
      </g>
      {/* Feather eye */}
      <path d="M24 11c6.6 4.4 7.6 13.4 0 20.6-7.6-7.2-6.6-16.2 0-20.6Z" fill={`url(#${gold})`} />
      <ellipse cx="24" cy="22.2" rx="3.7" ry="5.2" fill="#0A0C10" />
      <ellipse cx="24" cy="22.8" rx="1.7" ry="2.5" fill="#E6CF9A" />
    </svg>
  );
}

/** Full lockup: mark + "SAI KRISHNA / HOMES" wordmark. */
export default function SkLogo({ className, compact = false }) {
  return (
    <a href="#top" className={cn('group flex items-center gap-3', className)} aria-label="Sai Krishna Homes, home">
      <SkMark className="h-11 w-9 shrink-0 transition-transform duration-500 group-hover:-translate-y-0.5" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-serif text-[1.35rem] font-semibold tracking-[0.18em] text-sk-ivory">
            SAI KRISHNA
          </span>
          <span className="mt-1.5 flex items-center gap-2 font-lux text-[10px] font-semibold uppercase tracking-[0.45em] text-sk-gold">
            <span className="h-px w-4 bg-sk-gold/60" />
            Homes
            <span className="h-px w-4 bg-sk-gold/60" />
          </span>
        </span>
      )}
    </a>
  );
}
