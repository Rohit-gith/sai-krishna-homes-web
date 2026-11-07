import { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarCheck, Phone, Star } from 'lucide-react';
import { COMPANY } from '@/data/companyInfo';
import { PHOTOS, responsive } from '@/data/projects';
import { cn } from '@/utils/cn';
import logoImg from '@/assets/logo/logo.png';
import Magnetic from '@/components/common/Magnetic';
import { useThemeStore } from '@/store/useThemeStore';
import { useCrmStore } from '@/features/admin/store/useCrmStore';

const ease = [0.22, 1, 0.36, 1];
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease },
});

const DAY_SLIDES = [
  { ...PHOTOS.pwGate, title: 'Panchawati Residency', caption: 'Now booking', pos: '62% center' },
  {
    ...PHOTOS.pwDay,
    title: 'Panchawati at sunrise',
    caption: 'Across the lotus pond',
    pos: '60% center',
  },
  {
    ...PHOTOS.pwPool,
    title: 'Swimming pool',
    caption: 'Resort-style amenities',
    pos: '55% center',
  },
  {
    ...PHOTOS.pwNight,
    title: 'Panchawati by night',
    caption: 'Lantern-lit evenings',
    pos: '60% center',
  },
];
// Night view: lead with the lantern-lit renders.
const NIGHT_SLIDES = [
  { ...PHOTOS.pwNight, title: 'Panchawati by night', caption: 'Lantern-lit evenings', pos: '60% center' },
  { ...PHOTOS.pwGate, title: 'Panchawati Residency', caption: 'The entrance, after dusk', pos: '62% center' },
  { ...PHOTOS.pwPool, title: 'Swimming pool', caption: 'Evening by the water wall', pos: '55% center' },
  { ...PHOTOS.pwRooftop, title: 'Rooftop lounge', caption: 'Under the evening sky', pos: '55% center' },
];
const SLIDE_MS = 7000;

const CONFIGS = ['Studio', '1 BHK', '2 BHK', '3 BHK'];

const STATS = [
  { value: '500+', label: 'Homes' },
  { value: '6', unit: 'acres', label: 'Township' },
  { value: '25+', label: 'Amenities' },
];

const AMENITIES = [
  'Swimming Pool',
  'Sports Arena',
  'Gymnasium',
  'Yoga Deck',
  'Rooftop Lounge',
  'Indoor Cricket',
  'Badminton Courts',
  'Spa',
  'Party Lawn',
  'Indoor Games',
  'Community Centre',
  'Café',
];

/** Headline that rises in word by word from behind a mask. */
function RevealWords({ text, delay = 0, className, wordClassName }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-[0.14em] align-bottom"
        >
          <motion.span
            className={cn('inline-block', wordClassName)}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: delay + i * 0.08, ease }}
          >
            {word}
            {' '}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Circular "SAI KRISHNA HOMES ✦ SINCE 2010" seal that slowly rotates around the logo mark. */
function Seal() {
  const id = useId().replace(/:/g, '');
  return (
    <div className="relative h-24 w-24 rounded-full bg-white shadow-[0_18px_40px_-14px_rgba(8,38,32,0.45)] ring-1 ring-primary-200 sm:h-28 sm:w-28">
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full animate-spin-slow"
        aria-hidden
      >
        <defs>
          <path id={`seal${id}`} d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" />
        </defs>
        <text className="fill-navy-900 text-[10px] font-bold uppercase tracking-[0.28em]">
          <textPath href={`#seal${id}`}>Sai Krishna Homes ✦ Since {COMPANY.established} ✦</textPath>
        </text>
      </svg>
      <span className="absolute inset-[30%] flex items-start justify-center overflow-hidden">
        <img src={logoImg} alt="" className="h-auto w-full" />
      </span>
    </div>
  );
}

/** Hotel-style booking bar: pick a configuration, leave name + mobile, confirm on WhatsApp. */
function VisitBar() {
  const [config, setConfig] = useState('2 BHK');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (!/^[6-9]\d{9}$/.test(phone))
      return setError('Please enter a valid 10-digit mobile number.');
    setError('');
    useCrmStore.getState().captureEnquiry({ form: 'Site visit (home page)', name: name.trim(), phone, interest: config, message: 'Wants to book a site visit' });
    const msg = `Hello ${COMPANY.shortName}, I'd like to book a site visit.\n\nName: ${name.trim()}\nMobile: ${phone}\nLooking for: ${config}`;
    window.open(
      `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener',
    );
    return undefined;
  };

  const field =
    'w-full bg-transparent text-[15px] font-medium text-navy-950 placeholder:font-normal placeholder:text-slate-400 focus:outline-none';
  const label = 'text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700';

  return (
    <form
      id="book-visit"
      onSubmit={submit}
      noValidate
      className="relative scroll-mt-28 rounded-[1.75rem] border border-white bg-white p-3 shadow-[0_30px_80px_-25px_rgba(8,38,32,0.45)]"
    >
      <div className="grid gap-2 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-stretch">
        <fieldset className="rounded-2xl bg-ivory px-5 py-3">
          <legend className="sr-only">Configuration</legend>
          <span className={label}>I&apos;m looking for</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CONFIGS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConfig(c)}
                aria-pressed={config === c}
                className={cn(
                  'relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  config === c ? 'text-white' : 'text-navy-800 hover:bg-navy-50',
                )}
              >
                {config === c && (
                  <motion.span
                    layoutId="hero-config"
                    className="absolute inset-0 rounded-full bg-navy-900"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col justify-center rounded-2xl px-5 py-3 transition-colors focus-within:bg-ivory hover:bg-ivory/60">
          <span className={label}>Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className={cn(field, 'mt-1.5')}
          />
        </label>

        <label className="flex flex-col justify-center rounded-2xl px-5 py-3 transition-colors focus-within:bg-ivory hover:bg-ivory/60 lg:border-l lg:border-slate-100">
          <span className={label}>Mobile number</span>
          <span className="mt-1.5 flex items-center gap-2">
            <span className="text-[15px] font-medium text-slate-500">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              inputMode="numeric"
              autoComplete="tel-national"
              className={field}
            />
          </span>
        </label>

        <button
          type="submit"
          className="group flex items-center justify-center gap-2.5 rounded-2xl bg-navy-900 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-navy-800"
        >
          <CalendarCheck className="h-5 w-5 text-primary-300" />
          Book a site visit
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      {error && (
        <p role="alert" className="px-5 pb-1 pt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export default function HeroSection() {
  const night = useThemeStore((s) => s.night);
  const SLIDES = night ? NIGHT_SLIDES : DAY_SLIDES;
  const [active, setActive] = useState(0);

  // Restart the slideshow from the first photo when the view switches.
  useEffect(() => setActive(0), [night]);

  useEffect(() => {
    const t = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active, SLIDES.length]);

  return (
    <section className="relative isolate overflow-x-clip bg-ivory pb-16 md:pb-20">
      {/* Full-bleed photo slideshow: no dark overlay, the building stays bright */}
      <div className="relative mt-16 h-[58svh] overflow-hidden md:mt-[5.75rem] lg:absolute lg:inset-x-0 lg:top-0 lg:mt-0 lg:h-[calc(100%-9rem)]">
        <AnimatePresence initial={false}>
          <motion.img
            key={SLIDES[active].src}
            {...responsive(SLIDES[active])}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeInOut' },
              scale: { duration: 9, ease: 'easeOut' },
            }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: SLIDES[active].pos }}
            {...(active === 0 && { fetchpriority: 'high' })}
          />
        </AnimatePresence>
        {/* Only a soft fade into the ivory page at the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ivory to-transparent lg:h-40" />
      </div>

      <div className="container relative">
        <div className="flex flex-col lg:min-h-[100svh] lg:justify-between lg:pb-8 lg:pt-40">
          <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,40rem)_1fr]">
            {/* Frosted ivory glass card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease }}
              className="bg-ivory/92 relative -mt-28 rounded-[2rem] border border-white/70 p-7 shadow-[0_40px_90px_-35px_rgba(8,38,32,0.5)] backdrop-blur-xl sm:p-10 lg:mt-0"
            >
              <div className="absolute -right-2 -top-10 sm:-right-10 sm:-top-12">
                <Seal />
              </div>

              <motion.p
                {...rise(0.3)}
                className="flex items-center gap-3 pr-24 text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700 sm:pr-0"
              >
                <span className="h-px w-8 bg-primary-400" />
                Bhubaneswar · Since {COMPANY.established}
              </motion.p>

              <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.05] text-navy-950 sm:text-[3.2rem] xl:text-[3.5rem]">
                <RevealWords text="Homes crafted for a" delay={0.35} />
                <RevealWords
                  text="life well lived."
                  delay={0.7}
                  wordClassName="text-gold-rich font-medium italic"
                />
              </h1>

              <motion.p
                {...rise(0.8)}
                className="mt-5 text-[1.05rem] leading-[1.75] text-slate-600"
              >
                Studio to 3 BHK residences in a 6-acre gated township, with a private sports arena,
                an in-house shopping hub and every approval in place.
              </motion.p>

              <motion.div {...rise(0.9)} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Magnetic>
                  <a
                    href="#book-visit"
                    className="group inline-flex items-center justify-center gap-2 bg-navy-900 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-navy-900/25 transition-colors hover:bg-navy-800"
                  >
                    Book a private visit
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Magnetic>
                <a
                  href={`tel:${COMPANY.phone}`}
                  className="inline-flex items-center justify-center gap-2.5 border border-navy-200 bg-white px-6 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-navy-900 transition-colors hover:border-primary-400"
                >
                  <Phone className="h-4 w-4 text-primary-600" /> {COMPANY.phoneDisplay}
                </a>
              </motion.div>

              <motion.div
                {...rise(1)}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-primary-200/70 pt-6"
              >
                <dl className="flex divide-x divide-primary-200">
                  {STATS.map((s) => (
                    <div key={s.label} className="px-4 first:pl-0">
                      <dt className="sr-only">{s.label}</dt>
                      <dd>
                        <span className="font-serif text-2xl font-semibold text-navy-950">
                          {s.value}
                          {s.unit && (
                            <span className="ml-1 text-xs font-medium text-primary-600">
                              {s.unit}
                            </span>
                          )}
                        </span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {s.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-navy-900">
                  <BadgeCheck className="h-5 w-5 text-primary-600" /> RERA approved
                </span>
              </motion.div>
            </motion.div>

            {/* Slide switcher + rating (desktop, bottom-right over the photo) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1, ease }}
              className="hidden flex-col items-end gap-3 lg:flex"
            >
              <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
                <span className="font-serif text-2xl font-semibold text-navy-950">4.8</span>
                <span>
                  <span className="flex text-primary-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </span>
                  <span className="text-[11px] text-slate-500">1,000+ resident reviews</span>
                </span>
              </div>
              <div
                className="flex gap-2 rounded-2xl bg-white/90 p-2 shadow-soft backdrop-blur"
                role="tablist"
                aria-label="Featured views"
              >
                {SLIDES.map((s, i) => (
                  <button
                    key={s.src}
                    type="button"
                    role="tab"
                    aria-selected={active === i}
                    onClick={() => setActive(i)}
                    aria-label={s.title}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-1.5 text-left transition-all',
                      active === i ? 'w-60 bg-ivory pr-3' : 'opacity-75 hover:opacity-100',
                    )}
                  >
                    <img
                      src={s.sm}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span className={cn('min-w-0 flex-1', active !== i && 'hidden')}>
                      <span className="block truncate text-[13px] font-bold text-navy-950">
                        {s.title}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">{s.caption}</span>
                      <span className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-navy-100">
                        {active === i && (
                          <motion.span
                            key={`bar-${active}`}
                            className="block h-full rounded-full bg-primary-500"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                          />
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Booking bar */}
          <motion.div {...rise(1.1)} className="mt-8 lg:mt-12">
            <VisitBar />
          </motion.div>
        </div>
      </div>

      {/* Amenities marquee */}
      <div
        className="mt-14 overflow-hidden border-y border-primary-200/70 bg-white/60 py-5 md:mt-16"
        aria-label="Amenities"
      >
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((dup) => (
            <ul key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {AMENITIES.map((a) => (
                <li key={a} className="flex items-center whitespace-nowrap">
                  <span className="px-7 font-serif text-xl italic text-navy-900 md:text-2xl">
                    {a}
                  </span>
                  <span className="text-primary-500">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
