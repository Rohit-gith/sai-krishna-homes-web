import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RotateCw } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { HOME_TYPES, responsive } from '@/data/projects';
import { whatsappLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

/** Architect's-sheet presentation of the tower types: blueprint grid, crop-marked photo, spec table. */
export default function HomeTypes({ numeral = 'III' } = {}) {
  const [typeIdx, setTypeIdx] = useState(0);
  const [viewIdx, setViewIdx] = useState(0);
  const type = HOME_TYPES[typeIdx];
  const view = type.views[viewIdx];

  const specs = [
    ['Project', type.project],
    ['Tower', type.label],
    ['Configuration', type.config],
    ['Parking', 'Covered stilt parking'],
    ['Floor plan & area', 'Shared on request'],
  ];

  return (
    <section id="homes" className="section relative scroll-mt-24 bg-ivory">
      <div aria-hidden className="bg-blueprint pointer-events-none absolute inset-0" />
      <div className="container relative">
        <ChapterHeading
          numeral={numeral}
          label="The homes"
          title="Find the home that fits your family"
          intro="Explore the tower types at Sai Krishna Residency, then ask us for detailed floor plans and current prices."
        />

        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-20">
          {/* Crop-marked drawing */}
          <Reveal className="crop-marks mx-3.5">
            <div className="relative aspect-[16/11] overflow-hidden bg-white">
              <AnimatePresence initial={false}>
                <motion.img
                  key={view.src}
                  {...responsive(view, '(min-width: 1024px) 55vw, 100vw')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </AnimatePresence>
            </div>
            <div className="mt-5 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.25em] text-navy-900/60">
              <span>
                Fig. {typeIdx + 1}.{viewIdx + 1} · {type.label} · {view.name} elevation
              </span>
              <span className="flex gap-4">
                {type.views.map((v, i) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setViewIdx(i)}
                    aria-pressed={viewIdx === i}
                    className={cn(
                      'relative border-b-2 pb-1 transition-colors before:absolute before:-inset-x-3 before:-inset-y-3 before:content-[""]',
                      viewIdx === i ? 'border-primary-500 text-navy-950' : 'border-transparent hover:text-navy-950',
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </span>
            </div>
          </Reveal>

          {/* Spec sheet */}
          <Reveal delay={0.1}>
            <div className="flex gap-8 border-b border-navy-900/15" role="tablist" aria-label="Home types">
              {HOME_TYPES.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={typeIdx === i}
                  onClick={() => {
                    setTypeIdx(i);
                    setViewIdx(0);
                  }}
                  className={cn(
                    '-mb-px border-b-2 pb-4 text-left transition-colors',
                    typeIdx === i ? 'border-primary-500' : 'border-transparent opacity-50 hover:opacity-100',
                  )}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary-700">{t.label}</span>
                  <span className="mt-1 block font-serif text-4xl font-semibold text-navy-950">{t.config}</span>
                </button>
              ))}
            </div>

            <dl className="mt-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-6 border-b border-navy-900/10 py-4">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{k}</dt>
                  <dd className="text-right text-[15px] font-semibold text-navy-950">{v}</dd>
                </div>
              ))}
            </dl>

            <a
              href={whatsappLink(
                `Hello Sai Krishna Homes, please share the floor plan, carpet area and price for the ${type.label} (${type.config}) at ${type.project}.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="group mt-9 flex items-center justify-between bg-navy-900 px-7 py-5 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy-800"
            >
              Get {type.config} floor plan & price
              <ArrowUpRight className="h-5 w-5 text-primary-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <Link
            to="/explore/virtual-tour"
            className="group flex flex-col gap-4 border border-primary-300 bg-white p-6 transition-colors hover:bg-navy-900 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <span className="flex items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 text-primary-300 transition-colors group-hover:bg-primary-400 group-hover:text-navy-950">
                <RotateCw className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700 group-hover:text-primary-300">360° virtual tour</span>
                <span className="mt-1 block font-serif text-2xl text-navy-950 group-hover:text-white">Step inside a 3 BHK home</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-navy-900 group-hover:text-white">
              Start the tour <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
