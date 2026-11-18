import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarCheck, GraduationCap, Hospital, RotateCcw, ShoppingBag, Sparkles, TrainFront, Users } from 'lucide-react';
import { HOMES } from '@/data/homes';
import { LANDMARKS, COMPARE_PROJECTS } from '@/data/comparison';
import { projectPath } from '@/data/projectPages';
import { cn } from '@/utils/cn';

const ease = [0.22, 1, 0.36, 1];
const lakh = (n) => `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`;

const PEOPLE = [
  { id: 1, label: '1 – 2', sub: 'Just me / a couple', bhk: '1 BHK' },
  { id: 2, label: '3 – 4', sub: 'Small family', bhk: '2 BHK' },
  { id: 3, label: '5 +', sub: 'Big family', bhk: '3 BHK' },
];
const BUDGET = [
  { id: 'a', label: 'Under ₹60 L', max: 6e6 },
  { id: 'b', label: '₹60 L – ₹90 L', max: 9e6 },
  { id: 'c', label: '₹90 L +', max: Infinity },
];
const NEED = [
  { id: 'Education', label: 'Schools', icon: GraduationCap, cats: ['School', 'College', 'Institute'] },
  { id: 'Healthcare', label: 'Hospitals', icon: Hospital, cats: ['Hospital'] },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag, cats: ['Mall'] },
  { id: 'Travel', label: 'Travel', icon: TrainFront, cats: ['Railway', 'Airport', 'Bus'] },
];

function nearest(slug, cats) {
  return [...LANDMARKS[slug]].filter((p) => cats.includes(p.cat) && p.mins != null).sort((a, b) => a.mins - b.mins)[0];
}

/** Pick the best home for the answers, using only real data (price list, Google drive times). */
function recommend(people, budget, need) {
  const bhk = PEOPLE.find((p) => p.id === people).bhk;
  const cap = BUDGET.find((b) => b.id === budget).max;
  const n = NEED.find((x) => x.id === need);
  const pwType = HOMES['panchawati-residency'].types.find((t) => t.label === bhk);
  const pwFits = pwType.price[0] <= cap;
  const near = { pw: nearest('panchawati-residency', n.cats), sk: nearest('sai-krishna-residency', n.cats) };
  // Panchawati wins when it fits the budget; otherwise Sai Krishna (price on request); ties on need decide the rest.
  const pickPw = pwFits || !near.sk || (near.pw && near.pw.mins <= near.sk.mins && pwType.price[0] <= cap * 1.15);
  const slug = pickPw ? 'panchawati-residency' : 'sai-krishna-residency';
  const project = COMPARE_PROJECTS.find((p) => p.slug === slug);
  const type = HOMES[slug].types.find((t) => t.label === bhk);
  return { project, bhk, type, place: pickPw ? near.pw : near.sk, need: n, overBudget: pickPw && !pwFits };
}

function Choice({ on, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'group rounded-2xl border px-5 py-4 text-left transition-all duration-300 hover:-translate-y-0.5',
        on ? 'border-primary-400 bg-primary-400 text-navy-950 shadow-[0_18px_40px_-18px_rgba(212,166,74,0.8)]' : 'border-white/15 bg-white/[0.04] text-white hover:border-primary-300/70',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A one-off burst of gold confetti (celebrates the match). */
function Confetti() {
  const bits = Array.from({ length: 34 }, (_, i) => ({
    i,
    x: (Math.random() - 0.5) * 520,
    y: -160 - Math.random() * 220,
    r: (Math.random() - 0.5) * 540,
    c: ['#E8C06A', '#F6DFA6', '#B88B3E', '#ffffff', '#5fae8f'][i % 5],
    w: 6 + Math.random() * 6,
  }));
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 z-10">
      {bits.map((b) => (
        <motion.span
          key={b.i}
          className="absolute block rounded-[2px]"
          style={{ width: b.w, height: b.w * 0.45, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: [0, b.x], y: [0, b.y, b.y + 520], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 2.2, ease: 'easeOut', times: [0, 0.35, 1] }}
        />
      ))}
    </span>
  );
}

/** "Find your home in 3 taps": people → budget → what matters most → a real recommendation. */
export default function HomeFinder() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [a, setA] = useState({ people: null, budget: null, need: null });
  const pick = (k, v) => {
    setA((x) => ({ ...x, [k]: v }));
    setTimeout(() => setStep((s) => s + 1), 260);
  };
  const res = step === 3 ? recommend(a.people, a.budget, a.need) : null;

  return (
    <section id="home-finder" className="relative scroll-mt-24 overflow-hidden bg-navy-950 py-16 text-white md:py-20">
      <span aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-primary-400/10 blur-3xl" />
      <div className="container relative max-w-4xl">
        <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-primary-300">
          <Sparkles className="h-4 w-4" /> Find your home in 3 taps
        </p>

        {/* progress */}
        <div className="mx-auto mt-6 flex max-w-xs items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-500', step > i ? 'bg-primary-400' : step === i ? 'bg-primary-400/50' : 'bg-white/15')} />
          ))}
        </div>

        <div className="mt-10 min-h-[12rem]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4, ease }}>
                <h2 className="text-center font-serif text-[2rem] leading-tight text-white sm:text-[2.8rem]">Who will live in your new home?</h2>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {PEOPLE.map((p) => (
                    <Choice key={p.id} on={a.people === p.id} onClick={() => pick('people', p.id)} className="text-center">
                      <Users className="mx-auto h-6 w-6 opacity-80" />
                      <span className="mt-2 block font-serif text-[1.8rem] leading-none">{p.label}</span>
                      <span className="mt-1 block text-[13px] opacity-75">{p.sub}</span>
                    </Choice>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4, ease }}>
                <h2 className="text-center font-serif text-[2rem] leading-tight text-white sm:text-[2.8rem]">What is your budget?</h2>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {BUDGET.map((b) => (
                    <Choice key={b.id} on={a.budget === b.id} onClick={() => pick('budget', b.id)} className="text-center">
                      <span className="block font-serif text-[1.5rem] leading-tight">{b.label}</span>
                    </Choice>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4, ease }}>
                <h2 className="text-center font-serif text-[2rem] leading-tight text-white sm:text-[2.8rem]">What matters most nearby?</h2>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {NEED.map((n) => (
                    <Choice key={n.id} on={a.need === n.id} onClick={() => pick('need', n.id)} className="text-center">
                      <n.icon className="mx-auto h-7 w-7" />
                      <span className="mt-2 block text-[15px] font-semibold">{n.label}</span>
                    </Choice>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 3 && res && (
              <motion.div key="res" className="relative" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }}>
                {!reduceMotion && <Confetti />}
                <p className="text-center text-[13px] uppercase tracking-[0.3em] text-primary-300">Your perfect match 🎉</p>
                <div className="mt-5 grid overflow-hidden rounded-3xl border border-primary-400/40 bg-[#0b221b] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] md:grid-cols-[1.1fr_1fr]">
                  <div className="relative min-h-[16rem]">
                    <img src={res.project.photo} alt={res.project.name} className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute bottom-4 left-4 rounded-full bg-primary-400 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-navy-950">{res.bhk}</span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="font-serif text-[1.9rem] leading-tight text-white">{res.project.name}</p>
                    <p className="mt-1 text-[13.5px] text-white/60">{res.project.place}</p>
                    <dl className="mt-6 space-y-3 text-[14.5px]">
                      <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                        <dt className="text-white/60">{res.bhk} price</dt>
                        <dd className="font-semibold text-primary-300">{res.type?.price ? `from ${lakh(res.type.price[0])}` : 'On request'}</dd>
                      </div>
                      {res.place && (
                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                          <dt className="text-white/60">{res.place.name}</dt>
                          <dd className="font-semibold text-primary-300">Just {res.place.mins} min</dd>
                        </div>
                      )}
                    </dl>
                    {res.overBudget && <p className="mt-3 text-[12.5px] text-white/55">A little above your budget: ask us about loan and payment plans.</p>}
                    <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                      <a href="#book-visit" data-project={res.project.slug} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-400 px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-navy-950 hover:bg-primary-300">
                        <CalendarCheck className="h-4 w-4" /> Book a visit
                      </a>
                      <Link to={`${projectPath(res.project.slug)}#floor-plans`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:border-primary-300">
                        See the home <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex justify-center gap-5 text-[12px] font-bold uppercase tracking-[0.16em] text-white/55">
          {step > 0 && step < 3 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                setA({ people: null, budget: null, need: null });
                setStep(0);
              }}
              className="flex items-center gap-1.5 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" /> Start again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
