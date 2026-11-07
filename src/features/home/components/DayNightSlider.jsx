import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import Reveal from '@/components/common/Reveal';
import { PHOTOS, responsive } from '@/data/projects';

/**
 * "Dawn to dusk" comparison: the same Panchawati view by day and by night. Drag the handle (or use
 * the arrow keys) to wipe between them. A native range input drives it, so it is keyboard and
 * screen-reader friendly; the visuals are layered on top.
 */
export default function DayNightSlider() {
  const [pos, setPos] = useState(50);
  const frame = useRef(null);
  const touched = useRef(false);
  const inView = useInView(frame, { once: true, margin: '-25% 0px' });

  // One gentle "hint" sweep the first time the slider scrolls into view.
  useEffect(() => {
    if (!inView || touched.current) return undefined;
    const controls = animate(50, [50, 28, 72, 50], {
      duration: 2.4,
      ease: 'easeInOut',
      onUpdate: (v) => !touched.current && setPos(v),
    });
    return () => controls.stop();
  }, [inView]);

  const day = responsive(PHOTOS.pwDay, '(min-width: 1280px) 1216px, 100vw');
  const night = responsive(PHOTOS.pwNight, '(min-width: 1280px) 1216px, 100vw');

  return (
    <section className="bg-ivory py-20 md:py-28">
      <div className="container">
        <Reveal className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">Panchawati Residency</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.08] text-navy-950 md:text-[3.2rem]">
              From <em className="text-gold-rich font-medium">dawn</em> to <em className="text-gold-rich font-medium">dusk</em>
            </h2>
          </div>
          <p className="max-w-sm text-[15.5px] leading-[1.8] text-slate-600">
            Slide to see the same façade by day and as the lanterns come alive at night.
          </p>
        </Reveal>

        <div ref={frame} data-cursor="drag" className="relative aspect-[4/3] select-none overflow-hidden bg-navy-900 sm:aspect-[2400/1100]">
          {/* Day (base) */}
          <img {...day} alt={PHOTOS.pwDay.alt} loading="lazy" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
          {/* Night (revealed from the right) */}
          <img
            {...night}
            alt={PHOTOS.pwNight.alt}
            loading="lazy"
            draggable="false"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          />

          {/* Labels */}
          <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 bg-ivory/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-navy-900 sm:left-6 sm:top-6">
            <Sun className="h-3.5 w-3.5 text-primary-600" /> Day
          </span>
          <span className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 bg-navy-950/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary-200 sm:right-6 sm:top-6">
            <Moon className="h-3.5 w-3.5" /> Night
          </span>

          {/* Handle */}
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
            <div className="absolute inset-y-0 -translate-x-1/2 border-l-2 border-ivory shadow-[0_0_20px_rgba(0,0,0,0.35)]" />
            <div className="absolute top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ivory bg-navy-900/80 text-ivory shadow-xl backdrop-blur">
              <span className="flex items-center gap-1 text-lg leading-none">
                ‹<span className="h-4 w-px bg-primary-300" />›
              </span>
            </div>
          </div>

          {/* Accessible control covering the frame */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={pos}
            onChange={(e) => {
              touched.current = true;
              setPos(Number(e.target.value));
            }}
            onPointerDown={() => {
              touched.current = true;
            }}
            aria-label="Compare day and night views: slide to reveal the night view"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
    </section>
  );
}
