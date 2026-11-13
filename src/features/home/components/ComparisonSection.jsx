import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Bus,
  Check,
  Expand,
  GraduationCap,
  HeartPulse,
  Hospital,
  Landmark,
  Leaf,
  Milestone,
  Navigation,
  Plane,
  School,
  Sparkles,
  TrainFront,
  Wallet,
} from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { EmiButton } from './EmiCalculator';
import { Lightbox } from './GallerySection';
import {
  COMPARE_FACTS,
  COMPARE_FEATURES,
  COMPARE_PROJECTS,
  DISTANCE_SOURCE,
  LANDMARKS,
  PHOTO_CREDITS,
  PRICE_CHECK,
  PRICE_NOTE,
  STARTING_FROM,
  routeUrl,
} from '@/data/comparison';
import { projectPath } from '@/data/projectPages';
import { COMPANY } from '@/data/companyInfo';
import { cn } from '@/utils/cn';

const ICONS = {
  Airport: Plane,
  Railway: TrainFront,
  College: GraduationCap,
  Institute: GraduationCap,
  School,
  Hospital,
  'Cancer care': HeartPulse,
  RBI: Landmark,
  'IT hub': Building2,
  Highway: Milestone,
  Bus,
};

const GREEN = new Set(COMPARE_FEATURES.find(([g]) => g === 'Green living')[1].map(([f]) => f));
const ALL_FEATURES = COMPARE_FEATURES.flatMap(([, items]) => items);
const SHARED = ALL_FEATURES.filter(([, a, b]) => a && b).map(([f]) => f);
const ONLY = [
  ALL_FEATURES.filter(([, a, b]) => a && !b).map(([f]) => f),
  ALL_FEATURES.filter(([, a, b]) => !a && b).map(([f]) => f),
];

/* ------------------------------------------------------------------ */
/* Part 1 · the two projects face to face                              */
/* ------------------------------------------------------------------ */

function ProjectPanel({ project, col }) {
  return (
    <article className="relative flex h-full flex-col bg-white shadow-[0_40px_80px_-50px_rgba(8,38,32,0.6)]">
      <Link to={projectPath(project.slug)} className="group relative block aspect-[16/10] overflow-hidden">
        <img
          src={project.photo}
          alt={project.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/45 to-transparent sm:via-navy-950/20" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
          <span>
            <span className="block text-[10.5px] font-bold uppercase tracking-[0.3em] text-primary-200">{project.place}</span>
            <span className="mt-1.5 block font-serif text-[1.65rem] leading-tight text-white sm:text-[2.1rem]">{project.name}</span>
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 text-white transition-colors group-hover:border-primary-300 group-hover:bg-primary-400 group-hover:text-navy-950">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </span>
      </Link>

      {/* gold "vs" medallion, centred in the gap between the two photos (desktop) */}
      {col === 0 && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden aspect-[16/10] lg:block">
          <span className="absolute -right-14 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-primary-300 bg-navy-950 font-serif text-xl italic text-primary-300 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)]">
            vs
          </span>
        </span>
      )}

      <dl className="grid grid-cols-2 border-b border-navy-900/10">
        {COMPARE_FACTS.map(([label, ...vals], i) => (
          <div key={label} className={cn('border-t border-navy-900/10 px-5 py-4 sm:px-7', i % 2 === 0 && 'border-r')}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</dt>
            <dd
              className={cn(
                'mt-1.5 font-serif leading-snug',
                label === 'Starting price' ? 'text-[1.35rem] text-primary-700' : 'text-[15.5px] text-navy-950',
                label === 'RERA' && 'font-sans text-[13px] font-semibold tracking-wide',
              )}
            >
              {label === 'RERA' ? (
                <a
                  href={project.reraUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open on the official Odisha RERA website"
                  className="inline-flex items-center gap-1 underline decoration-primary-400/60 underline-offset-4 hover:text-primary-700"
                >
                  {vals[col]}
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary-600" />
                </a>
              ) : String(vals[col]).startsWith('₹') ? (
                <>
                  <span className="rupee">₹</span>
                  {vals[col].slice(1)}
                </>
              ) : (
                vals[col]
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex-1 px-5 py-6 sm:px-7">
        <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.28em] text-primary-700">
          <Sparkles className="h-3.5 w-3.5" /> Only at {project.name.replace(' Residency', '')}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {ONLY[col].map((f) => (
            <li
              key={f}
              className={cn(
                'flex items-center gap-1.5 border px-3 py-1.5 text-[12.5px] font-medium',
                GREEN.has(f) ? 'border-emerald-600/30 bg-emerald-50 text-emerald-800' : 'border-navy-900/15 bg-ivory text-navy-950',
              )}
            >
              {GREEN.has(f) ? <Leaf className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-primary-600" />}
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Part 2 · life around you: every place on its own lane, to scale     */
/* ------------------------------------------------------------------ */

/* Side-view vehicles, facing right, drawn in currentColor. */
function PlaneIcon(props) {
  return (
    <svg viewBox="0 0 40 20" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M3 9.2 6.2 9.6 2.6 3h3.2l6.4 6.8 9.6-.6L16.6 1h3.6l8.4 8.1 6.2-.3c2.6-.1 4.6.6 4.6 1.2s-2 1.3-4.6 1.2l-6.2-.3-8.4 8.1h-3.6l5.2-8.2-9.6-.6-6.4 6.8H2.6l3.6-6.6-3.2.4C1.6 10.9 1 10.5 1 10s.6-.9 2-.8Z"
      />
    </svg>
  );
}
function TrainIcon(props) {
  return (
    <svg viewBox="0 0 44 20" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M2 3.5C2 2.7 2.7 2 3.5 2H30c5.2 0 9.6 3.4 11.2 8.4l.6 2.1c.3 1-.4 2-1.5 2H3.5c-.8 0-1.5-.7-1.5-1.5Z" />
      <path fill="#06120e" d="M5 5h5v4H5zm7 0h5v4h-5zm7 0h5v4h-5zm8 0h3.5c2.6 0 4.9 1.6 5.9 4H27Z" opacity=".75" />
      <circle cx="9" cy="17" r="2.2" fill="currentColor" />
      <circle cx="16" cy="17" r="2.2" fill="currentColor" />
      <circle cx="27" cy="17" r="2.2" fill="currentColor" />
      <circle cx="34" cy="17" r="2.2" fill="currentColor" />
    </svg>
  );
}
function CarIcon(props) {
  return (
    <svg viewBox="0 0 40 20" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M3 11.5c0-1.2.8-2.2 2-2.5l5.3-1.3 5.2-4.2c.9-.7 2-1.1 3.1-1.1h7.1c1.3 0 2.5.6 3.3 1.6l3.1 3.8 3.6.9c1.3.3 2.3 1.5 2.3 2.9v2.9c0 .8-.7 1.5-1.5 1.5H4.5c-.8 0-1.5-.7-1.5-1.5Z" />
      <path fill="#06120e" d="M16.6 5.2c.5-.4 1.2-.7 1.9-.7h3.7v3.6h-8.8Zm7.4-.7h1.9c.8 0 1.5.4 2 1l1.7 2.6H24Z" opacity=".75" />
      <circle cx="11" cy="16" r="3" fill="currentColor" stroke="#06120e" strokeWidth="1.6" />
      <circle cx="31" cy="16" r="3" fill="currentColor" stroke="#06120e" strokeWidth="1.6" />
    </svg>
  );
}

const MODE = { Airport: 'air', Railway: 'rail' };
const VEHICLE = { air: PlaneIcon, rail: TrainIcon, road: CarIcon };

/** The lane's track: a flight path, a railway or a road. `gold` is the travelled part. */
function Track({ mode, gold = false }) {
  const c = gold ? '#d4a64a' : 'rgba(255,255,255,0.16)';
  if (mode === 'air')
    return <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dotted" style={{ borderColor: c }} />;
  if (mode === 'rail')
    return (
      <span
        className="absolute inset-x-0 top-1/2 h-[9px] -translate-y-1/2 border-y-2"
        style={{
          borderColor: c,
          backgroundImage: `repeating-linear-gradient(90deg, ${c} 0 2px, transparent 2px 9px)`,
        }}
      />
    );
  return (
    <span className="absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 rounded-full" style={{ background: gold ? 'rgba(212,166,74,0.9)' : 'rgba(255,255,255,0.1)' }}>
      <span
        className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2"
        style={{ backgroundImage: `repeating-linear-gradient(90deg, ${gold ? '#06120e' : 'rgba(255,255,255,0.35)'} 0 6px, transparent 6px 12px)` }}
      />
    </span>
  );
}

/** Cover for places that have no free photo yet: emerald field, gold hairlines, the place's icon. */
function PlaceCover({ Icon }) {
  return (
    <span className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#1e4a3e,#06150f_70%)]">
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(135deg,#d4a64a_0_1px,transparent_1px_14px)]"
      />
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary-300/50 bg-[#06150f]/70 text-primary-300 shadow-[0_0_0_10px_rgba(212,166,74,0.06)] lg:h-16 lg:w-16">
        <Icon className="h-9 w-9 lg:h-7 lg:w-7" strokeWidth={1.4} />
      </span>
    </span>
  );
}

function Lane({ place, from, maxKm, index, onOpen }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px' });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const mode = MODE[place.cat] || 'road';
  const Vehicle = VEHICLE[mode];
  const Icon = ICONS[place.cat] || Navigation;
  // square-root scale: order and "further = longer" are kept, near places stay readable on phones
  const pct = 18 + 82 * Math.sqrt(place.km / maxKm);
  const duration = reduce ? 0 : 1.2 + 1.8 * (place.km / maxKm);
  const delay = reduce ? 0 : Math.min(index, 6) * 0.12;
  const ease = [0.33, 1, 0.68, 1];
  const go = inView || reduce;

  useEffect(() => {
    if (!go) return undefined;
    const c = animate(0, place.km, { duration, delay, ease, onUpdate: setVal });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, place.km]);

  // The photo opens full size; the rest of the row opens the live route (an overlay link, so the
  // photo button is not nested inside a link).
  const Pic = place.photo ? 'button' : 'span';
  const picProps = place.photo ? { type: 'button', onClick: onOpen, 'aria-label': `View photo: ${place.name}` } : {};

  return (
    <div
      ref={ref}
      className="group relative block border-b border-white/[0.08] py-6 transition-colors hover:bg-white/[0.025] lg:grid lg:grid-cols-[13rem_15rem_minmax(0,1fr)] lg:items-center lg:gap-x-8 lg:px-3"
    >
      {place.q && (
        <a
          href={routeUrl(from, place.q)}
          target="_blank"
          rel="noreferrer"
          aria-label={`${place.name}, ${place.km} km. Open the live route in Google Maps`}
          className="absolute inset-0 z-[1]"
        />
      )}
      {/* photo (big banner on phones, framed picture on desktop); tap to enlarge */}
      <Pic
        {...picProps}
        data-cursor={place.photo ? 'view' : undefined}
        className="group/pic relative z-[2] block aspect-[16/9] w-full overflow-hidden bg-navy-900 text-left lg:aspect-[3/2]"
      >
        {place.photo ? (
          <img
            src={`/images/nearby/${place.photo}.webp`}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <PlaceCover Icon={Icon} />
        )}
        {place.photo && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-black/45 text-white backdrop-blur-md transition-colors group-hover/pic:bg-primary-400 group-hover/pic:text-navy-950 lg:right-2 lg:top-2 lg:h-8 lg:w-8"
          >
            <Expand className="h-4 w-4" />
          </span>
        )}
        {/* phones: name and distance on the picture */}
        <span className="absolute inset-0 bg-gradient-to-t from-[#04100c]/95 via-[#04100c]/30 to-transparent lg:hidden" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md lg:hidden">
          <Icon className="h-3.5 w-3.5" /> {place.cat}
        </span>
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 lg:hidden">
          <span className="font-serif text-[1.3rem] leading-tight text-white">{place.name}</span>
          <span className="shrink-0 whitespace-nowrap">
            <span className="font-serif text-[2rem] leading-none text-primary-300">{val.toFixed(1)}</span>
            <span className="ml-1 text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary-200">km</span>
          </span>
        </span>
      </Pic>

      {/* desktop: name */}
      <span className="hidden min-w-0 lg:block">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
          <Icon className="h-3 w-3" /> {place.cat}
        </span>
        <span className="mt-1.5 block font-serif text-[1.3rem] leading-snug text-white">{place.name}</span>
      </span>

      {/* the lane (full width on its own row on mobile) */}
      <span className="relative mx-1 mt-5 block h-10 lg:mx-0 lg:mt-0 lg:mr-36">
        {/* start: home */}
        <span className="absolute left-0 top-1/2 z-[2] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary-300 shadow-[0_0_0_4px_rgba(212,166,74,0.18)]" />
        <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%` }}>
          <Track mode={mode} />
          <motion.span
            className="absolute inset-0"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={go ? { clipPath: 'inset(0 0% 0 0)' } : undefined}
            transition={{ duration, delay, ease }}
          >
            <Track mode={mode} gold />
          </motion.span>
          {/* destination pin */}
          {/* outer span positions it; the inner one animates (framer's transform would drop the translate) */}
          <span className="absolute right-0 top-1/2 z-[2] h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2">
            <motion.span
              className="block h-full w-full rounded-full border-2 border-primary-300 bg-[#06120e]"
              initial={{ scale: 0.6 }}
              animate={go ? { scale: [0.6, 0.6, 1.25, 1], backgroundColor: ['#06120e', '#06120e', '#d4a64a', '#d4a64a'] } : undefined}
              transition={{ duration: duration + 0.35, delay, times: [0, 0.75, 0.9, 1] }}
            />
          </span>
          {/* the vehicle */}
          <motion.span
            className={cn('absolute z-[3] -translate-x-full', mode === 'air' ? '-top-2' : 'top-1/2 -translate-y-1/2')}
            initial={{ left: '0%' }}
            animate={go ? { left: '100%' } : undefined}
            transition={{ duration, delay, ease }}
          >
            <motion.span
              className="block text-primary-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              animate={mode === 'air' && !reduce ? { y: [0, -3, 0] } : undefined}
              transition={mode === 'air' ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              <Vehicle className={cn('-mr-2', mode === 'rail' ? 'h-6 w-[3.25rem]' : 'h-6 w-12')} />
            </motion.span>
          </motion.span>
          {/* desktop: the distance sits right where the drive ends */}
          <span className="absolute left-full top-1/2 ml-6 hidden -translate-y-1/2 items-baseline whitespace-nowrap lg:flex">
            <span className="font-serif text-[2.3rem] leading-none text-primary-300">{val.toFixed(1)}</span>
            <span className="ml-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary-200">km</span>
          </span>
        </span>
      </span>

    </div>
  );
}

function OtherPlace({ place, from }) {
  const Icon = ICONS[place.cat] || Navigation;
  const Row = place.q ? 'a' : 'div';
  const linkProps = place.q ? { href: routeUrl(from, place.q), target: '_blank', rel: 'noreferrer' } : {};
  return (
    <Row
      {...linkProps}
      className="group flex items-center gap-3 border border-white/10 px-4 py-3 transition-colors hover:border-primary-300/60 hover:bg-white/[0.03]"
    >
      <Icon className="h-4 w-4 shrink-0 text-primary-300" />
      <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-white/85">{place.name}</span>
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-300">
        {place.time ? `${place.time} drive` : 'Route ↗'}
      </span>
    </Row>
  );
}

function LifeAround() {
  const [slug, setSlug] = useState(COMPARE_PROJECTS[0].slug);
  const project = COMPARE_PROJECTS.find((p) => p.slug === slug);
  const places = LANDMARKS[slug];
  const lanes = places.filter((p) => p.km != null).sort((a, b) => a.km - b.km);
  const others = places.filter((p) => p.km == null);
  const maxKm = Math.max(...lanes.map((p) => p.km));
  // full-size photo viewer for the lanes
  const photos = lanes.filter((p) => p.photo);
  const slides = photos.map((p) => {
    return { src: `/images/nearby/${p.photo}.webp`, alt: p.name, title: `${p.name} · ${p.km} km`, plain: true };
  });
  const [open, setOpen] = useState(null);
  const closeViewer = useCallback(() => setOpen(null), []);
  const navViewer = useCallback((d) => setOpen((i) => (i + d + slides.length) % slides.length), [slides.length]);
  const credits = [...new Map(places.filter((p) => p.photo).map((p) => [PHOTO_CREDITS[p.photo][2] || PHOTO_CREDITS[p.photo][0], PHOTO_CREDITS[p.photo]])).values()];

  return (
    <div className="relative overflow-hidden bg-navy-950 py-20 text-white md:py-28">
      {/* faint survey grid */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:56px_56px]"
      />
      <div className="container relative">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-300">Life around you</p>
            <h3 className="mt-3 max-w-xl font-serif text-[2.1rem] leading-[1.1] text-white md:text-[2.9rem]">
              Everything that matters, close to home
            </h3>
          </div>
          <div role="tablist" aria-label="Choose a project" className="flex self-start border border-white/15 p-1 md:self-auto">
            {COMPARE_PROJECTS.map((p) => (
              <button
                key={p.slug}
                role="tab"
                type="button"
                aria-selected={p.slug === slug}
                onClick={() => setSlug(p.slug)}
                className={cn(
                  'px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em] transition-colors sm:px-5',
                  p.slug === slug ? 'bg-primary-400 text-navy-950' : 'text-white/60 hover:text-white',
                )}
              >
                {p.name.replace(' Residency', '')}
              </button>
            ))}
          </div>
        </Reveal>

        {/* legend */}
        <div className="mt-10 flex flex-col gap-4 border-y border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[13px] text-white/60">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-300 shadow-[0_0_0_4px_rgba(212,166,74,0.18)]" />
            From {project.name}, {project.place} · the longer the line, the longer the drive
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
            <li className="flex items-center gap-2"><PlaneIcon className="h-3.5 w-7 text-primary-200" /> By air</li>
            <li className="flex items-center gap-2"><TrainIcon className="h-3.5 w-7 text-primary-200" /> By rail</li>
            <li className="flex items-center gap-2"><CarIcon className="h-3.5 w-7 text-primary-200" /> By road</li>
          </ul>
        </div>

        <AnimatePresence>{open !== null && <Lightbox items={slides} index={open} onClose={closeViewer} onNav={navViewer} />}</AnimatePresence>

        <div key={slug}>
          {lanes.map((p, i) => (
            <Lane key={p.name} place={p} from={project.mapsQuery} maxKm={maxKm} index={i} onOpen={() => setOpen(photos.indexOf(p))} />
          ))}
        </div>

        {others.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">Also within reach</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <OtherPlace key={p.name} place={p} from={project.mapsQuery} />
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-[11px] leading-relaxed text-white/35">
          {DISTANCE_SOURCE[slug]} Tap any place for the live route.{' '}
          Photos & maps:{' '}
          {credits.map(([who, lic, url], i) => (
            <span key={url || who}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-white/70 hover:underline">
                  {who}
                </a>
              ) : (
                who
              )}{' '}
              ({lic}){i < credits.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Price check: our rate per sq ft against the locality average        */
/* ------------------------------------------------------------------ */

const inr = (n) => Math.round(n).toLocaleString('en-IN');

function PriceCheck() {
  const { market, ours, exampleSqft, included } = PRICE_CHECK;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduce = useReducedMotion();
  const go = inView || reduce;
  const below = Math.round(((market.rate - ours.avg) / market.rate) * 100);
  const saving = (market.rate - ours.avg) * exampleSqft;
  const savingLakh = (saving / 1e5).toFixed(1);
  const t = (d = 0) => ({ duration: reduce ? 0 : 1.4, delay: reduce ? 0 : d, ease: [0.33, 1, 0.68, 1] });

  const Bar = ({ label, sub, rate, width, gold, d }) => (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={cn('text-[10.5px] font-bold uppercase tracking-[0.24em]', gold ? 'text-primary-300' : 'text-white/50')}>{label}</p>
          <p className="mt-1 text-[13px] text-white/55">{sub}</p>
        </div>
        <p className={cn('shrink-0 font-serif leading-none', gold ? 'text-[2.1rem] text-primary-300 sm:text-[2.6rem]' : 'text-[1.6rem] text-white/70 sm:text-[2rem]')}>
          <span className="rupee">₹</span>
          {inr(rate)}
          <span className="ml-1 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">/ sq ft</span>
        </p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden bg-white/[0.06]">
        <motion.div
          className={cn('h-full', gold ? 'bg-gradient-to-r from-primary-500 to-primary-300' : 'bg-white/25')}
          initial={{ width: 0 }}
          animate={go ? { width: `${width}%` } : undefined}
          transition={t(d)}
        />
      </div>
    </div>
  );

  return (
    <Reveal className="mb-14">
      <div ref={ref} className="grid overflow-hidden bg-navy-950 text-white lg:grid-cols-[1.35fr_1fr]">
        {/* left: the price comparison */}
        <div className="p-6 sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary-300">Price check · {market.area}</p>
          <h3 className="mt-3 max-w-lg font-serif text-[1.9rem] leading-[1.12] text-white sm:text-[2.5rem]">
            {below}% below the {market.area} average, every single flat
          </h3>
          <div className="mt-9 space-y-7">
            <Bar label={`${market.area} average`} sub={`${market.source}, ${market.asOf}`} rate={market.rate} width={100} d={0} />
            <Bar label={ours.name} sub={`Average of all ${ours.flats} flat types on our price list · ₹${inr(ours.min)} to ₹${inr(ours.max)}`} rate={ours.avg} width={(ours.avg / market.rate) * 100} gold d={0.25} />
          </div>
          <p className="mt-9 border-l-2 border-primary-400 pl-4 text-[15px] leading-relaxed text-white/80">
            On a {inr(exampleSqft)} sq ft 2 BHK, that is about{' '}
            <span className="font-serif text-[1.35rem] text-primary-300">
              <span className="rupee">₹</span>
              {savingLakh} lakh
            </span>{' '}
            less than the area average.
          </p>
        </div>

        {/* right: what the price includes, and what you get */}
        <div className="border-t border-white/10 bg-white/[0.03] p-6 sm:p-10 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">Included in the price</p>
          <ul className="mt-4 space-y-3">
            {included.map((x) => (
              <li key={x} className="flex items-start gap-3 text-[14.5px] text-white/85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-400 text-navy-950">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">And you also get</p>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            <li className="border border-white/10 p-4">
              <p className="font-serif text-[1.8rem] leading-none text-primary-300">20</p>
              <p className="mt-2 text-[12.5px] leading-snug text-white/70">amenities &amp; services: pool, gym, yoga room, A/C hall</p>
            </li>
            <li className="border border-emerald-400/25 bg-emerald-400/[0.05] p-4">
              <p className="flex items-center gap-1.5 font-serif text-[1.8rem] leading-none text-emerald-300">
                <Leaf className="h-5 w-5" /> 4
              </p>
              <p className="mt-2 text-[12.5px] leading-snug text-white/70">green systems: solar, rainwater harvesting, STP, EV charging</p>
            </li>
          </ul>
          <p className="mt-6 text-[11px] leading-relaxed text-white/40">
            Our rate = listed price ÷ super built-up area (Panchawati price list), before GST and registration. Area rate as published by Square Yards.{' '}
            <a href={market.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white/70">
              Area rate source ↗
            </a>
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* The value promise, in plain words                                   */
/* ------------------------------------------------------------------ */

function ValueBand() {
  const lakh = (STARTING_FROM / 1e5).toFixed(2).replace(/\.?0+$/, '');
  const items = [
    {
      icon: Wallet,
      kicker: 'Affordable',
      title: (
        <>
          Homes from <span className="rupee">₹</span>
          {lakh} L
        </>
      ),
      text: 'Car parking, electrification and development charges are included in the Panchawati price.',
    },
    {
      icon: Sparkles,
      kicker: 'More facilities',
      title: '25+ amenities',
      text: 'At the Sai Krishna Sports Arena, and 20 amenities & services at Panchawati: pool, gym, courts, jogging track and more.',
    },
    {
      icon: Leaf,
      kicker: 'Greener living',
      title: 'Built with nature',
      text: 'Rooftop solar, rainwater harvesting, a sewage treatment plant and EV charging at Panchawati; lush open greens at Sai Krishna.',
    },
  ];
  return (
    <Reveal className="mb-14 grid border-y border-navy-900/10 md:grid-cols-3">
      {items.map(({ icon: Icon, kicker, title, text }, i) => (
        <div key={kicker} className={cn('py-7 md:px-8', i > 0 && 'border-t border-navy-900/10 md:border-l md:border-t-0', i === 0 && 'md:pl-0')}>
          <p className={cn('flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.3em]', i === 2 ? 'text-emerald-700' : 'text-primary-700')}>
            <Icon className="h-4 w-4" /> {kicker}
          </p>
          <p className="mt-3 font-serif text-[1.9rem] leading-tight text-navy-950">{title}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{text}</p>
        </div>
      ))}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */

/** Home-page comparison: the value promise, both projects face to face, life around them, and the EMI calculator. */
export default function ComparisonSection({ numeral = 'VI' } = {}) {
  return (
    <section id="compare" className="scroll-mt-24">
      <div className="section bg-ivory">
        <div className="container">
          <ChapterHeading
            numeral={numeral}
            label="Compare & decide"
            title="More home for your money"
            intro="Affordable prices, more facilities and a greener place to live. Compare our two addresses side by side, with facts from our price lists, brochures and the Odisha RERA record."
          />

          <ValueBand />

          <PriceCheck />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {COMPARE_PROJECTS.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08} className="relative z-[1] h-full first:z-[2]">
                <ProjectPanel project={p} col={i} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 bg-navy-950 px-6 py-7 text-white sm:px-9">
            <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.3em] text-primary-300">
              <BadgeCheck className="h-4 w-4" /> In both projects
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {SHARED.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-white/85">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-400 text-navy-950">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>

          <p className="mt-5 text-[11.5px] leading-relaxed text-slate-500">
            {PRICE_NOTE} Features as listed in each project&apos;s brochure. Units, approval and possession dates are as registered
            with Odisha RERA; tap a RERA number to open its official record.
          </p>
        </div>
      </div>

      <LifeAround />

      <div className="bg-ivory py-14">
        <Reveal className="container">
          <div className="flex flex-col gap-6 bg-navy-950 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary-300">Plan your purchase</p>
              <p className="mt-2 font-serif text-[1.6rem] leading-tight text-white sm:text-[2rem]">Found the one? Check your EMI.</p>
            </div>
            <EmiButton />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
