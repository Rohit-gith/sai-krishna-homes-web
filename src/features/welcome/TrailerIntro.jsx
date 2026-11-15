import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import logoImg from '@/assets/logo/logo.png';
import { Namaste, PetalShower } from './Blessings';
import { PHOTOS } from '@/data/projects';
import { COMPANY } from '@/data/companyInfo';

const KEY = 'skh_trailer_seen';
// Each beat gets the time its content needs: the logo and city lines are read slowly, the "dream home" line is short, the last scene waits for a click.
const BEATS = [5000, 4000, 2300, 3200, 6000]; // logo · city · home (day) · promise (day→night) · golden key + buttons
const ease = [0.22, 1, 0.36, 1];

/** Gold "SINCE 2010" seal: pops in, then a light sweeps across it. */
function SinceBadge({ delay = 0, className = '' }) {
  return (
    <motion.span
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary-500 via-primary-300 to-primary-500 px-5 py-2 text-[12px] font-extrabold uppercase tracking-[0.35em] text-navy-950 shadow-[0_0_34px_-4px_rgba(232,192,106,0.85)] sm:text-[14px] ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16, delay }}
    >
      <span className="h-1.5 w-1.5 rotate-45 bg-navy-950" />
      Since {COMPANY.established}
      <span className="h-1.5 w-1.5 rotate-45 bg-navy-950" />
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
        initial={{ left: '-40%' }}
        animate={{ left: '130%' }}
        transition={{ duration: 1.1, delay: delay + 0.5, ease: 'easeInOut' }}
      />
    </motion.span>
  );
}

/** True when this browser has not seen the trailer yet (and motion is allowed). */
export function firstVisit() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return localStorage.getItem(KEY) !== '1';
  } catch {
    return false;
  }
}

/**
 * Short (~17 s) "trailer" for a visitor's very first visit: logo → the city from above → the home by day,
 * turning to night as its lights come on → a golden key turns: "Welcome home" → the curtain opens.
 * Extras: the logo is first drawn in gold lines; the home appears as an architect's blueprint before
 * a gold scan line reveals the real building; the last scene offers "Find my home" / "Book a site visit". Shown once per browser (localStorage), with Skip.
 * `always` replays it every time (e.g. for a demo).
 */
export default function TrailerIntro({ always = false, playKey = 0 }) {
  const [show, setShow] = useState(() => always || firstVisit());
  const [beat, setBeat] = useState(0);
  const [ready, setReady] = useState(false);

  // Load the trailer's images first (the logo beat waits for them, at most 1.5 s), so no scene shows blank.
  useEffect(() => {
    if (!show) return undefined;
    let done = 0;
    const srcs = ['/images/nearby/bbsr-map.webp', '/images/intro/pw-blueprint.webp', PHOTOS.pwDay.src, PHOTOS.pwNight.src];
    const finish = () => setReady(true);
    const t = setTimeout(finish, 1500);
    srcs.forEach((src) => {
      const im = new Image();
      im.onload = im.onerror = () => {
        done += 1;
        if (done === srcs.length) finish();
      };
      im.src = src;
    });
    return () => clearTimeout(t);
  }, [show, playKey]);

  // replay on demand (playKey changes)
  useEffect(() => {
    if (!playKey) return;
    setBeat(0);
    setReady(false);
    setShow(true);
  }, [playKey]);

  useEffect(() => {
    if (!show) return undefined;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable: the trailer may play again next time */
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  useEffect(() => {
    if (!show || (beat === 0 && !ready)) return undefined;
    if (beat >= BEATS.length) {
      setShow(false);
      return undefined;
    }
    const t = setTimeout(() => setBeat((b) => b + 1), BEATS[beat]);
    return () => clearTimeout(t);
  }, [show, beat, ready]);

  const total = BEATS.reduce((a, b) => a + b, 0) / 1000;

  return (
    <AnimatePresence>
      {show && (
        <motion.div key={`trailer-${playKey}`} className="fixed inset-0 z-[100] overflow-hidden bg-[#04100c] text-white" role="presentation" exit={{ opacity: 1 }}>
          {/* curtain halves (open at the end) */}
          <motion.div className="absolute inset-y-0 left-0 w-1/2 bg-[#04100c]" exit={{ x: '-100%' }} transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div className="absolute inset-y-0 right-0 w-1/2 bg-[#04100c]" exit={{ x: '100%' }} transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }} />

          <motion.div className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            {/* beat 1 · the city from above, slowly diving in */}
            <AnimatePresence>
              {beat === 1 && (
                <motion.div key="city" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
                  <motion.img
                    src="/images/nearby/bbsr-map.webp"
                    alt=""
                    className="absolute left-1/2 top-1/2 h-[200%] w-auto max-w-none"
                    initial={{ x: '-50%', y: '-38%', scale: 0.7, rotate: -4 }}
                    animate={{ x: '-50%', y: '-30%', scale: 1.6, rotate: 0 }}
                    transition={{ duration: 3.9, ease: [0.45, 0, 0.55, 1] }}
                  />
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,#04100c_75%)]" />
                  {/* say what we mean, not just the city's name */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 text-center [text-shadow:0_4px_24px_rgba(0,0,0,0.85)]">
                    <motion.p
                      className="font-serif text-[1.15rem] tracking-[0.28em] text-primary-300 sm:text-[1.6rem]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay: 0.2, ease }}
                    >
                      SAI KRISHNA HOMES
                    </motion.p>
                    <motion.p
                      className="mt-2 text-[11px] font-bold uppercase tracking-[0.4em] text-white/80 sm:text-[13px]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay: 0.45, ease }}
                    >
                      Building trusted homes in
                    </motion.p>
                    <motion.p
                      className="mt-3 font-serif text-[1.9rem] leading-[1.25] tracking-[0.2em] text-primary-100 sm:text-[3.8rem]"
                      initial={{ opacity: 0, letterSpacing: '0.5em' }}
                      animate={{ opacity: 1, letterSpacing: '0.2em' }}
                      transition={{ duration: 1.6, delay: 0.5, ease }}
                    >
                      BHUBANESWAR
                    </motion.p>
                    <motion.span
                      className="mx-auto mt-5 block h-px w-40 origin-center bg-primary-400 sm:mt-6 sm:w-64"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.1, delay: 1.1, ease }}
                    />
                    <motion.p
                      className="mt-4 text-[13px] font-medium tracking-[0.12em] text-white/90 sm:text-[16px]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay: 1.5, ease }}
                    >
                      Patia &amp; South Bhubaneswar
                    </motion.p>
                    <SinceBadge delay={2.1} className="mt-4" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* beat 2-3 · the home */}
            <AnimatePresence>
              {beat >= 2 && (
                <motion.div key="home" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                  {/* the architect's drawing first ... */}
                  <motion.img
                    src="/images/intro/pw-blueprint.webp"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={{ scale: 1.25 }}
                    animate={{ scale: 1.02 }}
                    transition={{ duration: 6.5, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                  {/* ... then the real building is revealed behind a gold scan line */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: 1.5, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
                  >
                    <motion.img
                      src={PHOTOS.pwDay.src}
                      alt=""
                      className="h-full w-full object-cover"
                      initial={{ scale: 1.25 }}
                      animate={{ scale: 1.02 }}
                      transition={{ duration: 6.5, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </motion.div>
                  <motion.span
                    className="absolute inset-y-0 w-[3px] bg-primary-300 shadow-[0_0_24px_6px_rgba(232,192,106,0.7)]"
                    initial={{ left: '0%', opacity: 0 }}
                    animate={{ left: ['0%', '0%', '100%'], opacity: [0, 1, 0] }}
                    transition={{ duration: 2.2, times: [0, 0.33, 1], ease: [0.65, 0, 0.35, 1] }}
                  />
                  {/* day → night: the same building at dusk, lights coming on */}
                  <motion.img
                    src={PHOTOS.pwNight.src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={beat >= 3 ? { opacity: 1, scale: 1.02 } : { opacity: 0, scale: 1.08 }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                  />
                  <motion.span
                    className="pointer-events-none absolute inset-0 mix-blend-screen [background:radial-gradient(ellipse_at_50%_58%,rgba(255,196,110,0.35),transparent_55%)]"
                    initial={{ opacity: 0 }}
                    animate={beat >= 3 ? { opacity: [0, 1, 0.7, 1] } : { opacity: 0 }}
                    transition={{ duration: 2.4, delay: 0.8, times: [0, 0.4, 0.7, 1] }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#04100c] via-[#04100c]/60 to-[#04100c]/45" />
                  {/* the key scene dims the home */}
                  <motion.span className="absolute inset-0 bg-[#04100c]" initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 0.82 : 0 }} transition={{ duration: 1 }} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <AnimatePresence mode="wait">
                {beat === 0 && (
                  <motion.div key="logo" className="flex flex-col items-center" exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }} transition={{ duration: 0.9 }}>
                    <span className="relative block h-40 w-48 sm:h-52 sm:w-60">
                      <svg viewBox="0 0 96 80" className="absolute inset-0 h-full w-full" aria-hidden="true">
                        {[
                          'M10 76 V40 L20 32 L30 40 V76',
                          'M34 76 V18 L46 6 L58 18 V76',
                          'M62 76 V34 L73 26 L84 34 V76',
                          'M4 76 H92',
                        ].map((d, i) => (
                          <motion.path
                            key={d}
                            d={d}
                            fill="none"
                            stroke="#E8C06A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 1 }}
                            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                            transition={{ pathLength: { duration: 1.4, delay: 0.2 + i * 0.18, ease: [0.45, 0, 0.2, 1] }, opacity: { duration: 2.4, times: [0, 0.8, 1] } }}
                          />
                        ))}
                      </svg>
                      <motion.img
                        src={logoImg}
                        alt=""
                        className="absolute inset-0 m-auto h-32 w-auto drop-shadow-[0_0_30px_rgba(232,192,106,0.35)] sm:h-44"
                        initial={{ opacity: 0, scale: 1.12, filter: 'blur(14px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1.4, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                      {/* slow light sweep across the logo */}
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-hidden"
                        style={{ maskImage: `url(${logoImg})`, WebkitMaskImage: `url(${logoImg})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }}
                      >
                        <motion.span
                          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                          initial={{ left: '-40%' }}
                          animate={{ left: '120%' }}
                          transition={{ duration: 1.1, delay: 2.0, ease: 'easeInOut' }}
                        />
                      </motion.span>
                    </span>
                    <motion.p
                      className="mt-5 font-serif text-[1.7rem] tracking-[0.22em] text-primary-200 sm:text-[2.3rem]"
                      initial={{ opacity: 0, letterSpacing: '0.5em' }}
                      animate={{ opacity: 1, letterSpacing: '0.22em' }}
                      transition={{ duration: 1.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      SAI KRISHNA
                    </motion.p>
                    <motion.span className="mt-3 h-px w-56 origin-center bg-primary-400 sm:w-72" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 1.8, ease: [0.16, 1, 0.3, 1] }} />
                    <motion.p
                      className="mt-3 text-[11px] font-bold uppercase tracking-[0.6em] text-primary-300"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.9, delay: 2.2 }}
                    >
                      Homes
                    </motion.p>
                    {/* the brand promise */}
                    <motion.p
                      className="mt-5 font-serif text-[1.5rem] italic text-white sm:text-[2rem]"
                      initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 1.3, delay: 2.7, ease }}
                    >
                      Where <span className="text-primary-300">legacy</span> matters
                    </motion.p>
                    <SinceBadge delay={3.5} className="mt-4" />

                  </motion.div>
                )}
                {beat === 2 && (
                  <motion.div key="home-txt" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 1.1, delay: 0.3, ease }}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.5em] text-primary-200 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">Sai Krishna Homes</p>
                    <p className="mt-4 font-serif text-[2.6rem] leading-[1.05] [text-shadow:0_4px_24px_rgba(0,0,0,0.75)] sm:text-[4.6rem]">
                      Your <em className="text-primary-300">dream home</em>
                    </p>
                  </motion.div>
                )}
                {beat === 3 && (
                  <motion.div key="promise" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease }}>
                    <p className="font-serif text-[2.2rem] leading-[1.1] [text-shadow:0_4px_24px_rgba(0,0,0,0.75)] sm:text-[3.8rem]">Everything you need,</p>
                    <p className="font-serif text-[2.2rem] italic leading-[1.1] text-primary-300 [text-shadow:0_4px_24px_rgba(0,0,0,0.75)] sm:text-[3.8rem]">minutes away.</p>
                    <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                      {['Railway · 4 min', 'KIIT · 9 min', 'Hospital · 17 min', 'Mall · 21 min'].map((c, i) => (
                        <motion.span
                          key={c}
                          className="rounded-full border border-primary-300/50 bg-black/40 px-4 py-2 text-[12px] font-bold tracking-wide text-primary-100 backdrop-blur-md sm:text-[13px]"
                          initial={{ opacity: 0, y: 16, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.7, delay: 0.7 + i * 0.22, ease }}
                        >
                          {c}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
                {beat === 4 && (
                  <motion.div key="key" className="flex flex-col items-center" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    <div className="relative h-44 w-64 sm:h-56 sm:w-80">
                      {/* burst of light as the key turns */}
                      <motion.span
                        className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(232,192,106,0.6),transparent)]"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: [0, 0, 1, 0.5], scale: [0.4, 0.4, 1.6, 1.3] }}
                        transition={{ duration: 1.5, times: [0, 0.45, 0.7, 1] }}
                      />
                      <motion.svg
                        viewBox="10 50 190 100"
                        className="relative h-full w-full drop-shadow-[0_10px_30px_rgba(232,192,106,0.45)]"
                        initial={{ opacity: 0, x: -90, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: [0.8, 1, 1, 1, 1], scaleY: [1, 1, 0.12, 1, 1] }}
                        transition={{ duration: 1.5, times: [0, 0.4, 0.6, 0.8, 1], ease }}
                      >
                        <defs>
                          <linearGradient id="tk-gold" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FFE7AE" />
                            <stop offset="45%" stopColor="#E3B964" />
                            <stop offset="100%" stopColor="#9A7230" />
                          </linearGradient>
                        </defs>
                        {/* bow: ornate ring with the home roofline inside */}
                        <circle cx="62" cy="100" r="38" fill="none" stroke="url(#tk-gold)" strokeWidth="11" />
                        <circle cx="62" cy="100" r="24" fill="none" stroke="url(#tk-gold)" strokeWidth="2" opacity="0.7" />
                        <path d="M46 108 L62 92 L78 108 M51 103 V114 H73 V103" fill="none" stroke="url(#tk-gold)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                        {/* shaft + collar */}
                        <rect x="98" y="93" width="84" height="14" rx="5" fill="url(#tk-gold)" />
                        <rect x="100" y="87" width="8" height="26" rx="3" fill="url(#tk-gold)" />
                        {/* teeth */}
                        <path d="M150 107 h9 v16 h-9 z M166 107 h9 v11 h-9 z" fill="url(#tk-gold)" />
                      </motion.svg>
                    </div>
                    <PetalShower count={30} />
                    <span className="mt-2 block">
                      <Namaste className="h-10 w-10 sm:h-12 sm:w-12" delay={0.8} />
                    </span>
                    <motion.p
                      className="mt-2 font-serif text-[2.4rem] italic text-primary-200 [text-shadow:0_4px_24px_rgba(0,0,0,0.75)] sm:text-[3.4rem]"
                      initial={{ opacity: 0, y: 18, letterSpacing: '0.2em' }}
                      animate={{ opacity: 1, y: 0, letterSpacing: '0.02em' }}
                      transition={{ duration: 1, delay: 1, ease }}
                    >
                      Welcome home
                    </motion.p>
                    <motion.div
                      className="mt-7 flex flex-col gap-3 sm:flex-row"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.6, ease }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShow(false);
                          setTimeout(() => document.getElementById('home-finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 950);
                        }}
                        className="rounded-full bg-primary-400 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 shadow-[0_12px_30px_-10px_rgba(232,192,106,0.8)] hover:bg-primary-300"
                      >
                        Find my home
                      </button>
                      <a
                        href="#book-visit"
                        onClick={() => setShow(false)}
                        className="rounded-full border border-white/40 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur hover:border-primary-300"
                      >
                        Book a site visit
                      </a>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* progress + skip */}
            <motion.span className="absolute bottom-0 left-0 h-[3px] bg-primary-400" initial={{ width: '0%' }} animate={{ width: ready ? '100%' : '6%' }} transition={{ duration: ready ? total : 1.5, ease: 'linear' }} />
            <button
              type="button"
              onClick={() => setShow(false)}
              className="absolute bottom-6 right-6 rounded-full border border-white/25 bg-black/30 px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.3em] text-white/80 backdrop-blur hover:border-primary-300 hover:text-white"
            >
              Skip
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
