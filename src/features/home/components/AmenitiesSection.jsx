import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { AMENITY_TILES, MORE_AMENITIES, PHOTOS } from '@/data/projects';

const CARDS = [
  ...AMENITY_TILES,
  { ...PHOTOS.skAerialPool, title: 'Township Pool', note: 'A second pool amid the towers' },
  { ...PHOTOS.skAerialGreen, title: 'Open Greens', note: 'Wide lawns between the residences' },
];

/** Arch-topped amenity cards in a horizontal, swipeable strip over a jaali-patterned emerald field. */
export default function AmenitiesSection() {
  const strip = useRef(null);
  const scroll = (dir) => strip.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });

  return (
    <section id="amenities" className="section relative scroll-mt-24 overflow-hidden bg-navy-950">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="container relative">
        <ChapterHeading
          light
          numeral="II"
          label="The life"
          title="Resort living, every single day"
          intro="25+ curated amenities across the community, so weekends feel like holidays and evenings feel like home."
        />
      </div>

      {/* Arch strip: starts aligned with the container, bleeds off the right edge */}
      <div
        ref={strip}
        data-cursor="drag"
        className="no-scrollbar relative flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-pl-4 px-4 pb-4 sm:scroll-pl-6 sm:px-6 lg:scroll-pl-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] lg:px-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))]"
      >
        {CARDS.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.05} className="w-[17rem] shrink-0 snap-start sm:w-[19rem]">
            <figure className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-primary-300/40 p-2">
                <div className="h-full w-full overflow-hidden rounded-t-full">
                  <img
                    src={c.sm}
                    alt={c.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                  />
                </div>
              </div>
              <figcaption className="mt-5 flex gap-4">
                <span className="font-serif text-sm text-primary-300">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block font-serif text-2xl text-white">{c.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-white/60">{c.note}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <div className="container relative mt-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/70">
          {MORE_AMENITIES.map((a, i) => (
            <li key={a} className="flex items-center gap-6">
              {a}
              {i < MORE_AMENITIES.length - 1 && <span className="text-primary-400">✦</span>}
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 gap-2">
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => scroll(dir)}
              aria-label={dir < 0 ? 'Previous amenities' : 'Next amenities'}
              className="flex h-14 w-14 items-center justify-center border border-white/25 text-white transition-colors hover:border-primary-300 hover:bg-primary-300 hover:text-navy-950"
            >
              {dir < 0 ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
