import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, Check, Download, Expand, MapPin, MessageCircle, Phone, RotateCw } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import Reveal from '@/components/common/Reveal';
import CtaSection from '@/components/common/CtaSection';
import { Lightbox } from '@/features/home/components/GallerySection';
import EmiCalculator from '@/features/home/components/EmiCalculator';
import VirtualTourSection from '@/features/explore/VirtualTourSection';
import BrochureModal from '@/features/projects/BrochureModal';
import LeadershipConnect from '@/features/projects/LeadershipConnect';
import ProjectEnquiryForm from '@/features/projects/ProjectEnquiryForm';
import ProjectFaq from '@/features/projects/ProjectFaq';
import PricingSection from '@/features/projects/PricingSection';
import { PROJECT_PAGES, projectPath } from '@/data/projectPages';
import { responsive } from '@/data/projects';
import { COMPANY } from '@/data/companyInfo';
import { whatsappLink } from '@/utils/whatsapp';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';

const sectionsFor = (p) =>
  [
    ['overview', 'Overview'],
    ['floor-plans', 'Floor plans'],
    ['pricing', p.priceList ? 'Price list' : 'Area statement'],
    p.tours.length ? ['virtual-tour', '360° Tour'] : null,
    ['amenities', 'Amenities'],
    ['specifications', 'Specifications'],
    ['emi', 'EMI'],
    ['location', 'Location'],
    ['faq', 'FAQ'],
    ['contact', 'Contact'],
  ].filter(Boolean);

/** Shared full-screen viewer for plans, maps and photos on this page. */
function useViewer() {
  const [state, setState] = useState(null); // { items, index }
  const open = useCallback((items, index = 0) => setState({ items: items.map((x) => ({ ...x, title: x.title || x.alt })), index }), []);
  const close = useCallback(() => setState(null), []);
  const nav = useCallback((d) => setState((s) => ({ ...s, index: (s.index + d + s.items.length) % s.items.length })), []);
  const node = <AnimatePresence>{state && <Lightbox items={state.items} index={state.index} onClose={close} onNav={nav} />}</AnimatePresence>;
  return [open, node];
}

/** Smooth-scroll to a section below the sticky bars; re-aim once if images above loaded mid-scroll. */
function jumpTo(id) {
  const offset = () => (window.innerWidth >= 768 ? 150 : 120);
  const target = () => document.getElementById(id).getBoundingClientRect().top + window.scrollY - offset();
  window.scrollTo({ top: target(), behavior: 'smooth' });
  let checks = 0;
  const settle = () => {
    const off = document.getElementById(id).getBoundingClientRect().top - offset();
    if (Math.abs(off) > 12 && ++checks < 6) window.scrollTo({ top: target(), behavior: checks > 2 ? 'auto' : 'smooth' });
    if (checks < 6 && Math.abs(off) > 12) setTimeout(settle, 450);
  };
  setTimeout(settle, 900);
}

function SubNav({ sections }) {
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const els = sections.map(([id]) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  return (
    <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-navy-900/10 bg-ivory/95 backdrop-blur-xl md:top-[5.75rem]">
      <div className="container no-scrollbar flex gap-6 overflow-x-auto md:gap-9">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              jumpTo(id);
            }}
            className={cn(
              '-mb-px shrink-0 border-b-2 py-4 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors',
              active === id ? 'border-primary-500 text-navy-950' : 'border-transparent text-navy-900/50 hover:text-navy-950',
            )}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function Hero({ p, onBrochure }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 pt-16 md:pt-[5.75rem]">
      <div className="absolute inset-0 -z-10">
        <motion.img
          {...responsive(p.hero)}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
          className="h-full w-full object-cover"
          {...{ fetchpriority: 'high' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/45 to-navy-950/10" />
      </div>
      <div className="container flex min-h-[78svh] flex-col justify-end pb-10 pt-24 md:min-h-[86svh] md:pb-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-300">
            <Link to="/projects" className="-my-3 py-3 hover:text-white">Projects</Link> <span className="px-1.5">/</span> {p.status}
          </p>
          <h1 className="mt-5 text-[2.9rem] font-semibold leading-[1.02] text-white sm:text-[4.4rem] xl:text-[5.6rem]">{p.name}</h1>
          <p className="mt-4 max-w-2xl font-serif text-xl italic text-primary-200 md:text-2xl">{p.headline}</p>
          <div className="mt-7 flex flex-wrap gap-2.5 text-[12.5px] font-semibold text-white">
            <span className="flex items-center gap-2 border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur"><MapPin className="h-4 w-4 text-primary-300" /> {p.location}</span>
            <span className="flex items-center gap-2 border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur"><BadgeCheck className="h-4 w-4 text-primary-300" /> RERA {p.rera}</span>
            <span className="border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur">{p.configs.join(' · ')}</span>
            {p.startingFrom && (
              <span className="bg-primary-400 px-3.5 py-2 text-navy-950">
                Starting <span className="rupee">₹</span>
                {(p.startingFrom / 1e5).toFixed(2)} L*
              </span>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(`Hello ${COMPANY.shortName}, I'd like to book a site visit at ${p.name}.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-300 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 shadow-gold"
            >
              Book a site visit <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onBrochure}
              className="inline-flex items-center justify-center gap-2 border border-white/40 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4" /> Download brochure
            </button>
          </div>
        </motion.div>

        <dl className="mt-12 grid grid-cols-2 border-t border-white/15 md:grid-cols-4">
          {p.stats.map(([v, l], i) => (
            <div key={l} className={cn('py-5 pr-4', i % 2 && 'border-l border-white/15 pl-4 md:pl-6', i > 1 && 'border-t border-white/15 md:border-t-0', i === 2 && 'md:border-l md:pl-6')}>
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="block font-serif text-3xl font-semibold text-white md:text-4xl">{v}</span>
                <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/60">{l}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Overview({ p, view }) {
  return (
    <section id="overview" className="section bg-white">
      <div className="container">
        <ChapterHeading numeral="I" label="Overview" title={p.tagline} />
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <Reveal>
            <p className="font-serif text-[1.45rem] leading-[1.55] text-navy-950 md:text-[1.75rem]">{p.about[0]}</p>
            {p.about.slice(1).map((t) => (
              <p key={t.slice(0, 20)} className="mt-6 text-[16px] leading-[1.85] text-slate-600">{t}</p>
            ))}
            <div className="mt-10 grid grid-cols-3 gap-2">
              {p.interiors.map((x, i) => (
                <button key={x.src} type="button" data-cursor="view" onClick={() => view(p.interiors, i)} className="group relative aspect-[4/3] overflow-hidden bg-navy-100" aria-label={`View ${x.alt}`}>
                  <img src={x.sm} alt={x.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/70 to-transparent px-2 pb-1.5 pt-6 text-left text-[11px] font-semibold text-white">{x.alt}</span>
                </button>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">{p.highlightsTitle}</p>
            <ul className="mt-4 border-t border-navy-900/10">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-4 border-b border-navy-900/10 py-4 text-[15px] leading-relaxed text-navy-950">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-primary-300"><Check className="h-3 w-3" strokeWidth={3} /></span>
                  {h}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {p.reasons.length > 0 && (
          <Reveal className="mt-20 bg-navy-950 p-7 text-white sm:p-10 md:p-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">Reasons for investment</p>
            <h3 className="mt-3 font-serif text-3xl text-white md:text-4xl">Why buyers choose {p.name}</h3>
            <ol className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-2">
              {p.reasons.map((r, i) => (
                <li key={r} className="flex gap-4">
                  <span className="font-serif text-2xl leading-none text-primary-300">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15px] leading-relaxed text-white/80">{r}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function FloorPlans({ p, view, onBrochure }) {
  const [tab, setTab] = useState(0);
  const [sub, setSub] = useState(0);
  const fp = p.floorPlans[tab];
  const shown = fp.views[sub] || fp.views[0];
  return (
    <section id="floor-plans" className="section relative bg-ivory">
      <div aria-hidden className="bg-blueprint pointer-events-none absolute inset-0" />
      <div className="container relative">
        <ChapterHeading numeral="II" label="Floor plans" title="Find your layout" intro={p.areaNote} />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Floor plans">
          {p.floorPlans.map((f, i) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={tab === i}
              onClick={() => {
                setTab(i);
                setSub(0);
              }}
              className={cn('border px-5 py-3 font-serif text-lg transition-colors md:text-xl', tab === i ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 bg-white text-navy-900 hover:border-primary-400')}
            >
              {f.label}
              {f.area && <span className="ml-2 font-sans text-[11px] font-bold tracking-wide opacity-70">{f.area}</span>}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div className="crop-marks mx-3.5">
            <button type="button" data-cursor="view" onClick={() => view(fp.views, sub)} className="group relative block w-full bg-white p-3 sm:p-5" aria-label={`Open ${shown.alt} full screen`}>
              <AnimatePresence mode="wait">
                <motion.img key={shown.src} src={shown.src} alt={shown.alt} loading="lazy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mx-auto max-h-[30rem] w-full object-contain" />
              </AnimatePresence>
              <span className="absolute right-3 top-3 flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-90">
                <Expand className="h-3.5 w-3.5" /> Zoom
              </span>
            </button>
            {fp.viewLabels && (
              <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.22em]">
                {fp.viewLabels.map((l, i) => (
                  <button key={l} type="button" onClick={() => setSub(i)} aria-pressed={sub === i} className={cn('relative border-b-2 pb-1 before:absolute before:-inset-3 before:content-[""]', sub === i ? 'border-primary-500 text-navy-950' : 'border-transparent text-navy-900/50 hover:text-navy-950')}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="font-serif text-4xl font-semibold text-navy-950">{fp.label}</p>
            {fp.area && <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.22em] text-primary-700">Total area · {fp.area}</p>}
            <p className="mt-5 text-[16px] leading-[1.8] text-slate-600">{fp.text}</p>
            <ul className="mt-6 grid grid-cols-2 gap-px border border-navy-900/10 bg-navy-900/10">
              {fp.rooms.map((r) => (
                <li key={r} className="bg-white px-4 py-3 text-[14px] font-semibold text-navy-950">{r}</li>
              ))}
            </ul>
            <a
              href={whatsappLink(`Hello ${COMPANY.shortName}, please share the price for the ${fp.label}${fp.area ? ` (${fp.area})` : ''} at ${p.name}.`)}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 flex items-center justify-between bg-navy-900 px-6 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-navy-800"
            >
              Get {fp.label} price <ArrowUpRight className="h-4 w-4 text-primary-300" />
            </a>
            <button type="button" onClick={onBrochure} className="mt-3 flex w-full items-center justify-between border border-navy-900/20 bg-white px-6 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-900 hover:border-primary-400">
              Download brochure <Download className="h-4 w-4 text-primary-600" />
            </button>
          </div>
        </div>

        <Reveal className="mt-20 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">Master plan</p>
            <h3 className="mt-3 font-serif text-3xl text-navy-950 md:text-4xl">The whole community, at a glance</h3>
            <button type="button" onClick={onBrochure} className="mt-6 inline-flex items-center gap-2 bg-navy-900 px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-navy-800">
              <Download className="h-4 w-4 text-primary-300" /> Download brochure
            </button>
            {p.tours.length > 0 && (
              <Link to="/explore/virtual-tour" className="group mt-8 flex items-center gap-4 border border-primary-300 bg-white p-5 hover:bg-navy-900">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-primary-300 group-hover:bg-primary-400 group-hover:text-navy-950"><RotateCw className="h-5 w-5" /></span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-primary-700 group-hover:text-primary-300">360° virtual tour</span>
                  <span className="block font-serif text-xl text-navy-950 group-hover:text-white">Walk through a 3 BHK at {p.name}</span>
                </span>
              </Link>
            )}
          </div>
          <button type="button" data-cursor="view" onClick={() => view([p.masterPlan])} className="group relative block overflow-hidden bg-white p-3" aria-label="Open master plan full screen">
            <img src={p.masterPlan.src} alt={p.masterPlan.alt} loading="lazy" className="w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" />
            <span className="absolute right-4 top-4 flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white"><Expand className="h-3.5 w-3.5" /> Zoom</span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}

function Amenities({ p, view, numeral }) {
  const [all, setAll] = useState(false);
  const list = all ? p.amenities : p.amenities.slice(0, 8);
  const photos = p.amenities.map(([t, x]) => ({ ...x, title: t }));
  return (
    <section id="amenities" className="section relative overflow-hidden bg-navy-950">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="container relative">
        <ChapterHeading light numeral={numeral} label="Amenities" title="Spaces that pamper your senses" intro={p.amenitiesIntro} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {list.map(([t, x], i) => (
            <motion.button
              key={t}
              type="button"
              data-cursor="view"
              onClick={() => view(photos, i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className="group relative aspect-[4/5] overflow-hidden bg-navy-800 text-left"
              aria-label={`View ${t}`}
            >
              <img src={x.sm} alt={x.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
              <span className="absolute left-3 top-3 font-serif text-sm text-primary-200">{String(i + 1).padStart(2, '0')}</span>
              <span className="absolute inset-x-3 bottom-3 font-serif text-[1.05rem] leading-tight text-white md:inset-x-4 md:bottom-4 md:text-xl">{t}</span>
            </motion.button>
          ))}
        </div>
        {p.amenities.length > 8 && (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => setAll((v) => !v)} className="border border-white/30 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white hover:border-primary-300 hover:text-primary-200">
              {all ? 'Show fewer' : `View all ${p.amenities.length} amenities`}
            </button>
          </div>
        )}
        {p.facilities.length > 0 && (
          <ul className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/70">
            {p.facilities.map((f, i) => (
              <li key={f} className="flex items-center gap-6">
                {f}
                {i < p.facilities.length - 1 && <span className="text-primary-400">✦</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Specs({ p, numeral }) {
  const [tab, setTab] = useState(0);
  const [, items] = p.specs[tab];
  return (
    <section id="specifications" className="section bg-white">
      <div className="container">
        <ChapterHeading numeral={numeral} label="Specifications" title="Built to last, finished to impress" intro="Every detail is meticulously crafted with the finest materials and workmanship." />
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-navy-900/10 lg:px-0" role="tablist" aria-label="Specifications">
            {p.specs.map(([label], i) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={cn(
                  'shrink-0 border px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.15em] transition-colors lg:-ml-px lg:border-0 lg:border-l-2 lg:py-4 lg:pl-6',
                  tab === i ? 'border-navy-900 bg-navy-900 text-white lg:border-primary-500 lg:bg-transparent lg:text-navy-950' : 'border-navy-900/15 text-navy-900/55 hover:text-navy-950 lg:border-transparent',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="grid gap-5 md:grid-cols-2">
              {items.map(([t, d]) => (
                <div key={t} className="border border-navy-900/10 bg-ivory p-6 md:p-7">
                  <span className="block h-px w-10 bg-primary-500" />
                  <p className="mt-5 font-serif text-xl font-semibold text-navy-950">{t}</p>
                  <p className="mt-3 text-[15px] leading-[1.8] text-slate-600">{d}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Location({ p, view, numeral }) {
  return (
    <section id="location" className="section bg-ivory">
      <div className="container">
        <ChapterHeading numeral={numeral} label="Location" title="Well connected, wonderfully calm" intro={p.locationIntro} />
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <button type="button" data-cursor="view" onClick={() => view([p.map])} className="crop-marks group mx-3.5 block self-start bg-white p-3" aria-label="Open location map full screen">
            <img src={p.map.src} alt={p.map.alt} loading="lazy" className="w-full object-contain" />
          </button>
          <div className="grid gap-8 sm:grid-cols-2">
            {p.landmarks.map(([group, rows]) => (
              <Reveal key={group}>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">{group}</p>
                <ul className="mt-3 border-t border-navy-900/10">
                  {rows.map(([name, dist]) => (
                    <li key={name} className="flex items-baseline justify-between gap-4 border-b border-navy-900/10 py-3">
                      <span className="text-[15px] text-navy-950">{name}</span>
                      <span className="shrink-0 font-serif text-lg font-semibold text-primary-700">{dist}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact({ p }) {
  const other = PROJECT_PAGES.find((x) => x.slug !== p.slug);
  return (
    <section id="contact" className="section bg-white">
      <div className="container">
        <Reveal className="mb-12 grid gap-6 border-b border-navy-900/10 pb-8 md:mb-16 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">Get in touch</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.08] text-navy-950 md:text-[3.2rem]">{p.contactTitle}</h2>
          </div>
          <p className="text-[15.5px] leading-[1.8] text-slate-600">{p.contactText}</p>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <LeadershipConnect project={p} />
          <Reveal delay={0.1}>
            <ProjectEnquiryForm project={p} />
          </Reveal>
        </div>

        {other && (
          <Reveal className="mt-16">
            <Link to={projectPath(other.slug)} data-cursor="view" className="group grid items-center gap-6 border-t border-navy-900/10 pt-10 sm:grid-cols-[14rem_1fr_auto]">
              <span className="block aspect-[16/10] overflow-hidden bg-navy-100">
                <img src={other.card.sm} alt={other.card.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">Also by {COMPANY.shortName}</span>
                <span className="mt-1 block font-serif text-3xl text-navy-950">{other.name}</span>
                <span className="mt-1 block text-sm text-slate-600">{other.location}</span>
              </span>
              <ArrowUpRight className="h-7 w-7 text-primary-600 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/** Vertical "Brochure" tab on the right edge (desktop) and a pill above the bottom bar (phones). */
function BrochureTab({ onClick }) {
  // Hide the floating phone pill while the contact block or footer is on screen (it would cover them).
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const targets = [document.getElementById('contact'), document.querySelector('footer')].filter(Boolean);
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      setHidden(seen.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 bg-primary-500 px-3 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-navy-950 shadow-xl transition-colors [writing-mode:vertical-rl] hover:bg-primary-400 lg:flex"
      >
        <Download className="h-4 w-4 rotate-90" /> Brochure
      </button>
      <button
        type="button"
        onClick={onClick}
        className={cn('fixed bottom-[5.25rem] left-4 z-40 flex items-center gap-2 rounded-full bg-primary-500 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-navy-950 shadow-xl transition-all duration-300 lg:hidden', hidden && 'pointer-events-none translate-y-4 opacity-0')}
      >
        <Download className="h-4 w-4" /> Brochure
      </button>
    </>
  );
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const p = PROJECT_PAGES.find((x) => x.slug === slug);
  useDocumentTitle(p ? `${p.name} · ${p.location}` : 'Projects');
  const [view, viewer] = useViewer();
  const [brochure, setBrochure] = useState(false);
  const openBrochure = useCallback(() => setBrochure(true), []);
  const closeBrochure = useCallback(() => setBrochure(false), []);
  const sections = useMemo(() => (p ? sectionsFor(p) : []), [p]);
  const enquireFlat = useCallback(
    (r) => {
      const c = p.contact;
      const msg = r
        ? `Hi ${c.name.split(' ')[0]} Ji, I am interested in ${p.name}: ${r.type}, flat ${r.flats} (carpet ${r.carpet} sq ft). Please share availability and booking details.`
        : `Hi ${c.name.split(' ')[0]} Ji, please share the latest price list for ${p.name}.`;
      const url = `https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`;
      if (!window.open(url, '_blank')) window.location.href = url;
    },
    [p],
  );
  if (!p) return <Navigate to="/projects" replace />;
  const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const roman = (id) => ROMANS[sections.findIndex(([x]) => x === id)];

  return (
    <>
      <Hero p={p} onBrochure={openBrochure} />
      <SubNav sections={sections} />
      <Overview p={p} view={view} />
      <FloorPlans p={p} view={view} onBrochure={openBrochure} />
      <PricingSection project={p} numeral={roman('pricing')} onBrochure={openBrochure} onEnquire={enquireFlat} />
      {p.tours.length > 0 && (
        <VirtualTourSection numeral={roman('virtual-tour')} label={p.tourTitle} title={`Experience ${p.name} in 360°`} intro={p.tourText} />
      )}
      <Amenities p={p} view={view} numeral={roman('amenities')} />
      <Specs p={p} numeral={roman('specifications')} />
      <EmiCalculator numeral={roman('emi')} />
      <Location p={p} view={view} numeral={roman('location')} />
      <ProjectFaq project={p} numeral={roman('faq')} onEnquire={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} />
      <Contact p={p} />
      <CtaSection />
      <BrochureTab onClick={openBrochure} />
      <BrochureModal open={brochure} onClose={closeBrochure} project={p} />
      {viewer}
    </>
  );
}
