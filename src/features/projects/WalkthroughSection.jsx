import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, Play } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { cn } from '@/utils/cn';

/**
 * Walkthrough videos. The client's videos are vertical (9:16 reels), so they play inside a
 * phone-style frame with the playlist beside it. Files only download when Play is pressed.
 */
export default function WalkthroughSection({ project, numeral }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const video = useRef(null);
  const items = project.walkthroughs;
  const w = items[active];

  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [active]);

  const play = () => {
    setPlaying(true);
    requestAnimationFrame(() => video.current?.play().catch(() => {}));
  };

  return (
    <section id="walkthrough" className="section relative scroll-mt-24 overflow-hidden bg-navy-950">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-1/3 h-[34rem] w-[34rem] rounded-full bg-primary-500/10 blur-[120px]" />
      <div className="container relative">
        <ChapterHeading light numeral={numeral} label="Immersive experience" title="Take a digital walkthrough" intro={`Walk through ${project.name} before you visit. Take a digital walkthrough of our premium residences.`} />

        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-16">
          {/* Left: now playing */}
          <Reveal className="order-2 lg:order-1">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">
              <Film className="h-4 w-4" /> Now showing · {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </p>
            <AnimatePresence mode="wait">
              <motion.div key={w.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                <p className="mt-4 font-serif text-4xl text-white md:text-5xl">{w.title}</p>
                <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">{failed ? 'This video will be available shortly.' : w.caption}</p>
                {w.duration && <p className="mt-6 font-serif text-2xl text-primary-200">{w.duration}</p>}
              </motion.div>
            </AnimatePresence>
          </Reveal>

          {/* Centre: phone frame player */}
          <Reveal className="order-1 mx-auto w-full max-w-[19rem] lg:order-2 lg:w-[19rem] xl:w-[21rem] xl:max-w-[21rem]">
            <div className="relative rounded-[2.6rem] border border-primary-300/40 bg-navy-900 p-3 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.8)]">
              <span aria-hidden className="absolute left-1/2 top-[1.15rem] z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/60" />
              <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-black">
                {playing && !failed ? (
                  <video
                    ref={video}
                    key={w.src}
                    src={w.src}
                    controls
                    playsInline
                    preload="none"
                    poster={w.poster.src}
                    onError={() => setFailed(true)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <button type="button" onClick={play} disabled={failed} className="group absolute inset-0 block" aria-label={`Play ${w.title}`}>
                    <AnimatePresence initial={false}>
                      <motion.img key={w.poster.src} src={w.poster.src} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 h-full w-full object-cover" />
                    </AnimatePresence>
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ivory text-navy-950 shadow-2xl transition-transform group-hover:scale-105">
                        {!failed && <span className="absolute inset-0 animate-ping rounded-full bg-ivory/30" />}
                        <Play className="relative ml-1 h-8 w-8 fill-current" />
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* Right: playlist */}
          <Reveal delay={0.1} className="order-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">Playlist</p>
            <ol className="mt-4 space-y-3">
              {items.map((it, i) => (
                <li key={it.src}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={active === i}
                    className={cn('group flex w-full items-center gap-4 border p-2.5 text-left transition-colors', active === i ? 'border-primary-400 bg-white/[0.06]' : 'border-white/10 hover:border-white/30')}
                  >
                    <span className="relative block aspect-[9/16] w-14 shrink-0 overflow-hidden bg-black">
                      <img src={it.poster.sm} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30"><Play className="h-4 w-4 fill-current text-white" /></span>
                    </span>
                    <span>
                      <span className="block font-serif text-sm text-primary-300">{String(i + 1).padStart(2, '0')}</span>
                      <span className="block font-serif text-xl text-white">{it.title}</span>
                      {it.duration && <span className="text-[12px] text-white/50">{it.duration}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
