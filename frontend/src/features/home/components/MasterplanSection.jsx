import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { PHOTOS, responsive } from '@/data/projects';
import { cn } from '@/utils/cn';

/**
 * Hotspots on the township aerial render. Positions are % of the image (x from left, y from top),
 * placed by eye on features clearly visible in the render.
 * TODO: confirm labels and positions with the client's site plan before launch.
 */
const SPOTS = [
  {
    id: 'towers',
    x: 47,
    y: 52,
    title: 'Residential towers',
    text: 'Type-1 (2 BHK) and Type-2 (1 BHK) mid-rise towers with stilt parking.',
    photo: PHOTOS.skT1Front,
  },
  {
    id: 'water',
    x: 31,
    y: 80,
    title: 'Water feature',
    text: 'A landscaped water court along the edge of the towers.',
  },
  {
    id: 'greens',
    x: 10,
    y: 15,
    title: 'Open greens',
    text: 'Wide lawns and a planted green belt around the community.',
    photo: PHOTOS.skAerialGreen,
  },
  {
    id: 'avenue',
    x: 72,
    y: 12,
    title: 'Towers along the avenue',
    text: 'More residences line the internal avenue to the north.',
    photo: PHOTOS.skTwin,
  },
  {
    id: 'road',
    x: 88,
    y: 74,
    title: 'Approach road',
    text: 'A wide paved approach road for easy access to the gates.',
  },
];

function SpotCard({ spot, onClose, className }) {
  return (
    <motion.div
      key={spot.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('bg-ivory shadow-2xl', className)}
    >
      {spot.photo && <img src={spot.photo.sm} alt={spot.photo.alt} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
      <div className="relative p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-navy-900/60 hover:text-navy-950"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-700">Masterplan</p>
        <p className="mt-1 pr-8 font-serif text-xl font-semibold text-navy-950">{spot.title}</p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{spot.text}</p>
      </div>
    </motion.div>
  );
}

export default function MasterplanSection({ numeral = '✦' } = {}) {
  const [active, setActive] = useState('towers');
  const spot = SPOTS.find((s) => s.id === active);

  return (
    <section id="masterplan" className="section scroll-mt-24 bg-white">
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label="The masterplan"
          title="Explore the township"
          intro="Tap a marker to discover what sits where across the Sai Krishna Residency community."
        />

        <Reveal className="relative">
          <div className="relative overflow-hidden bg-navy-50">
            <img
              {...responsive(PHOTOS.skAerialPool, '(min-width: 1280px) 1216px, 100vw')}
              loading="lazy"
              className="block aspect-[2400/1500] w-full object-cover"
            />
            {SPOTS.map((s, i) => (
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
                    'absolute inset-1 animate-ping rounded-full bg-primary-400/50',
                    active === s.id && 'hidden',
                  )}
                />
                <span
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white font-serif text-sm font-semibold shadow-lg transition-colors sm:h-10 sm:w-10 sm:text-base',
                    active === s.id ? 'bg-primary-400 text-navy-950' : 'bg-navy-900 text-white group-hover:bg-primary-500',
                  )}
                >
                  {i + 1}
                </span>
              </button>
            ))}

            {/* Desktop: card floats over the plan */}
            <div className="absolute bottom-5 right-5 hidden w-80 md:block">
              <AnimatePresence mode="wait">
                {spot && <SpotCard spot={spot} onClose={() => setActive(null)} />}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile: card below the plan */}
          <div className="mt-4 md:hidden">
            <AnimatePresence mode="wait">
              {spot && <SpotCard spot={spot} onClose={() => setActive(null)} className="shadow-none ring-1 ring-primary-200" />}
            </AnimatePresence>
          </div>

          {/* Legend (also the easiest way to choose on a phone) */}
          <ol className="mt-6 grid gap-x-6 gap-y-1 border-t border-navy-900/10 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            {SPOTS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'flex w-full items-center gap-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-[0.12em] transition-colors',
                    active === s.id ? 'text-primary-700' : 'text-navy-900 hover:text-primary-700',
                  )}
                >
                  <span className="font-serif text-base normal-case tracking-normal text-primary-500">{i + 1}</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
