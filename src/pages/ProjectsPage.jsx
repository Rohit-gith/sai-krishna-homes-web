import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, Expand, MapPin } from 'lucide-react';
import Reveal from '@/components/common/Reveal';
import CtaSection from '@/components/common/CtaSection';
import { Lightbox } from '@/features/home/components/GallerySection';
import { PAST_WORK, PROJECT_PAGES, projectPath } from '@/data/projectPages';
import { responsive } from '@/data/projects';
import { COMPANY } from '@/data/companyInfo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';

function CurrentProject({ p, i }) {
  const flip = i % 2 === 1;
  return (
    <Reveal>
      <article className="grid items-center gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
        <Link
          to={projectPath(p.slug)}
          data-cursor="view"
          className={cn('group relative block overflow-hidden bg-navy-100', flip && 'lg:order-2')}
        >
          <img
            {...responsive(p.card, '(min-width: 1024px) 60vw, 100vw')}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105 sm:aspect-[16/10]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 bg-ivory px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-navy-900 sm:left-6 sm:top-6">
            {p.status}
          </span>
          <span className="absolute bottom-4 left-4 flex items-center gap-2 bg-navy-950/70 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur sm:bottom-6 sm:left-6">
            <BadgeCheck className="h-4 w-4 text-primary-300" /> RERA {p.rera}
          </span>
        </Link>

        <div className={cn(flip && 'lg:order-1')}>
          <p className="text-outline-gold font-serif text-6xl leading-none md:text-7xl">0{i + 1}</p>
          <h2 className="mt-4 text-[2.3rem] leading-[1.08] text-navy-950 md:text-[3rem]">{p.name}</h2>
          <p className="mt-2 font-serif text-lg italic text-primary-700">{p.headline}</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-primary-600" /> {p.location}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-px border border-navy-900/10 bg-navy-900/10">
            {p.stats.slice(0, 4).map(([v, l]) => (
              <div key={l} className="bg-white px-4 py-4">
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-serif text-2xl font-semibold text-navy-950">{v}</span>
                  <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-500">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {p.startingFrom && (
              <span className="bg-primary-400 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-navy-950">
                From <span className="rupee">₹</span>
                {(p.startingFrom / 1e5).toFixed(2)} L*
              </span>
            )}
            {p.configs.map((c) => (
              <span key={c} className="border border-primary-300 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-navy-900">
                {c}
              </span>
            ))}
          </div>
          <Link
            to={projectPath(p.slug)}
            className="group mt-8 inline-flex items-center gap-3 bg-navy-900 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy-800"
          >
            Explore the project
            <ArrowUpRight className="h-4 w-4 text-primary-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

function PastWork() {
  const [open, setOpen] = useState(null);
  const items = PAST_WORK.map((x) => ({ ...x, title: x.alt }));
  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback((d) => setOpen((i) => (i + d + items.length) % items.length), [items.length]);
  return (
    <>
      <p className="mb-10 max-w-2xl text-[15.5px] leading-[1.8] text-slate-600">
        A glimpse of the spaces and finishes from our earlier developments. Tap any photo to view it full screen.
      </p>
      <div className="grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[14rem] md:grid-cols-4 md:gap-4">
        {items.map((x, i) => (
          <motion.button
            key={x.src}
            type="button"
            onClick={() => setOpen(i)}
            data-cursor="view"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: (i % 4) * 0.05 }}
            className={cn(
              'group relative overflow-hidden bg-navy-100 text-left',
              i === 0 && 'col-span-2 row-span-2',
              (i === 5 || i === 8) && 'md:col-span-2',
              i === 9 && 'col-span-2',
            )}
            aria-label={`Open photo: ${x.alt}`}
          >
            <img src={i === 0 || i === 9 ? x.src : x.sm} alt={x.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-navy-950/80 to-transparent p-3 pt-10 text-white sm:p-4">
              <span className="font-serif text-[15px] leading-tight sm:text-lg">{x.alt}</span>
              <Expand className="h-4 w-4 shrink-0 opacity-70" />
            </span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>{open !== null && <Lightbox items={items} index={open} onClose={close} onNav={nav} />}</AnimatePresence>
    </>
  );
}

export default function ProjectsPage() {
  useDocumentTitle('Our Projects', 'Current and completed projects by Sai Krishna Homes in Bhubaneswar: Panchawati Residency (Patia) and Sai Krishna Residency (South Bhubaneswar).');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'past' ? 'past' : 'current';

  return (
    <>
      <section className="relative overflow-hidden bg-ivory pt-16 md:pt-[5.75rem]">
        <div aria-hidden className="bg-jaali pointer-events-none absolute -right-20 top-0 h-full w-[24rem] opacity-[0.07]" />
        <div className="container relative pb-12 pt-12 md:pb-16 md:pt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">
            <Link to="/" className="-my-3 py-3 hover:text-navy-950">Home</Link> <span className="px-1.5">/</span> Projects
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h1 className="text-[2.8rem] font-semibold leading-[1.04] text-navy-950 sm:text-[4rem] xl:text-[4.8rem]">
              Addresses by <em className="text-gold-rich font-medium">{COMPANY.shortName}</em>
            </h1>
            <p className="text-[16px] leading-[1.8] text-slate-600">
              Discover homes crafted with precision, blending modern amenities with timeless elegance. Every project is
              RERA registered and built by {COMPANY.name}, since {COMPANY.established}.
            </p>
          </div>

          <div className="mt-12 flex gap-8 border-b border-navy-900/10" role="tablist" aria-label="Projects">
            {[
              ['current', 'Current projects', PROJECT_PAGES.length],
              ['past', 'Past projects', PAST_WORK.length],
            ].map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setParams(id === 'past' ? { tab: 'past' } : {}, { replace: true })}
                className={cn(
                  '-mb-px flex items-baseline gap-2 border-b-2 py-4 font-serif text-xl transition-colors md:text-2xl',
                  tab === id ? 'border-primary-500 text-navy-950' : 'border-transparent text-navy-900/45 hover:text-navy-950',
                )}
              >
                {label}
                <span className="font-sans text-xs font-bold text-primary-600">{String(n).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          {tab === 'current' ? (
            <div className="space-y-24 md:space-y-32">
              {PROJECT_PAGES.map((p, i) => (
                <CurrentProject key={p.slug} p={p} i={i} />
              ))}
            </div>
          ) : (
            <PastWork />
          )}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
