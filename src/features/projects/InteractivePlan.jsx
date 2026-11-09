import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Expand, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Master plan with numbered hotspots. Tap a marker (or a legend item) to see that part's details;
 * the card floats over the plan on desktop and sits below it on phones.
 * spots: [{ id, x, y, title, tag?, text, facts?: [label, value][], link?: { label, href } }]
 */
function SpotCard({ spot, onClose, onJump, className }) {
  return (
    <motion.div
      key={spot.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3 }}
      className={cn('bg-ivory shadow-2xl', className)}
    >
      <div className="relative p-5 md:grid md:grid-cols-[1fr_1.1fr] md:gap-6 md:p-6 md:pr-14">
        <div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center text-navy-900/60 hover:text-navy-950"
          >
            <X className="h-4 w-4" />
          </button>
          {spot.tag && (
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-700">
              {spot.tag}
            </p>
          )}
          <p className="mt-1 pr-8 font-serif text-2xl font-semibold text-navy-950">{spot.title}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{spot.text}</p>
        </div>
        <div>
          {spot.facts?.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-px border border-navy-900/10 bg-navy-900/10 md:mt-0">
              {spot.facts.map(([k, v]) => (
                <div key={k} className="bg-white px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {k}
                  </dt>
                  <dd className="mt-0.5 font-serif text-lg font-semibold text-navy-950">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {spot.link && (
            <button
              type="button"
              onClick={() => onJump(spot.link.href)}
              className="mt-4 inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.18em] text-primary-700 hover:text-navy-950"
            >
              {spot.link.label} <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function InteractivePlan({ image, spots, onZoom, className }) {
  const [active, setActive] = useState(spots[0]?.id ?? null);
  const spot = spots.find((s) => s.id === active);
  const jump = (hash) => {
    const el = document.getElementById(hash.replace('#', ''));
    if (el)
      window.scrollTo({
        top:
          el.getBoundingClientRect().top + window.scrollY - (window.innerWidth >= 768 ? 150 : 120),
        behavior: 'smooth',
      });
  };

  return (
    <div className={className}>
      <div className="relative overflow-hidden bg-white p-2 sm:p-3">
        <div className="relative">
          <img src={image.src} alt={image.alt} loading="lazy" className="block w-full" />
          {spots.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(active === s.id ? null : s.id)}
              aria-pressed={active === s.id}
              aria-label={s.title}
              className="group absolute -translate-x-1/2 -translate-y-1/2 p-2"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              <span
                className={cn(
                  'absolute inset-1 animate-ping rounded-full bg-primary-400/60',
                  active === s.id && 'hidden',
                )}
              />
              <span
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white font-serif text-sm font-semibold shadow-lg transition-colors sm:h-10 sm:w-10 sm:text-base',
                  active === s.id
                    ? 'bg-primary-400 text-navy-950'
                    : 'bg-navy-900 text-white group-hover:bg-primary-500',
                )}
              >
                {s.short || i + 1}
              </span>
            </button>
          ))}
        </div>
        {onZoom && (
          <button
            type="button"
            onClick={onZoom}
            className="absolute right-4 top-4 flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:right-5 sm:top-5"
          >
            <Expand className="h-3.5 w-3.5" /> Zoom
          </button>
        )}
      </div>

      <div className="mt-3">
        <AnimatePresence mode="wait">
          {spot && (
            <SpotCard
              spot={spot}
              onClose={() => setActive(null)}
              onJump={jump}
              className="shadow-none ring-1 ring-primary-200"
            />
          )}
        </AnimatePresence>
      </div>

      <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-navy-900/10 pt-3">
        {spots.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setActive(s.id)}
              className={cn(
                'flex items-center gap-2.5 py-2 text-[12.5px] font-bold uppercase tracking-[0.12em] transition-colors',
                active === s.id ? 'text-primary-700' : 'text-navy-900 hover:text-primary-700',
              )}
            >
              <span className="font-serif text-base normal-case tracking-normal text-primary-500">
                {s.short || i + 1}
              </span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
