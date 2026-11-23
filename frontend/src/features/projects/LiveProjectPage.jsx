import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, Check, Eye, MapPin, Navigation } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import Reveal from '@/components/common/Reveal';
import CtaSection from '@/components/common/CtaSection';
import { Lightbox } from '@/features/home/components/GallerySection';
import EmiCalculator from '@/features/home/components/EmiCalculator';
import LeadershipConnect from '@/features/projects/LeadershipConnect';
import ProjectEnquiryForm from '@/features/projects/ProjectEnquiryForm';
import { toPage } from '@/data/liveProjects';
import { projectPath } from '@/data/projectPages';
import { COMPANY } from '@/data/companyInfo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';

/*
 * The page for a project the owner added in the CRM. Same look as the built-in project pages,
 * built only from what the owner filled in (sections without details are left out).
 */

const lakh = (n) => (n >= 1e7 ? `${(n / 1e7).toFixed(2)} Cr` : `${(n / 1e5).toFixed(2).replace(/\.00$/, '')} L`);

function useViewer() {
  const [state, setState] = useState(null);
  const open = useCallback((items, index = 0) => setState({ items: items.map((x) => ({ ...x, title: x.alt })), index }), []);
  const close = useCallback(() => setState(null), []);
  const nav = useCallback((d) => setState((s) => ({ ...s, index: (s.index + d + s.items.length) % s.items.length })), []);
  return [open, <AnimatePresence key="viewer">{state && <Lightbox items={state.items} index={state.index} onClose={close} onNav={nav} />}</AnimatePresence>];
}

function Hero({ p }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 pt-16 md:pt-[5.75rem]">
      <div className="absolute inset-0 -z-10">
        <motion.img
          src={p.hero.src}
          alt={p.hero.alt}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
          className="h-full w-full object-cover"
          {...{ fetchpriority: 'high' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/45 to-navy-950/10" />
      </div>
      <div className="container flex min-h-[72svh] flex-col justify-end pb-10 pt-24 md:min-h-[80svh] md:pb-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-300">
            <Link to="/projects" className="-my-3 py-3 hover:text-white">Projects</Link> <span className="px-1.5">/</span> {p.status}
          </p>
          <h1 className="mt-5 text-[2.9rem] font-semibold leading-[1.02] text-white sm:text-[4.4rem] xl:text-[5.6rem]">{p.name}</h1>
          {p.headline && <p className="mt-4 max-w-2xl font-serif text-xl italic text-primary-200 md:text-2xl">{p.headline}</p>}
          <div className="mt-7 flex flex-wrap gap-2.5 text-[12.5px] font-semibold text-white">
            {p.location && (
              <span className="flex items-center gap-2 border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur">
                <MapPin className="h-4 w-4 text-primary-300" /> {p.location}
              </span>
            )}
            {p.rera && (
              <a
                href={p.reraUrl || COMPANY.reraVerifyUrl}
                target="_blank"
                rel="noreferrer"
                title="Verify on the official Odisha RERA website"
                className="group flex items-center gap-2 border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur transition-colors hover:border-primary-300"
              >
                <BadgeCheck className="h-4 w-4 text-primary-300" /> RERA {p.rera}
                <ArrowUpRight className="h-3.5 w-3.5 text-primary-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            )}
            {p.configs.length > 0 && <span className="border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur">{p.configs.join(' · ')}</span>}
            {p.startingFrom && (
              <span className="bg-primary-400 px-3.5 py-2 text-navy-950">
                Starting <span className="rupee">₹</span>
                {lakh(p.startingFrom)}*
              </span>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#book-visit"
              data-project={p.slug}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-300 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 shadow-gold"
            >
              Book a site visit <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="#contact" className="inline-flex items-center justify-center gap-2 border border-white/40 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10">
              Enquire now
            </a>
          </div>
        </motion.div>

        {p.stats.length > 0 && (
          <dl className={cn('mt-12 grid grid-cols-2 border-t border-white/15', p.stats.length >= 4 ? 'md:grid-cols-4' : p.stats.length === 3 ? 'md:grid-cols-3' : '')}>
            {p.stats.map(([v, l], i) => (
              <div key={l} className={cn('py-5 pr-4', i % 2 && 'border-l border-white/15 pl-4 md:pl-6', i > 1 && 'border-t border-white/15 md:border-t-0', i === 2 && 'md:border-l md:pl-6', i === 3 && 'md:pl-6')}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-serif text-2xl font-semibold text-white md:text-3xl">{v}</span>
                  <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/60">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function Overview({ p, n }) {
  return (
    <section id="overview" className="section bg-white">
      <div className="container">
        <ChapterHeading numeral={n} label="Overview" title={p.headline || `About ${p.name}`} />
        <div className={cn('grid gap-12', p.highlights.length > 0 && 'lg:grid-cols-[1.2fr_1fr] lg:gap-20')}>
          <Reveal>
            {p.about[0] && <p className="font-serif text-[1.35rem] leading-[1.6] text-navy-950 md:text-[1.6rem]">{p.about[0]}</p>}
            {p.about.slice(1).map((t, i) => (
              <p key={i} className="mt-6 text-[16px] leading-[1.85] text-slate-600">
                {t}
              </p>
            ))}
          </Reveal>
          {p.highlights.length > 0 && (
            <Reveal delay={0.1}>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">Project highlights</p>
              <ul className="mt-4 border-t border-navy-900/10">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-4 border-b border-navy-900/10 py-4 text-[15px] leading-relaxed text-navy-950">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-primary-300">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function Gallery({ p, view, n }) {
  const shots = p.photos;
  return (
    <section id="gallery" className="section relative bg-ivory">
      <div className="container">
        <ChapterHeading numeral={n} label="Gallery" title={`A closer look at ${p.name}`} intro="Tap any photo to view it full screen." />
        <div className="grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[15rem] md:grid-cols-4 md:gap-4">
          {shots.map((x, i) => (
            <motion.button
              key={x.src}
              type="button"
              data-cursor="view"
              onClick={() => view(shots, i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.05 }}
              className={cn('group relative overflow-hidden bg-navy-100 text-left', i === 0 && 'col-span-2 row-span-2')}
              aria-label={`Open photo: ${x.alt}`}
            >
              <img src={x.src} alt={x.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-3 pt-10 font-serif text-[15px] leading-tight text-white sm:p-4 sm:text-lg">{x.alt}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Amenities({ p, n }) {
  return (
    <section id="amenities" className="section relative overflow-hidden bg-navy-950">
      <div aria-hidden className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="container relative">
        <ChapterHeading light numeral={n} label="Amenities" title="Everything you need, close at hand" />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {p.amenities.map((a, i) => (
            <motion.li
              key={a}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className="flex min-h-[6.5rem] flex-col justify-between border border-white/10 bg-white/[0.04] p-4 md:p-5"
            >
              <span className="font-serif text-sm text-primary-300">{String(i + 1).padStart(2, '0')}</span>
              <span className="mt-3 font-serif text-[1.05rem] leading-tight text-white md:text-xl">{a}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Location({ p, n }) {
  return (
    <section id="location" className="section bg-ivory">
      <div className="container">
        <ChapterHeading numeral={n} label="Location" title="Find us" />
        <Reveal className="grid gap-6 border border-navy-900/10 bg-white p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-primary-300">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-2xl text-navy-950">{p.name}</p>
              <p className="mt-1 text-[15.5px] leading-relaxed text-slate-600">{p.address || p.location}</p>
            </div>
          </div>
          {p.mapUrl && (
            <a
              href={p.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-navy-900 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-navy-800"
            >
              <Navigation className="h-4 w-4 text-primary-300" /> Open in Google Maps
            </a>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function Contact({ p }) {
  const project = { ...p, connectText: `Talk to us directly about ${p.name}: prices, availability, loans and site visits.` };
  return (
    <section id="contact" className="section bg-white">
      <div className="container">
        <Reveal className="mb-12 grid gap-6 border-b border-navy-900/10 pb-8 md:mb-16 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">Get in touch</p>
            <h2 className="mt-3 text-[2.2rem] leading-[1.08] text-navy-950 md:text-[3.2rem]">Book your dream home</h2>
          </div>
          <p className="text-[15.5px] leading-[1.8] text-slate-600">Take the first step towards your new home at {p.name}. Our team is ready to help you.</p>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <LeadershipConnect project={project} />
          <Reveal delay={0.1}>
            <ProjectEnquiryForm project={project} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function LiveProjectPage({ slug }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ p: null, status: 'loading' });
  const [view, viewer] = useViewer();

  useEffect(() => {
    let live = true;
    setState({ p: null, status: 'loading' });
    const preview = new URLSearchParams(window.location.search).get('preview') === '1';
    fetch(`/api/public/projects/${encodeURIComponent(slug)}${preview ? '?preview=1' : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => {
        if (!live) return;
        if (!x) return setState({ p: null, status: 'missing' });
        // renamed project: show its new address
        if (x.slug && x.slug !== slug) navigate(projectPath(x.slug) + (preview ? '?preview=1' : ''), { replace: true });
        return setState({ p: toPage(x), status: 'ok' });
      })
      .catch(() => live && setState({ p: null, status: 'missing' }));
    return () => {
      live = false;
    };
  }, [slug, navigate]);

  const p = state.p;
  useDocumentTitle(
    p ? `${p.name}${p.location ? ` · ${p.location}` : ''}` : 'Projects',
    p ? `${p.name}${p.location ? `, ${p.location}` : ''} by ${COMPANY.shortName}: ${p.configs.join(', ')} homes.${p.rera ? ` RERA ${p.rera}.` : ''} Photos, amenities, location and site visits.` : undefined,
  );

  if (state.status === 'missing') return <Navigate to="/projects" replace />;
  if (!p || !p.hero)
    return (
      <section className="min-h-[80svh] bg-navy-950 pt-32">
        <div className="container">
          <span className="block h-4 w-40 animate-pulse bg-white/10" />
          <span className="mt-6 block h-16 w-2/3 animate-pulse bg-white/10" />
        </div>
      </section>
    );

  let k = 0;
  const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const next = () => ROMANS[k++];
  return (
    <>
      {p.preview && (
        <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-primary-400 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-navy-950">
          <Eye className="h-4 w-4" /> Preview: this project is not on the website yet
        </div>
      )}
      <Hero p={p} />
      <Overview p={p} n={next()} />
      {p.photos.length > 1 && <Gallery p={p} view={view} n={next()} />}
      {p.amenities.length > 0 && <Amenities p={p} n={next()} />}
      <EmiCalculator numeral={next()} />
      {(p.address || p.mapUrl) && <Location p={p} n={next()} />}
      <Contact p={p} />
      <CtaSection />
      {viewer}
    </>
  );
}
