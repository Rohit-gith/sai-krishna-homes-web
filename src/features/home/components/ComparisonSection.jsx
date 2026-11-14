import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, Check, Leaf, Sparkles, Wallet } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { EmiButton } from './EmiCalculator';
import { Lightbox } from './GallerySection';
import NearbyShowcase from './NearbyShowcase';
import RadialMap from './RadialMap';
import {
  COMPARE_FACTS,
  COMPARE_FEATURES,
  COMPARE_PROJECTS,
  DISTANCE_SOURCE,
  LANDMARKS,
  ORIGIN,
  PHOTO_CREDITS,
  PRICE_CHECK,
  PRICE_NOTE,
  STARTING_FROM,
} from '@/data/comparison';
import { projectPath } from '@/data/projectPages';
import { COMPANY } from '@/data/companyInfo';
import { cn } from '@/utils/cn';


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
/* Part 2 · life around you: the project in the middle, places around  */
/* ------------------------------------------------------------------ */

function LifeAround() {
  const [slug, setSlug] = useState(COMPARE_PROJECTS[0].slug);
  const project = COMPARE_PROJECTS.find((p) => p.slug === slug);
  const places = LANDMARKS[slug];
  // map: every place with its travel mode; the highlighted route cycles until the visitor hovers a photo
  const mapItems = places.map((p, i) => ({ ...p, i, m: p.cat === 'Airport' ? 'air' : p.cat === 'Railway' ? 'rail' : 'road' }));
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((i) => (i + 1) % places.length), 4500);
    return () => clearTimeout(t);
  }, [active, places.length]);
  useEffect(() => setActive(0), [slug]);

  // full-size photo viewer (landmark photos are not ours: no watermark)
  const photos = places.filter((p) => p.photo);
  const slides = photos.map((p) => ({
    src: `/images/nearby/${p.photo}.webp`,
    alt: p.name,
    title: `${p.name}${p.mins != null ? ` · ${p.mins} min` : p.km != null ? ` · ${p.km} km` : ''}`,
    plain: true,
  }));
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
              Big facilities, minutes from home
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

        <AnimatePresence>{open !== null && <Lightbox items={slides} index={open} onClose={closeViewer} onNav={navViewer} />}</AnimatePresence>

        {/* the residency in the middle, a vehicle heading out to every place */}
        {ORIGIN[slug] && (
          <div className="mt-10">
            <RadialMap
              origin={ORIGIN[slug]}
              projectInfo={project}
              places={places}
              activeName={mapItems[active]?.name}
              onPick={(p, hover) => {
                setActive(mapItems.findIndex((x) => x.name === p.name));
                if (!hover) {
                  const i = photos.findIndex((x) => x.name === p.name);
                  if (i >= 0) setOpen(i);
                }
              }}
            />
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              <span className="text-primary-300">From {project.name}</span>
              <span>✈ by air</span>
              <span>🚆 by rail</span>
              <span>🚗 by road</span>
            </p>
          </div>
        )}

        {/* phones: the diagram's photos are small, so add a swipeable strip of big photo cards */}
        <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          {[...places]
            .filter((p) => p.mins != null)
            .sort((a, b) => a.mins - b.mins)
            .map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  const i = photos.findIndex((x) => x.name === p.name);
                  if (i >= 0) setOpen(i);
                }}
                className="relative w-[72%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/15 text-left shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]"
              >
                <span className="block aspect-[4/3] bg-navy-900">
                  {p.photo && <img src={`/images/nearby/${p.photo}.webp`} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-[#04100c] via-[#04100c]/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
                  <span className="font-serif text-[1.2rem] leading-tight text-white">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-primary-400 px-2.5 py-1 text-[12px] font-bold text-navy-950">Just {p.mins} min</span>
                </span>
              </button>
            ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-white/45 md:hidden">Swipe to see every place →</p>

        <div className="mt-6">
          <NearbyShowcase places={places} />
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-white/35">
          {DISTANCE_SOURCE[slug]} Tap any photo to see it larger.{' '}
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
