import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from '@/components/common/Reveal';
import { PHOTOS, responsive } from '@/data/projects';

const SCENES = [
  { time: '06:00', title: 'Sunrise over the lotus pond', text: 'Mornings begin with soft light on the classical façade.', photo: PHOTOS.pwDay },
  { time: '11:00', title: 'Poolside, beneath the palms', text: 'A slow swim beside the cascading water wall.', photo: PHOTOS.pwPool },
  { time: '17:00', title: 'An evening in the garden', text: 'Green lawns and a quiet court for the elders of the family.', photo: PHOTOS.pwGarden },
  { time: '19:30', title: 'Up on the rooftop', text: 'Sky-garden seating as the city lights come on.', photo: PHOTOS.pwRooftop },
  { time: '21:00', title: 'Home, by lantern light', text: 'The gateway glows as you return.', photo: PHOTOS.pwGate },
];

function Intro() {
  return (
    <div className="flex w-[78vw] shrink-0 flex-col justify-center pr-10 lg:w-[34vw]">
      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-300">Panchawati Residency</p>
      <h2 className="mt-4 text-[2.4rem] leading-[1.05] text-white lg:text-[3.6rem]">
        A day at <em className="text-gold-rich font-medium">Panchawati</em>
      </h2>
      <p className="mt-5 max-w-sm text-[15.5px] leading-[1.8] text-white/70">
        From sunrise to lantern light, a glimpse of everyday life inside the gates.
      </p>
    </div>
  );
}

function Scene({ s, i, className }) {
  return (
    <figure className={className}>
      <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:h-[62vh]">
        <img {...responsive(s.photo, '(min-width: 1024px) 60vw, 100vw')} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-4 top-4 bg-ivory px-3 py-1.5 font-serif text-lg font-semibold text-navy-950">{s.time}</span>
      </div>
      <figcaption className="mt-5 flex gap-4">
        <span className="font-serif text-sm text-primary-300">{String(i + 1).padStart(2, '0')}</span>
        <span>
          <span className="block font-serif text-2xl text-white">{s.title}</span>
          <span className="mt-1 block text-[15px] leading-relaxed text-white/65">{s.text}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Desktop: vertical scroll drives a horizontal film strip (pinned). Phones: a simple vertical story. */
export default function DayStory() {
  const wrap = useRef(null);
  const track = useRef(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section id="story" className="relative bg-navy-950">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.05]" />

      {/* Desktop pinned film strip */}
      <div ref={wrap} className="relative hidden lg:block" style={{ height: `calc(100vh + ${distance}px)` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <motion.div ref={track} style={{ x }} className="flex items-center gap-12 pl-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] pr-24">
            <Intro />
            {SCENES.map((s, i) => (
              <Scene key={s.time} s={s} i={i} className="w-[54vw] shrink-0 xl:w-[46vw]" />
            ))}
          </motion.div>
          {/* progress */}
          <div className="absolute bottom-10 left-1/2 h-px w-48 -translate-x-1/2 bg-white/20">
            <motion.div className="h-full origin-left bg-primary-300" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      </div>

      {/* Phones & tablets */}
      <div className="container relative py-20 lg:hidden">
        <Reveal>
          <Intro />
        </Reveal>
        <div className="mt-12 space-y-14">
          {SCENES.map((s, i) => (
            <Reveal key={s.time}>
              <Scene s={s} i={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
