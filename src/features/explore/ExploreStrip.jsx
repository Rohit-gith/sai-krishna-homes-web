import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import { CHAPTERS, chapterPath } from './chapters';
import ChapterVisual from './ChapterVisual';

const PAD = 'pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] lg:pr-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))]';

function Card({ c, i }) {
  return (
    <Link to={chapterPath(c.slug)} data-cursor="view" className="group block w-[15rem] shrink-0 sm:w-[17rem] lg:w-[19rem]">
      <div className="relative aspect-[3/4] overflow-hidden bg-navy-100">
        <ChapterVisual chapter={c} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute left-3 top-3 bg-ivory px-2.5 py-1 font-serif text-sm text-navy-950">{String(i + 1).padStart(2, '0')}</span>
      </div>
      <p className="mt-4 flex items-start justify-between gap-3">
        <span>
          <span className="block font-serif text-xl text-navy-950">{c.title}</span>
          <span className="mt-1 block text-[13.5px] leading-relaxed text-slate-600">{c.blurb}</span>
        </span>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-primary-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

/**
 * Home-page teaser for the Explore chapters. While the visitor scrolls down, the strip is pinned
 * and the cards glide from left to right; when the last card is in view the page continues down.
 * Visitors who prefer reduced motion get a normal swipeable row instead.
 */
export default function ExploreStrip({ numeral = 'V' }) {
  const reduce = useReducedMotion();
  const wrap = useRef(null);
  const track = useRef(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useLayoutEffect(() => {
    if (reduce) return undefined;
    const measure = () => track.current && setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [reduce]);

  return (
    <section className="relative bg-ivory pt-16 md:pt-24">
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label="Discover more"
          title="Explore at your own pace"
          intro="A 360° home tour, floor plans, every photo, an EMI planner and directions, each in its own chapter."
          className="mb-0 md:mb-0"
        />
      </div>

      {reduce ? (
        <div className={`no-scrollbar flex gap-4 overflow-x-auto py-10 ${PAD}`}>
          {CHAPTERS.map((c, i) => (
            <Card key={c.slug} c={c} i={i} />
          ))}
        </div>
      ) : (
        <div ref={wrap} className="relative" style={{ height: `calc(100svh + ${distance}px)` }}>
          {/* Pinned below the sticky header */}
          <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden md:top-[5.75rem] md:h-[calc(100svh-5.75rem)]">
            <motion.div ref={track} style={{ x }} className={`flex w-max gap-4 lg:gap-6 ${PAD}`}>
              {CHAPTERS.map((c, i) => (
                <Card key={c.slug} c={c} i={i} />
              ))}
            </motion.div>
            {/* progress */}
            <div className="container mt-8">
              <div className="h-px w-full bg-navy-900/10">
                <motion.div className="h-px origin-left bg-primary-500" style={{ scaleX: scrollYProgress }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
