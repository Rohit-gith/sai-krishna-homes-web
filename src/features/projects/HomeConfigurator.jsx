import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Bath, BedDouble, Check, Download, Expand, Fence, Ruler, Sparkles } from 'lucide-react';
import { HOMES } from '@/data/homes';
import { COMPANY } from '@/data/companyInfo';
import { whatsappLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

const n = (x) => Math.round(x).toLocaleString('en-IN');
const range = ([a, b], f = n) => (a === b ? f(a) : `${f(a)} – ${f(b)}`);
const lakh = (x) => `${(x / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`;

/**
 * "Choose your home": 1 / 2 / 3 BHK tabs; each shows the floor plan(s) and one clear spec sheet
 * (price, areas, rooms, key features, facilities). Data: src/data/homes.js.
 */
export default function HomeConfigurator({ p, view, onBrochure }) {
  const data = HOMES[p.slug];
  const [tab, setTab] = useState(0);
  const [sub, setSub] = useState(0);
  if (!data) return null;
  const h = data.types[tab];
  const shown = h.plans[sub] || h.plans[0];
  const hasPrice = Boolean(h.price);

  const stats = [
    [BedDouble, 'Bedrooms', h.bedrooms],
    [Bath, 'Toilets', h.toilets],
    [Fence, 'Balconies', h.balconies],
    hasPrice ? [Ruler, 'Carpet area', `${range(h.carpet)} sq ft`] : [Ruler, 'Total area', `${n(h.total)} sq ft`],
  ];

  return (
    <div>
      {/* the three choices */}
      <div className="grid grid-cols-3 border border-navy-900/15 bg-white" role="tablist" aria-label="Home types">
        {data.types.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => {
              setTab(i);
              setSub(0);
            }}
            className={cn(
              'relative px-2 py-4 text-center transition-colors sm:py-5',
              i > 0 && 'border-l border-navy-900/15',
              tab === i ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-ivory',
            )}
          >
            <span className="block font-serif text-[1.45rem] leading-none sm:text-[1.9rem]">{t.label}</span>
            <span className={cn('mt-1.5 block text-[10.5px] font-bold uppercase tracking-[0.14em] sm:text-[11px]', tab === i ? 'text-primary-300' : 'text-slate-500')}>
              {t.price ? `from ₹${lakh(t.price[0])}` : t.total ? `${n(t.total)} sq ft` : ''}
            </span>
            {tab === i && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-primary-400" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={h.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12"
        >
          {/* floor plan (stays in view on desktop while the spec sheet scrolls) */}
          <div className="lg:sticky lg:top-40 lg:self-start">
            <button
              type="button"
              data-cursor="view"
              onClick={() => view(h.plans, sub)}
              className="group relative block w-full border border-navy-900/10 bg-white p-3 sm:p-5"
              aria-label={`Open ${shown.alt} full screen`}
            >
              <img src={shown.src} alt={shown.alt} loading="lazy" className="mx-auto max-h-[28rem] w-full object-contain" />
              <span className="absolute right-3 top-3 flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                <Expand className="h-3.5 w-3.5" /> Zoom
              </span>
            </button>
            {h.plans.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {h.plans.map((pl, i) => (
                  <button
                    key={pl.src}
                    type="button"
                    onClick={() => setSub(i)}
                    aria-pressed={sub === i}
                    className={cn(
                      'border px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.12em] transition-colors',
                      sub === i ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 bg-white text-navy-900 hover:border-primary-400',
                    )}
                  >
                    {pl.label}
                  </button>
                ))}
              </div>
            )}
            {h.plans.length === 1 && <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-500">{shown.label}</p>}
          </div>

          {/* spec sheet */}
          <div className="border border-navy-900/10 bg-white">
            <div className="border-b border-navy-900/10 p-5 sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-700">{h.label} at {p.name}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{h.tagline}</p>
              <p className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.24em] text-slate-500">Price</p>
              <p className="mt-1 font-serif text-[2rem] leading-tight text-navy-950">
                {hasPrice ? (
                  <>
                    <span className="rupee">₹</span>
                    {lakh(h.price[0])}
                    {h.price[1] !== h.price[0] && (
                      <>
                        {' – '}
                        <span className="rupee">₹</span>
                        {lakh(h.price[1])}
                      </>
                    )}
                  </>
                ) : (
                  'On request'
                )}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{data.priceNote}</p>
            </div>

            <dl className="grid grid-cols-2 border-b border-navy-900/10">
              {stats.map(([Icon, label, value], i) => (
                <div key={label} className={cn('flex items-start gap-3 p-4 sm:p-5', i % 2 === 0 && 'border-r border-navy-900/10', i > 1 && 'border-t border-navy-900/10')}>
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.6} />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</dt>
                    <dd className="mt-1 font-serif text-[1.2rem] leading-tight text-navy-950">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {hasPrice && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-navy-900/10 p-5 text-[13.5px] sm:p-7">
                <dt className="text-slate-500">Balcony area</dt>
                <dd className="text-right font-semibold text-navy-950">{range(h.balcony)} sq ft</dd>
                <dt className="text-slate-500">Super built-up</dt>
                <dd className="text-right font-semibold text-navy-950">{range(h.sbu)} sq ft</dd>
                <dt className="text-slate-500">Available in</dt>
                <dd className="text-right font-semibold text-navy-950">Block {h.blocks.join(', ')}</dd>
              </dl>
            )}

            <div className="border-b border-navy-900/10 p-5 sm:p-7">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-slate-500">Rooms</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {h.rooms.map((r) => (
                  <li key={r} className="border border-navy-900/12 bg-ivory px-3 py-1.5 text-[13px] font-medium text-navy-950">
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-primary-600" /> Key features
              </p>
              <ul className="mt-3 space-y-2.5">
                {data.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] leading-snug text-navy-950">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.24em] text-slate-500">Facilities you get</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-slate-700">
                {data.facilities.map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> {f}
                  </li>
                ))}
                <li>
                  <a href="#amenities" className="font-semibold text-primary-700 underline-offset-4 hover:underline">
                    All amenities ↓
                  </a>
                </li>
              </ul>
            </div>

            <div className="grid gap-px bg-navy-900/10 sm:grid-cols-2">
              <a
                href={whatsappLink(`Hello ${COMPANY.shortName}, please share the price and availability of the ${h.label} at ${p.name}.`)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between bg-navy-900 px-5 py-4 text-[11.5px] font-bold uppercase tracking-[0.16em] text-white hover:bg-navy-800"
              >
                Get {h.label} details <ArrowUpRight className="h-4 w-4 text-primary-300" />
              </a>
              <button
                type="button"
                onClick={onBrochure}
                className="flex items-center justify-between bg-white px-5 py-4 text-[11.5px] font-bold uppercase tracking-[0.16em] text-navy-900 hover:bg-ivory"
              >
                Brochure <Download className="h-4 w-4 text-primary-600" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
