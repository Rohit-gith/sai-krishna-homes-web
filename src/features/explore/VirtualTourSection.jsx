import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Maximize2, Play, RotateCw } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { VIRTUAL_TOURS } from '@/data/projects';
import { TourArt } from './ChapterVisual';
import { cn } from '@/utils/cn';

/**
 * 360° tours (Housing.com Digitour) shown inside the site. The heavy viewer only loads after the
 * visitor taps "Start tour", so the page itself stays fast on phones.
 */
export default function VirtualTourSection({
  numeral = 'I',
  label = '360° virtual tour',
  title = 'Walk through a 3 BHK home',
  intro = 'Step inside and look around every room in 360°. Drag to look around; on a phone, simply move it.',
  className = 'bg-white',
}) {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const frame = useRef(null);
  const tour = VIRTUAL_TOURS[active];

  const fullscreen = () => {
    const el = frame.current;
    if (!el) return;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  return (
    <section id="virtual-tour" className={cn('section scroll-mt-24', className)}>
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label={label}
          title={title}
          intro={intro}
        />

        <Reveal>
          {/* Tour tabs */}
          <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose a tour">
            {VIRTUAL_TOURS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={cn(
                  'border px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.18em] transition-colors',
                  active === i ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 text-navy-900 hover:border-primary-400',
                )}
              >
                {t.label}
              </button>
            ))}
            <span className="ml-auto hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <RotateCw className="h-3.5 w-3.5 text-primary-600" /> Drag to look around
            </span>
          </div>

          {/* Viewer */}
          <div ref={frame} className="relative aspect-[3/4] overflow-hidden bg-navy-950 sm:aspect-[16/10] lg:aspect-[16/9]">
            {started ? (
              <iframe
                key={tour.id}
                title={`360° virtual tour: ${tour.label}`}
                src={tour.url}
                allow="fullscreen; gyroscope; accelerometer; magnetometer; xr-spatial-tracking"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button type="button" onClick={() => setStarted(true)} className="group absolute inset-0 block" aria-label={`Start the 360° tour of ${tour.label}`}>
                {tour.poster ? (
                  // The real room from inside the tour, slowly panning to hint that you can look around.
                  <AnimatePresence initial={false}>
                    <motion.span key={tour.id} className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                      <motion.img
                        src={tour.poster.src}
                        srcSet={`${tour.poster.sm} 760w, ${tour.poster.src} 1600w`}
                        sizes="(min-width: 1280px) 1216px, 100vw"
                        alt={tour.poster.alt}
                        className="absolute inset-y-0 left-0 h-full w-[118%] max-w-none object-cover"
                        animate={{ x: ['0%', '-15%'] }}
                        transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
                      />
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <TourArt className="absolute inset-0 h-full w-full" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/15 to-navy-950/25" />
                {/* 360 badge */}
                <span className="absolute left-4 top-4 flex items-center gap-3 bg-navy-950/70 py-2 pl-2 pr-4 text-white backdrop-blur sm:left-6 sm:top-6">
                  <span className="relative flex h-11 w-11 items-center justify-center">
                    <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full animate-spin-slow" aria-hidden>
                      <circle cx="22" cy="22" r="19" fill="none" stroke="#CFA557" strokeWidth="1.5" strokeDasharray="100 20" />
                      <path d="M39 15 l2 6 -6 -1 z" fill="#CFA557" />
                    </svg>
                    <span className="font-serif text-[13px] font-semibold">360°</span>
                  </span>
                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-primary-300">Virtual tour</span>
                    <span className="block font-serif text-lg leading-tight">{tour.label}</span>
                  </span>
                </span>
                <span className="absolute inset-0 flex flex-col items-center justify-end gap-4 pb-10 sm:justify-center sm:pb-0">
                  <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ivory text-navy-950 shadow-2xl transition-transform group-hover:scale-105">
                    <span className="absolute inset-0 animate-ping rounded-full bg-ivory/40" />
                    <Play className="relative ml-1 h-8 w-8 fill-current" />
                  </span>
                  <span className="bg-ivory px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.2em] text-navy-950">
                    Step inside · {tour.label}
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-xs text-slate-500">360° tour powered by Housing.com</p>
            <div className="flex gap-2">
              {started && (
                <button
                  type="button"
                  onClick={fullscreen}
                  className="inline-flex items-center gap-2 border border-navy-900/20 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.15em] text-navy-900 hover:border-primary-400"
                >
                  <Maximize2 className="h-4 w-4" /> Full screen
                </button>
              )}
              <a
                href={tour.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-navy-900/20 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.15em] text-navy-900 hover:border-primary-400"
              >
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
