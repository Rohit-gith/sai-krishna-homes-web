import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Calculator, X } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import Reveal from '@/components/common/Reveal';
import { whatsappLink } from '@/utils/whatsapp';

const R = <span className="rupee">₹</span>;
const inr = (n) => (
  <>
    {R}
    {Math.round(n).toLocaleString('en-IN')}
  </>
);
const lakh = (n) => (
  <>
    {R}
    {n >= 1e7 ? `${(n / 1e7).toFixed(2)} Cr` : `${(n / 1e5).toFixed(1)} L`}
  </>
);
/** Plain-text version for the WhatsApp message. */
const lakhText = (n) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`);

/** Standard reducing-balance EMI. */
function emi(principal, annualRate, years) {
  const n = years * 12;
  const r = annualRate / 12 / 100;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  const f = (1 + r) ** n;
  return (principal * r * f) / (f - 1);
}

function Field({ label, value, display, min, max, step, onChange, id }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="border-b border-navy-900/10 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500"
        >
          {label}
        </label>
        <span className="font-serif text-xl font-semibold text-navy-950">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-gold mt-4 w-full"
        style={{ '--pct': `${pct}%` }}
      />
    </div>
  );
}

/** The calculator itself (sliders + result card). Used by the section below and by the pop-up. */
export function EmiPanel({ compact = false }) {
  const [price, setPrice] = useState(4500000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const { loan, monthly, interest } = useMemo(() => {
    const l = price * (1 - downPct / 100);
    const m = emi(l, rate, years);
    return { loan: l, monthly: m, interest: m * years * 12 - l };
  }, [price, downPct, rate, years]);

  const principalShare = loan + interest > 0 ? (loan / (loan + interest)) * 100 : 0;

  return (
        <div className={compact ? 'grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-10' : 'grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16'}>
          <Reveal>
            <Field
              id="emi-price"
              label="Home price"
              value={price}
              display={lakh(price)}
              min={1500000}
              max={15000000}
              step={100000}
              onChange={setPrice}
            />
            <Field
              id="emi-down"
              label="Down payment"
              value={downPct}
              display={
                <>
                  {downPct}% · {lakh((price * downPct) / 100)}
                </>
              }
              min={10}
              max={60}
              step={5}
              onChange={setDownPct}
            />
            <Field
              id="emi-rate"
              label="Interest rate (p.a.)"
              value={rate}
              display={`${rate.toFixed(2)}%`}
              min={6.5}
              max={12}
              step={0.05}
              onChange={setRate}
            />
            <Field
              id="emi-years"
              label="Loan tenure"
              value={years}
              display={`${years} years`}
              min={5}
              max={30}
              step={1}
              onChange={setYears}
            />
          </Reveal>

          <Reveal delay={0.1} className={`flex flex-col bg-navy-950 p-7 text-white sm:p-10 ${compact ? 'order-first md:order-none' : ''}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">
              Your monthly EMI
            </p>
            <p
              className="mt-3 font-serif text-[2.8rem] font-semibold leading-none sm:text-6xl"
              aria-live="polite"
            >
              {inr(monthly)}
            </p>

            {/* Principal vs interest bar */}
            <div className="mt-8 h-2 w-full overflow-hidden bg-white/15">
              <div
                className="h-full bg-primary-400 transition-[width] duration-500"
                style={{ width: `${principalShare}%` }}
              />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-5 text-sm">
              <div>
                <dt className="flex items-center gap-2 text-white/60">
                  <span className="h-2 w-2 bg-primary-400" /> Loan amount
                </dt>
                <dd className="mt-1 font-serif text-xl text-white">{lakh(loan)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-white/60">
                  <span className="h-2 w-2 bg-white/30" /> Total interest
                </dt>
                <dd className="mt-1 font-serif text-xl text-white">{lakh(interest)}</dd>
              </div>
            </dl>

            <a
              href={whatsappLink(
                `Hello Sai Krishna Homes, I'm planning a home of about ${lakhText(price)} with ${downPct}% down payment over ${years} years. Please share prices and home-loan options.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="group mt-10 flex items-center justify-between bg-ivory px-6 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 transition-colors hover:bg-primary-200 lg:mt-auto"
            >
              Get exact price & loan help
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <p className="mt-4 text-[11.5px] leading-relaxed text-white/45">
              Indicative only. Actual EMI depends on the final price, your bank's rate and
              eligibility.
            </p>
          </Reveal>
        </div>
  );
}

/** Full EMI section (project pages, Explore chapter). */
export default function EmiCalculator({ numeral = '✦' } = {}) {
  return (
    <section id="emi" className="section scroll-mt-24 bg-ivory">
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label="Plan your purchase"
          title="Estimate your monthly EMI"
          intro="Move the sliders to see what owning a Sai Krishna home could cost each month. Ask us for exact prices and our partner-bank offers."
        />
        <EmiPanel />
      </div>
    </section>
  );
}

/** The calculator in a pop-up window, opened from a button. */
export function EmiModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-navy-950/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="emi-modal-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto bg-ivory px-5 pb-7 pt-6 shadow-2xl sm:px-10 sm:pb-10 sm:pt-9"
          >
            <div className="mb-2 flex items-start justify-between gap-4 border-b border-navy-900/10 pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary-700">Plan your purchase</p>
                <h2 id="emi-modal-title" className="mt-2 text-[1.8rem] leading-tight text-navy-950 sm:text-[2.4rem]">
                  Estimate your monthly EMI
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close EMI calculator"
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-navy-900/15 text-navy-950 hover:border-primary-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <EmiPanel compact />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Search-bar style button that opens the EMI pop-up. */
export function EmiButton({ className = '' }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group flex w-full max-w-md items-center gap-4 border border-primary-300/40 bg-white/[0.06] py-2.5 pl-2.5 pr-5 text-left text-white backdrop-blur transition-colors hover:border-primary-300 hover:bg-white/[0.1] ${className}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary-400 text-navy-950">
          <Calculator className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[10.5px] font-bold uppercase tracking-[0.28em] text-primary-300">EMI calculator</span>
          <span className="mt-0.5 block text-[14.5px] text-white/80">What will my monthly instalment be?</span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-primary-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
      <EmiModal open={open} onClose={close} />
    </>
  );
}
