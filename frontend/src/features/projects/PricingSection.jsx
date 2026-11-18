import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Download, FileText, Info } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { startingPrices } from '@/data/pricing';
import { cn } from '@/utils/cn';

const lakh = (n) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(2).replace(/\.00$/, '')} L`);
const sqft = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

function Starting({ table }) {
  const s = startingPrices(table);
  return (
    <div className="grid grid-cols-3 gap-px border border-navy-900/10 bg-navy-900/10">
      {Object.entries(s).map(([type, price]) => (
        <div key={type} className="bg-white p-4 sm:p-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-500">{type} from</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-navy-950 sm:text-4xl">
            <span className="rupee">₹</span>
            {lakh(price).slice(1)}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Panchawati: block-wise price list with type filter. */
function PriceList({ project, table, onEnquire }) {
  const [block, setBlock] = useState(0);
  const [type, setType] = useState('All');
  const types = useMemo(() => ['All', ...new Set(table.blocks.flatMap((b) => b.rows.map((r) => r.type)))].sort(), [table]);
  const rows = table.blocks[block].rows.filter((r) => type === 'All' || r.type === type).slice().sort((a, b) => a.price - b.price);

  return (
    <>
      <Starting table={table} />

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Blocks">
          {table.blocks.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={block === i}
              onClick={() => setBlock(i)}
              className={cn('border px-5 py-3 font-serif text-lg transition-colors', block === i ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 bg-white text-navy-900 hover:border-primary-400')}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.2em]">
          {types.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t} className={cn('relative border-b-2 pb-1 before:absolute before:-inset-3 before:content-[""]', type === t ? 'border-primary-500 text-navy-950' : 'border-transparent text-navy-900/50 hover:text-navy-950')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${block}-${type}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-6">
          {/* Desktop table */}
          <table className="hidden w-full border-collapse text-left md:table">
            <thead>
              <tr className="border-b-2 border-navy-900 text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <th className="py-3 pr-4">Flat no.</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4 text-right">Carpet</th>
                <th className="py-3 pr-4 text-right">Balcony</th>
                <th className="py-3 pr-4 text-right">SBU area</th>
                <th className="py-3 pr-4 text-right">Price</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.flats} className="group border-b border-navy-900/10 transition-colors hover:bg-ivory">
                  <td className="py-4 pr-4 font-semibold text-navy-950">{r.flats}</td>
                  <td className="py-4 pr-4"><span className="border border-primary-300 px-2.5 py-1 text-[12px] font-bold text-navy-900">{r.type}</span></td>
                  <td className="py-4 pr-4 text-right text-slate-600">{sqft(r.carpet)} sq ft</td>
                  <td className="py-4 pr-4 text-right text-slate-600">{sqft(r.balcony)} sq ft</td>
                  <td className="py-4 pr-4 text-right text-slate-600">{sqft(r.sbu)} sq ft</td>
                  <td className="py-4 pr-4 text-right font-serif text-xl font-semibold text-navy-950"><span className="rupee">₹</span>{lakh(r.price).slice(1)}</td>
                  <td className="py-4 text-right">
                    <button type="button" onClick={() => onEnquire(r)} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700 opacity-60 transition-opacity hover:text-navy-950 group-hover:opacity-100">
                      Enquire <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phone cards */}
          <ul className="grid gap-3 md:hidden">
            {rows.map((r) => (
              <li key={r.flats} className="border border-navy-900/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-500">Flat {r.flats}</p>
                    <p className="mt-1 font-serif text-xl text-navy-950">{r.type}</p>
                  </div>
                  <p className="font-serif text-2xl font-semibold text-navy-950"><span className="rupee">₹</span>{lakh(r.price).slice(1)}</p>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-navy-900/10 pt-3 text-[12.5px]">
                  {[['Carpet', r.carpet], ['Balcony', r.balcony], ['SBU', r.sbu]].map(([k, v]) => (
                    <div key={k}><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-navy-950">{sqft(v)} sq ft</dd></div>
                  ))}
                </dl>
                <button type="button" onClick={() => onEnquire(r)} className="mt-3 w-full border border-navy-900/15 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-navy-900">
                  Enquire about this home
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      <ul className="mt-8 grid gap-2 text-[13.5px] leading-relaxed text-slate-600 md:grid-cols-2">
        {[...table.notes, `All prices as per the official ${project.name} price list. Availability of a particular flat to be confirmed with our sales team.`].map((n) => (
          <li key={n} className="flex gap-2.5"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> {n}</li>
        ))}
      </ul>
    </>
  );
}

/** Sai Krishna Residency: Phase-I complex-wise carpet / built-up areas. */
function AreaStatement({ data }) {
  return (
    <>
      <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.25em] text-primary-700">{data.location}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.complexes.map((c, i) => {
          const perFloor = c.units.reduce((s, x) => s + x.count, 0);
          return (
            <Reveal key={c.name} delay={(i % 3) * 0.05} className="border border-navy-900/10 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl text-navy-950">{c.name}</p>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">{c.type}</p>
                </div>
                <p className="text-right text-[12px] leading-tight text-slate-500">
                  <span className="block font-serif text-2xl text-navy-950">{perFloor * c.floors}</span>units
                </p>
              </div>
              <ul className="mt-4 space-y-2 border-t border-navy-900/10 pt-3 text-[13px]">
                {c.units.map((x) => (
                  <li key={x.carpet} className="flex justify-between gap-3">
                    <span className="text-slate-500">{x.count} per floor</span>
                    <span className="text-right font-semibold text-navy-950">
                      {sqft(x.carpet)} <span className="font-normal text-slate-500">carpet</span> · {sqft(x.bu)} <span className="font-normal text-slate-500">BU</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] text-slate-400">{c.floors} floors · areas in sq ft</p>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-8 flex gap-2.5 text-[13.5px] text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Prices for Sai Krishna Residency are shared on request. Tap below and our team will send the latest price list.
      </p>
    </>
  );
}

export default function PricingSection({ project, numeral, onBrochure, onEnquire }) {
  const isPrice = !!project.priceList;
  return (
    <section id="pricing" className="section relative scroll-mt-24 bg-ivory">
      <div className="container relative">
        <ChapterHeading
          numeral={numeral}
          label={isPrice ? 'Price list' : 'Area statement'}
          title={isPrice ? 'Transparent pricing, flat by flat' : 'Every complex, every carpet area'}
          intro={isPrice ? 'Carpet, balcony and super built-up areas with the all-inclusive price for every flat type.' : 'Phase-I carpet and built-up areas for each residential complex in the township.'}
        />
        {isPrice ? <PriceList project={project} table={project.priceList} onEnquire={onEnquire} /> : <AreaStatement data={project.areaStatement} />}

        {/* Downloads */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {project.brochure && (
            <button type="button" onClick={onBrochure} className="group flex items-center gap-5 border border-navy-900/10 bg-white p-4 text-left hover:border-primary-400">
              <img src={project.brochureCover} alt="" loading="lazy" className="h-24 w-20 shrink-0 object-cover shadow-md" />
              <span className="flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700">Brochure · PDF · {project.brochureSize}</span>
                <span className="mt-1 block font-serif text-xl text-navy-950">Download the {project.name} brochure</span>
              </span>
              <Download className="h-5 w-5 shrink-0 text-primary-600 transition-transform group-hover:translate-y-0.5" />
            </button>
          )}
          {project.extraDownloads?.map((d) => (
            <a key={d.href} href={d.href} target="_blank" rel="noreferrer" className="group flex items-center gap-5 border border-navy-900/10 bg-white p-4 hover:border-primary-400">
              <span className="flex h-24 w-20 shrink-0 items-center justify-center bg-navy-900 text-primary-300"><FileText className="h-8 w-8" /></span>
              <span className="flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700">PDF · {d.size}</span>
                <span className="mt-1 block font-serif text-xl text-navy-950">{d.label}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-primary-600" />
            </a>
          ))}
          {!isPrice && (
            <button type="button" onClick={() => onEnquire(null)} className="flex items-center justify-between gap-4 bg-navy-900 p-6 text-left text-white hover:bg-navy-800 md:col-span-2">
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">Price on request</span>
                <span className="mt-1 block font-serif text-2xl">Get the Sai Krishna Residency price list</span>
              </span>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-primary-300" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
