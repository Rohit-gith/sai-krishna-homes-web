import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarCheck, Leaf, MapPin, Star, Wallet } from 'lucide-react';
import { LANDMARKS, PRICE_CHECK, STARTING_FROM } from '@/data/comparison';
import { PROJECT_PAGES } from '@/data/projectPages';
import { COMPANY } from '@/data/companyInfo';
import { PHOTOS, responsive } from '@/data/projects';
import { cn } from '@/utils/cn';
import logoImg from '@/assets/logo/logo.png';
import Magnetic from '@/components/common/Magnetic';
import { useThemeStore } from '@/store/useThemeStore';
import { useSchedulerStore } from '@/store/useSchedulerStore';

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

const CONFIGS = ['1 BHK', '2 BHK', '3 BHK'];

// The three selling points. Every figure comes from data already verified elsewhere on the site:
// price list + Square Yards (PRICE_CHECK), Google Maps road distances (LANDMARKS), RERA / brochure.
const pw = LANDMARKS['panchawati-residency'];
const mins = (name) => pw.find((p) => p.name.startsWith(name))?.mins;
const belowPct = Math.round(((PRICE_CHECK.market.rate - PRICE_CHECK.ours.avg) / PRICE_CHECK.market.rate) * 100);
const priceL = `₹${(STARTING_FROM / 1e5).toFixed(2).replace(/.?0+$/, '')} L`;
/** Google "G" mark, used only to attribute the Google rating. */
function GoogleG({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

/** Highlighter-pen swipe behind a few words (transform only). */
function Marker({ children }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1 font-semibold text-navy-950">
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 top-[30%] origin-left rounded-[3px] bg-amber-300/80 will-change-transform"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

// Hero selling points as stat tiles: a big number up top, the proof under it.
// Phones get a compact 3-in-a-row version (mUnit / mDetail) so the CTA stays near the top.
const SELLING = [
  {
    icon: Wallet,
    kicker: 'Affordable',
    tone: 'gold',
    stat: priceL,
    unit: 'onwards',
    detail: <Marker>{belowPct}% below {PRICE_CHECK.market.area} avg</Marker>,
    mDetail: (<><Marker>{belowPct}% below</Marker> <span className="whitespace-nowrap">{PRICE_CHECK.market.area} avg</span></>),
  },
  {
    icon: MapPin,
    kicker: 'Close by',
    tone: 'navy',
    stat: `${mins('Patia')} min`,
    unit: 'to Patia station',
    mUnit: 'Patia station',
    detail: `KIIT Sq ${mins('KIIT')} · Esplanade ${mins('Esplanade')} min, from Panchawati`,
  },
  {
    icon: Leaf,
    kicker: 'Green living',
    mKicker: 'Green',
    tone: 'green',
    stat: '74',
    unit: 'new trees',
    detail: 'Solar · Rainwater · STP · EV charging',
    mDetail: 'Solar, STP, EV',
  },
];
const TONE = {
  gold: { tile: 'bg-gradient-to-br from-primary-100 via-white/90 to-white/70 ring-primary-300/80', chip: 'bg-primary-500 text-white', kicker: 'text-primary-700', stat: 'text-primary-700' },
  navy: { tile: 'bg-white/75 ring-white', chip: 'bg-navy-900 text-primary-200', kicker: 'text-navy-700', stat: 'text-navy-950' },
  green: { tile: 'bg-gradient-to-br from-emerald-50 via-white/90 to-white/70 ring-emerald-200', chip: 'bg-emerald-600 text-white', kicker: 'text-emerald-700', stat: 'text-emerald-800' },
};

const RERA = PROJECT_PAGES.map((p) => ({ name: p.name, rera: p.rera, url: p.reraUrl }));

// Panchawati Residency's own Google Maps listing (website saikrishnahomes.co.in). Checked 13 Nov 2026.
// Update rating/count when they change; never show a number that is not on the listing.
const GOOGLE = { rating: 4.8, reviews: 4, url: 'https://www.google.com/maps?cid=10468983929573672464', name: 'Panchawati Residency' };

// Amenities actually listed in the two projects' brochures.
const AMENITIES = [
  'Swimming Pool',
  'Sports Arena',
  'Modern Gym',
  'Yoga Room',
  'A/C Society Hall',
  'Jogging Track',
  'Basketball Court',
  'Badminton Court',
  "Kids' Play Area",
  'Rooftop Solar',
  'Rainwater Harvesting',
  'EV Charging',
  'Temple & Market Complex',
  '24/7 Security',
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

/** Hotel-style booking bar: pick a configuration, leave name + mobile, then choose a date & time. */
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
    // Continue in the scheduler (date & time), with what was typed here already filled in.
    useSchedulerStore.getState().openScheduler({ name: name.trim(), phone, config });
    return undefined;
  };

  const field =
    'w-full bg-transparent text-[15px] font-medium text-navy-950 placeholder:font-normal placeholder:text-slate-400 focus:outline-none';
  const label = 'text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700';

  return (
    <form
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
          Choose date &amp; time
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
  // The slideshow only runs while the hero is on screen (saves the CPU while the visitor scrolls).
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { margin: '0px' });

  // Restart the slideshow from the first photo when the view switches.
  useEffect(() => setActive(0), [night]);

  useEffect(() => {
    if (!heroInView) return undefined;
    const t = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active, SLIDES.length, heroInView]);

  return (
    <section ref={heroRef} className="relative isolate overflow-x-clip bg-ivory pb-16 md:pb-20">
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
              className="relative -mt-28 min-w-0 rounded-[2rem] border border-white/70 bg-ivory/55 p-5 shadow-[0_40px_90px_-35px_rgba(8,38,32,0.5)] backdrop-blur-2xl backdrop-brightness-110 backdrop-saturate-50 sm:p-10 lg:mt-0"
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
                className="mt-4 text-[1.05rem] leading-[1.65] text-slate-600"
              >
                One of the most affordable addresses in Patia &amp; South Bhubaneswar: <span className="whitespace-nowrap">1, 2 &amp; 3 BHK</span> homes with every
                approval in place.{' '}
                <a
                  href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent('Hi Sai Krishna Homes, please share the latest price list for your 1, 2 & 3 BHK homes.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group font-semibold text-primary-700 underline decoration-primary-300 decoration-2 underline-offset-4 transition-colors hover:text-navy-900 hover:decoration-primary-500"
                >
                  {/* flows right after the sentence; only "WhatsApp →" is kept together */}
                  Get price list on{' '}
                  <span className="whitespace-nowrap">
                    WhatsApp
                    <ArrowRight className="ml-1 inline h-4 w-4 align-[-2px] transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              </motion.p>

              {/* the main action sits right under the promise, so it is on screen without scrolling */}
              <motion.div {...rise(0.85)} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Magnetic>
                  <a
                    href="#book-visit"
                    className="group inline-flex items-center justify-center gap-2 bg-navy-900 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-navy-900/25 transition-colors hover:bg-navy-800"
                  >
                    Book a private visit
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Magnetic>
              </motion.div>

              <motion.ul {...rise(0.9)} className="mt-6 grid grid-cols-3 gap-2 sm:gap-2.5">
                {SELLING.map(({ icon: Icon, kicker, mKicker, tone, stat, unit, mUnit, detail, mDetail }, i) => {
                  const t = TONE[tone];
                  return (
                    <motion.li
                      key={kicker}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        'group min-w-0 rounded-xl p-2 shadow-[0_10px_30px_-18px_rgba(8,38,32,0.45)] ring-1 transition-transform duration-300 hover:-translate-y-1 sm:rounded-2xl sm:p-4',
                        t.tile,
                      )}
                    >
                      <div className="mb-1.5 flex items-center gap-2 sm:mb-2.5">
                        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md shadow-sm sm:h-7 sm:w-7 sm:rounded-lg', t.chip)}>
                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </span>
                        <span className={cn('hidden text-[10.5px] font-bold uppercase tracking-[0.16em] sm:inline', t.kicker)}>{kicker}</span>
                      </div>
                      <span className={cn('block truncate text-[8.5px] font-bold uppercase tracking-[0.12em] sm:hidden', t.kicker)}>{mKicker || kicker}</span>
                      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-none sm:gap-y-1.5">
                        <span className={cn('whitespace-nowrap font-serif text-[17px] font-semibold tracking-tight min-[380px]:text-[19px] sm:text-[28px]', t.stat)}>{stat}</span>
                        <span className="text-[10.5px] font-medium leading-tight text-navy-900/75 sm:text-[12.5px]">
                          <span className="sm:hidden">{mUnit || unit}</span>
                          <span className="hidden sm:inline">{unit}</span>
                        </span>
                      </p>
                      <p className="mt-1 text-[10px] leading-snug text-navy-900/70 sm:hidden">{mDetail}</p>
                      <p className="mt-1.5 hidden text-[12px] leading-snug text-navy-900/70 sm:block">{detail}</p>
                    </motion.li>
                  );
                })}
              </motion.ul>

              <motion.div
                {...rise(1)}
                className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3"
              >
                <a
                  href={GOOGLE.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${GOOGLE.name} on Google Maps: read the reviews`}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-[0_10px_30px_-16px_rgba(8,38,32,0.45)] ring-1 ring-slate-200/80 transition-shadow active:shadow-sm lg:hidden"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                    <GoogleG className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-serif text-[1.35rem] font-semibold leading-none text-navy-950">{GOOGLE.rating}</span>
                      <span className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(GOOGLE.rating) ? 'fill-current' : '')} />
                        ))}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-[11.5px] text-slate-500">
                      {GOOGLE.reviews} Google reviews · {GOOGLE.name}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-navy-900 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">
                    Read ↗
                  </span>
                </a>
                <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-navy-900">
                  <BadgeCheck className="h-5 w-5 text-primary-600" /> RERA registered
                </span>
                <span className="flex flex-wrap gap-2">
                  {RERA.map((r) => (
                    <a
                      key={r.rera}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${r.name} · RERA ${r.rera}: open the official Odisha RERA record`}
                      aria-label={`${r.name}, RERA ${r.rera}. Open the official Odisha RERA record`}
                      className="group border border-primary-200 bg-white px-3 py-1.5 leading-tight transition-colors hover:border-primary-500"
                    >
                      <span className="block text-[12px] font-semibold text-navy-900">{r.name} ↗</span>
                      <span className="block text-[10.5px] font-medium tracking-wide text-slate-500 group-hover:text-primary-700">RERA {r.rera}</span>
                    </a>
                  ))}
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
              <a
                href={GOOGLE.url}
                target="_blank"
                rel="noreferrer"
                title={`${GOOGLE.name} on Google Maps: read the reviews`}
                className="mb-8 flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-soft backdrop-blur transition-colors hover:bg-white"
              >
                <span className="font-serif text-2xl font-semibold text-navy-950">{GOOGLE.rating}</span>
                <span>
                  <span className="flex text-primary-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(GOOGLE.rating) ? 'fill-current' : '')} />
                    ))}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {GOOGLE.reviews} Google reviews · {GOOGLE.name} ↗
                  </span>
                </span>
              </a>
              <div
                className="mb-8 flex gap-2 rounded-2xl bg-white/90 p-2 shadow-soft backdrop-blur"
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
                        {active === i && heroInView && (
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
