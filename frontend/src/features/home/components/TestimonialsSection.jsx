import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { PHOTOS, responsive } from '@/data/projects';

/**
 * Taken verbatim from the client's existing website (named reviews only).
 * TODO: confirm with the client before launch, and add more real reviews (ideally with photos/video).
 */
const VOICES = [
  {
    quote:
      'Every detail was handled with care and precision. The team made the journey effortless, and the final result far surpassed what I had envisioned.',
    name: 'Bhavana Singh',
    role: 'Verified Resident',
  },
  {
    quote:
      'A seamless journey backed by a highly professional team. Their dedication and eye for detail made all the difference, delivering a result that truly impressed.',
    name: 'Arvind Malhotra',
    role: 'Verified Resident',
  },
];
const ROTATE_MS = 8000;

export default function TestimonialsSection({ numeral = 'VI' } = {}) {
  const [i, setI] = useState(0);
  const go = (d) => setI((v) => (v + d + VOICES.length) % VOICES.length);

  useEffect(() => {
    const t = setTimeout(() => setI((v) => (v + 1) % VOICES.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [i]);

  const v = VOICES[i];

  return (
    <section id="testimonials" className="section relative scroll-mt-24 overflow-hidden bg-navy-950">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="container relative">
        <ChapterHeading
          light
          numeral={numeral}
          label="In their words"
          title="Families who call it home"
          intro="Rated 4.8 by residents. Here is what some of them say about living with Sai Krishna Homes."
        />

        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
          {/* Rating plate over an arch photo */}
          <Reveal className="relative mx-auto w-full max-w-sm">
            <div className="rounded-t-full border border-primary-300/40 p-3">
              <div className="aspect-[4/5] overflow-hidden rounded-t-full">
                <img
                  {...responsive(PHOTOS.pwGarden, '(min-width: 1024px) 30vw, 90vw')}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 bg-ivory px-6 py-5 text-center shadow-2xl">
              <p className="font-serif text-5xl font-semibold leading-none text-navy-950">4.8</p>
              <p className="mt-2 flex justify-center gap-1 text-primary-500">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                1,000+ resident reviews
              </p>
            </div>
          </Reveal>

          {/* Quote */}
          <div className="pt-6 lg:pt-0">
            <span aria-hidden className="block font-serif text-[7rem] leading-[0.6] text-primary-400/60 md:text-[9rem]">
              “
            </span>
            <div className="relative min-h-[15rem] md:min-h-[13rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.figure
                  key={v.name}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <blockquote className="font-serif text-[1.6rem] leading-[1.45] text-white md:text-[2.1rem]">
                    {v.quote}
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-300/60 font-serif text-lg text-primary-200">
                      {v.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')}
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold text-white">{v.name}</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-300">{v.role}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-6">
              <p className="font-serif text-lg text-white/70">
                <span className="text-white">{String(i + 1).padStart(2, '0')}</span> / {String(VOICES.length).padStart(2, '0')}
              </p>
              <div className="flex gap-2">
                {[-1, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => go(d)}
                    aria-label={d < 0 ? 'Previous review' : 'Next review'}
                    className="flex h-14 w-14 items-center justify-center border border-white/25 text-white transition-colors hover:border-primary-300 hover:bg-primary-300 hover:text-navy-950"
                  >
                    {d < 0 ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
