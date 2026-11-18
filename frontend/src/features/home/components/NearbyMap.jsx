import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Building2,
  Bus,
  ChevronLeft,
  ChevronRight,
  Expand,
  GraduationCap,
  HeartPulse,
  Hospital,
  Landmark,
  Milestone,
  Navigation,
  Plane,
  School,
  ShoppingBag,
  TrainFront,
} from 'lucide-react';
import { routeUrl } from '@/data/comparison';
import { cn } from '@/utils/cn';
import CityMap3D from './CityMap3D';

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
  Mall: ShoppingBag,
};

/* Map geometry (SVG units): a tilted disc for a 3D feel. */
const W = 600;
const H = 520;
const CX = 300;
const CY = 255;
const RX = 250;
const RY = 190;
const R0 = 0.34; // nearest places sit 34% of the way out

const rad = Math.PI / 180;
function bearing([lat1, lng1], [lat2, lng2]) {
  const f1 = lat1 * rad;
  const f2 = lat2 * rad;
  const dl = (lng2 - lng1) * rad;
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

/** Keep places in their real direction order, nudging near-identical directions apart so the dots stay readable. */
function spread(items, minGap) {
  const a = [...items].sort((p, q) => p.b - q.b);
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length;
      let gap = a[j].b - a[i].b;
      if (j === 0) gap += 360;
      if (gap < minGap) {
        const push = (minGap - gap) / 2;
        a[i].b -= push;
        a[j].b += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return a.map((p) => ({ ...p, b: (p.b + 360) % 360 }));
}

const toXY = (b, r) => [CX + RX * r * Math.sin(b * rad), CY - RY * r * Math.cos(b * rad)];
const modeOf = (cat) => (cat === 'Airport' ? 'air' : cat === 'Railway' ? 'rail' : 'road');
const MODE_LABEL = { air: 'By air', rail: 'By rail', road: 'By road' };

/* Top-view vehicles pointing along +x, so rotate="auto" faces them along the route. */
function Glyph({ m }) {
  if (m === 'air')
    return (
      <path
        d="M16 0 L-4 -2.4 L-10 -13 L-14 -13 L-9.5 -2 L-13.5 -1.6 L-16.5 -6 L-19 -6 L-17 0 L-19 6 L-16.5 6 L-13.5 1.6 L-9.5 2 L-14 13 L-10 13 L-4 2.4 Z"
        fill="#F6DFA6"
        stroke="#0b2a22"
        strokeWidth="1"
      />
    );
  if (m === 'rail')
    return (
      <g fill="#F6DFA6" stroke="#0b2a22" strokeWidth="1">
        <rect x="-31" y="-5.5" width="14" height="11" rx="2.5" />
        <rect x="-15" y="-5.5" width="14" height="11" rx="2.5" />
        <path d="M1 -5.5 h10 a6 5.5 0 0 1 0 11 h-10 z" />
      </g>
    );
  return (
    <g>
      <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#F6DFA6" stroke="#0b2a22" strokeWidth="1" />
      <rect x="2" y="-4.5" width="5" height="9" rx="1.2" fill="#0b2a22" opacity="0.55" />
    </g>
  );
}

const howFar = (p) => (p.mins != null ? `Just ${p.mins} min` : 'Route');

/**
 * "Life around you": a clean map (project in the middle, places in their real direction, the
 * chosen place's vehicle travelling there), a large photo of the chosen place, and a photo strip
 * to pick from.
 */
export default function NearbyMap({ projectInfo, places, origin, routes, onOpenPhoto }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const strip = useRef(null);

  const items = useMemo(() => {
    const n = places.length;
    const val = (p) => p.mins ?? (p.km != null ? p.km * 2.6 : 30); // position only; never shown
    const maxV = Math.max(60, ...places.map(val));
    const withB = places.map((p, i) => ({
      ...p,
      i,
      b: origin && p.at ? bearing(origin, p.at) : (360 / n) * i - 60,
      r: R0 + (1 - R0) * Math.sqrt(val(p) / maxV),
    }));
    return spread(withB, Math.min(34, (360 / n) * 0.9))
      .sort((a, b) => a.i - b.i)
      .map((p) => {
        const [x, y] = toXY(p.b, p.r);
        const m = modeOf(p.cat);
        const d = m === 'air' ? `M${CX} ${CY} Q${(CX + x) / 2} ${(CY + y) / 2 - 90} ${x} ${y}` : `M${CX} ${CY} L${x} ${y}`;
        return { ...p, x, y, m, d, maxV };
      });
  }, [places, origin]);

  useEffect(() => {
    setActive(0);
    setTouched(false);
  }, [places]);
  // Auto-play through the places; after the visitor picks one, wait 12 s, then carry on.
  useEffect(() => {
    if (reduce) return undefined;
    const t = setTimeout(
      () => {
        setTouched(false);
        setActive((i) => (i + 1) % items.length);
      },
      touched ? 12000 : 5200,
    );
    return () => clearTimeout(t);
  }, [active, touched, reduce, items.length]);
  // keep the chosen thumbnail in view
  useEffect(() => {
    const el = strip.current?.querySelector(`[data-i="${active}"]`);
    if (el && strip.current) strip.current.scrollTo({ left: el.offsetLeft - strip.current.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const pick = (i) => {
    setTouched(true);
    setActive((i + items.length) % items.length);
  };
  const sel = items[active] || items[0];
  if (!sel) return null;
  const SelIcon = ICONS[sel.cat] || Navigation;
  const ringR = (m) => R0 + (1 - R0) * Math.sqrt(m / sel.maxV);
  const rings = origin ? [15, 30, 60].filter((m) => m <= sel.maxV) : [];
  const travel = 2.2 + Math.min(sel.mins ?? 20, 70) / 22;

  return (
    <div>
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* ---------------- the map: real 3D city map when the project's location is known ---------------- */}
        {origin && routes ? (
          <CityMap3D origin={origin} projectInfo={projectInfo} items={items} routes={routes} activeIndex={active} onPick={pick} howFar={howFar} />
        ) : (
        <div className="relative mx-auto w-full max-w-[36rem]" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <radialGradient id="nm-plate" cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor="#21574a" />
                <stop offset="65%" stopColor="#0f3128" />
                <stop offset="100%" stopColor="#081c16" />
              </radialGradient>
              <radialGradient id="nm-glow">
                <stop offset="0%" stopColor="#d4a64a" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#d4a64a" stopOpacity="0" />
              </radialGradient>
              <filter id="nm-soft">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>
            {/* plate with depth */}
            <ellipse cx={CX} cy={CY + 30} rx={RX + 20} ry={RY + 18} fill="#000" opacity="0.5" filter="url(#nm-soft)" />
            <ellipse cx={CX} cy={CY + 14} rx={RX + 28} ry={RY + 26} fill="#05130e" />
            <ellipse cx={CX} cy={CY} rx={RX + 28} ry={RY + 26} fill="url(#nm-plate)" stroke="rgba(212,166,74,0.45)" strokeWidth="1.5" />
            {Array.from({ length: 12 }).map((_, k) => {
              const [x, y] = toXY(k * 30, 1.1);
              return <line key={k} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" />;
            })}
            {rings.map((m) => (
              <g key={m}>
                <ellipse cx={CX} cy={CY} rx={RX * ringR(m)} ry={RY * ringR(m)} fill="none" stroke="rgba(212,166,74,0.25)" strokeDasharray="3 7" />
                <text
                  x={CX + RX * ringR(m) * Math.sin(118 * rad)}
                  y={CY - RY * ringR(m) * Math.cos(118 * rad) + 4}
                  fill="rgba(246,223,166,0.55)"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="Manrope, sans-serif"
                >
                  {m === 60 ? '1 hr' : `${m} min`}
                </text>
              </g>
            ))}
            {origin && (
              <g transform={`translate(${CX} ${CY - RY - 40})`}>
                <path d="M0 -10 L5 4 L0 0.5 L-5 4 Z" fill="#d4a64a" />
                <text y="17" fill="rgba(246,223,166,0.8)" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Manrope, sans-serif">
                  N
                </text>
              </g>
            )}
            {/* faint routes to every place, the chosen one in gold */}
            {items.map((p) => (
              <path key={p.name} d={p.d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.2" strokeDasharray="3 6" />
            ))}
            <path id="nm-active" d={sel.d} fill="none" stroke="#d4a64a" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={sel.m === 'air' ? '2 6' : sel.m === 'rail' ? '9 4' : 'none'} />
            <circle cx={sel.x} cy={sel.y} r="34" fill="url(#nm-glow)" />
            {/* the chosen place's vehicle, leaving the project for the place */}
            {!reduce && (
              <g key={`veh-${sel.name}`}>
                <Glyph m={sel.m} />
                <animateMotion dur={`${travel}s`} repeatCount="indefinite" rotate="auto" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines="0.45 0 0.25 1">
                  <mpath href="#nm-active" />
                </animateMotion>
              </g>
            )}
          </svg>

          {/* place dots */}
          {items.map((p) => {
            const Icon = ICONS[p.cat] || Navigation;
            const on = p.i === active;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => pick(p.i)}
                aria-pressed={on}
                aria-label={`${p.name}, ${howFar(p)}`}
                title={`${p.name} · ${howFar(p)}`}
                className={cn(
                  'absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-300',
                  on
                    ? 'z-[3] h-10 w-10 border-primary-200 bg-primary-400 text-navy-950 shadow-[0_0_0_6px_rgba(212,166,74,0.25)] sm:h-12 sm:w-12'
                    : 'z-[2] h-7 w-7 border-white/30 bg-[#0b2a22] text-primary-200 hover:border-primary-300 hover:bg-[#123a2f] sm:h-9 sm:w-9',
                )}
                style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
              >
                <Icon className={on ? 'h-5 w-5' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} />
              </button>
            );
          })}
          {/* label of the chosen place, on the map */}
          <span
            className="pointer-events-none absolute z-[4] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#06150f]/90 px-2.5 py-1 text-[10.5px] font-bold text-primary-200 ring-1 ring-primary-400/40 sm:text-[11.5px]"
            style={{ left: `${(sel.x / W) * 100}%`, top: `calc(${(sel.y / H) * 100}% + ${sel.y > CY ? '1.75rem' : '-3.25rem'})` }}
          >
            {howFar(sel)}
          </span>

          {/* the project, in the middle */}
          <div className="pointer-events-none absolute z-[4] -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${(CX / W) * 100}%`, top: `${(CY / H) * 100}%` }}>
            <span className="relative mx-auto block h-20 w-20 sm:h-28 sm:w-28">
              {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-primary-400/25 [animation-duration:2.8s]" />}
              <span className="absolute -inset-2 rounded-full border border-primary-300/35" />
              <span className="relative block h-full w-full overflow-hidden rounded-full border-[3px] border-primary-300 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.85)]">
                <img src={projectInfo.photo} alt={projectInfo.name} className="h-full w-full object-cover" />
              </span>
            </span>
            <span className="mt-2 inline-block whitespace-nowrap rounded-full bg-primary-400 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-navy-950 shadow-lg sm:text-[10.5px]">
              {projectInfo.name}
            </span>
          </div>
        </div>
        )}

        {/* ---------------- the chosen place, large ---------------- */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={sel.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b221b] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]"
            >
              <button
                type="button"
                onClick={() => sel.photo && onOpenPhoto?.(sel)}
                className="group relative block aspect-[16/10] w-full overflow-hidden bg-navy-900"
                aria-label={sel.photo ? `View photo: ${sel.name}` : sel.name}
              >
                {sel.photo ? (
                  <img src={`/images/nearby/${sel.photo}.webp`} alt={sel.name} className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#1e4a3e,#06150f_70%)] text-primary-300">
                    <SelIcon className="h-14 w-14" strokeWidth={1.2} />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-[#04100c] via-[#04100c]/25 to-transparent" />
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  <SelIcon className="h-3.5 w-3.5" /> {sel.cat} · {MODE_LABEL[sel.m]}
                </span>
                {sel.photo && (
                  <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md group-hover:bg-primary-400 group-hover:text-navy-950">
                    <Expand className="h-4 w-4" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-left sm:p-6">
                  <span className="min-w-0">
                    <span className="block font-serif text-[1.5rem] leading-tight text-white sm:text-[2rem]">{sel.name}</span>
                    <span className="mt-1 block text-[13px] text-white/70">From {projectInfo.name}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {sel.mins != null ? (
                      <>
                        <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-primary-200">Just</span>
                        <span className="block font-serif text-[2.8rem] leading-none text-primary-300 sm:text-[3.6rem]">{sel.mins}</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-200">min drive</span>
                      </>
                    ) : sel.km != null ? (
                      <>
                        <span className="block font-serif text-[2.8rem] leading-none text-primary-300 sm:text-[3.6rem]">{sel.km}</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-200">km</span>
                      </>
                    ) : null}
                  </span>
                </span>
              </button>
              <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <span className="whitespace-nowrap text-[13px] text-white/60">Drive time by road</span>
                <span className="flex items-center gap-2">
                  {[-1, 1].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => pick(active + d)}
                      aria-label={d < 0 ? 'Previous place' : 'Next place'}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-primary-300 hover:text-primary-300"
                    >
                      {d < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                  ))}
                  {sel.q && (
                    <a
                      href={routeUrl(projectInfo.mapsQuery, sel.q)}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-400 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-navy-950 hover:bg-primary-300"
                    >
                      Live route <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ---------------- photo strip ---------------- */}
      <div ref={strip} className="-mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((p) => {
          const Icon = ICONS[p.cat] || Navigation;
          const on = p.i === active;
          return (
            <button
              key={p.name}
              data-i={p.i}
              type="button"
              onClick={() => pick(p.i)}
              aria-pressed={on}
              className={cn(
                'group relative w-40 shrink-0 snap-start overflow-hidden rounded-xl border-2 text-left transition-all sm:w-44',
                on ? 'border-primary-400' : 'border-transparent opacity-75 hover:opacity-100',
              )}
            >
              <span className="relative block aspect-[4/3] bg-navy-900">
                {p.photo ? (
                  <img src={`/images/nearby/${p.photo}.webp`} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-primary-300">
                    <Icon className="h-8 w-8" strokeWidth={1.4} />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className={cn('absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold', on ? 'bg-primary-400 text-navy-950' : 'bg-black/55 text-white')}>
                  {howFar(p)}
                </span>
                <span className="absolute inset-x-0 bottom-0 p-2.5">
                  <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary-200">
                    <Icon className="h-3 w-3" /> {p.cat}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-semibold text-white">{p.name}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
