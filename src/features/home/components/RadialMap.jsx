import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  Building2,
  Bus,
  GraduationCap,
  Hospital,
  Landmark,
  Navigation,
  Plane,
  School,
  ShoppingBag,
  TrainFront,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const ICONS = { Airport: Plane, Railway: TrainFront, College: GraduationCap, Institute: GraduationCap, School, Hospital, RBI: Landmark, 'IT hub': Building2, Mall: ShoppingBag, Bus };

/* Stage (SVG units) */
const W = 1200;
const H = 760;
const CX = 600;
const CY = 380;
const RX = 470;
const RY = 290;

const rad = Math.PI / 180;
function bearing([lat1, lng1], [lat2, lng2]) {
  const f1 = lat1 * rad;
  const f2 = lat2 * rad;
  const dl = (lng2 - lng1) * rad;
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return (Math.atan2(y, x) / rad + 360) % 360;
}
/** Keep the real direction order but space the cards evenly enough that none overlap. */
function spread(items, gap) {
  const a = [...items].sort((p, q) => p.b - q.b);
  for (let it = 0; it < 200; it++) {
    let moved = false;
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length;
      let d = a[j].b - a[i].b;
      if (j === 0) d += 360;
      if (d < gap) {
        a[i].b -= (gap - d) / 2;
        a[j].b += (gap - d) / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return a.map((p) => ({ ...p, b: (p.b + 360) % 360 }));
}
const xy = (b, r) => [CX + RX * r * Math.sin(b * rad), CY - RY * r * Math.cos(b * rad)];

function Vehicle({ m }) {
  if (m === 'air')
    return <path transform="scale(1.4)" d="M16 0 L-4 -2.4 L-10 -13 L-14 -13 L-9.5 -2 L-13.5 -1.6 L-16.5 -6 L-19 -6 L-17 0 L-19 6 L-16.5 6 L-13.5 1.6 L-9.5 2 L-14 13 L-10 13 L-4 2.4 Z" fill="#FFE7AE" stroke="#0b2a22" strokeWidth="1" />;
  if (m === 'rail')
    return (
      <g transform="scale(1.3)" fill="#FFE7AE" stroke="#0b2a22" strokeWidth="1">
        <rect x="-31" y="-5.5" width="14" height="11" rx="2.5" />
        <rect x="-15" y="-5.5" width="14" height="11" rx="2.5" />
        <path d="M1 -5.5 h10 a6 5.5 0 0 1 0 11 h-10 z" />
      </g>
    );
  return (
    <g transform="scale(1.3)">
      <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#FFE7AE" stroke="#0b2a22" strokeWidth="1" />
      <rect x="2" y="-4.5" width="5" height="9" rx="1.2" fill="#0b2a22" opacity="0.55" />
    </g>
  );
}

/**
 * Location diagram: the residency in the centre, each facility as a labelled photo card in its
 * real compass direction (spaced so nothing overlaps), nearer = closer to the centre, and a
 * plane / train / car running out to each one.
 */
export default function RadialMap({ origin, projectInfo, places, activeName, onPick }) {
  const reduce = useReducedMotion();
  const items = useMemo(() => {
    const list = places.filter((p) => p.mins != null);
    const maxM = Math.max(...list.map((p) => p.mins));
    const withB = list.map((p, i) => ({
      ...p,
      i,
      m: p.cat === 'Airport' ? 'air' : p.cat === 'Railway' ? 'rail' : 'road',
      b: origin && p.at ? bearing(origin, p.at) : (360 / list.length) * i,
      r: 0.62 + 0.38 * Math.sqrt(p.mins / maxM),
    }));
    return spread(withB, 360 / list.length).map((p) => {
      const [x, y] = xy(p.b, p.r);
      const d = p.m === 'air' ? `M${CX} ${CY} Q${(CX + x) / 2 + 60} ${(CY + y) / 2 - 60} ${x} ${y}` : `M${CX} ${CY} L${x} ${y}`;
      return { ...p, x, y, d };
    });
  }, [places, origin]);

  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="rm-plate" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#1f5144" />
            <stop offset="70%" stopColor="#0e2f26" />
            <stop offset="100%" stopColor="#081c16" />
          </radialGradient>
          <filter id="rm-soft">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <ellipse cx={CX} cy={CY + 30} rx={RX + 60} ry={RY + 50} fill="#000" opacity="0.45" filter="url(#rm-soft)" />
        <ellipse cx={CX} cy={CY + 12} rx={RX + 70} ry={RY + 60} fill="#05130e" />
        <ellipse cx={CX} cy={CY} rx={RX + 70} ry={RY + 60} fill="url(#rm-plate)" stroke="rgba(212,166,74,0.45)" strokeWidth="1.5" />
        {[0.45, 0.72, 1].map((k) => (
          <ellipse key={k} cx={CX} cy={CY} rx={RX * k} ry={RY * k} fill="none" stroke="rgba(212,166,74,0.16)" strokeDasharray="4 9" />
        ))}
        {origin && (
          <g transform={`translate(${CX} ${CY - RY - 38})`}>
            <path d="M0 -11 L6 4 L0 0.5 L-6 4 Z" fill="#d4a64a" />
            <text y="18" fill="rgba(246,223,166,0.85)" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="Manrope, sans-serif">N</text>
          </g>
        )}
        {items.map((p) => {
          const on = p.name === activeName;
          return (
            <path
              key={p.name}
              id={`rm-${p.i}`}
              d={p.d}
              fill="none"
              stroke={on ? '#E8C06A' : 'rgba(232,192,106,0.38)'}
              strokeWidth={on ? 3.5 : 2}
              strokeDasharray={p.m === 'air' ? '3 9' : p.m === 'rail' ? '12 5' : on ? 'none' : '7 7'}
              strokeLinecap="round"
              style={{ transition: 'stroke .4s, stroke-width .4s' }}
            />
          );
        })}
        {!reduce &&
          items.map((p) => (
            <g key={`v-${p.name}`}>
              <Vehicle m={p.m} />
              <animateMotion dur={`${3.2 + p.mins / 14}s`} begin={`${(p.i * 0.6) % 4}s`} repeatCount="indefinite" rotate="auto" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines="0.45 0 0.25 1">
                <mpath href={`#rm-${p.i}`} />
              </animateMotion>
            </g>
          ))}
      </svg>

      {/* place cards: photo + name + time, always visible */}
      {items.map((p) => {
        const Icon = ICONS[p.cat] || Navigation;
        const on = p.name === activeName;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => onPick?.(p)}
            onMouseEnter={() => onPick?.(p, true)}
            aria-label={`${p.name}, just ${p.mins} min`}
            className={cn('group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300', on ? 'z-[3] scale-110' : 'z-[2] hover:z-[3] hover:scale-105')}
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
          >
            <span className={cn('flex w-[2.6rem] flex-col items-center overflow-hidden rounded-full border bg-[#0b221b] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.9)] sm:w-[7rem] sm:rounded-xl lg:w-[8.5rem]', on ? 'border-primary-300 ring-4 ring-primary-400/30' : 'border-white/25')}>
              <span className="relative block aspect-square w-full bg-navy-900 sm:aspect-[4/3]">
                {p.photo ? <img src={`/images/nearby/${p.photo}.webp`} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
                <span className="absolute left-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/55 text-primary-200 sm:flex sm:h-6 sm:w-6">
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </span>
              </span>
              <span className="hidden w-full px-2 py-1.5 text-center sm:block">
                <span className="hidden truncate text-[11.5px] font-semibold leading-tight text-white sm:block lg:text-[12.5px]">{p.name}</span>
                <span className={cn('block text-[10px] font-bold sm:text-[11.5px]', on ? 'text-primary-200' : 'text-primary-300')}>Just {p.mins} min</span>
              </span>
            </span>
            <span className={cn('absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[9px] font-bold sm:hidden', on ? 'bg-primary-400 text-navy-950' : 'bg-black/65 text-primary-200')}>
              {p.mins} min
            </span>
          </button>
        );
      })}

      {/* the residency */}
      <div className="pointer-events-none absolute z-[4] -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${(CX / W) * 100}%`, top: `${(CY / H) * 100}%` }}>
        <span className="relative mx-auto block h-14 w-14 sm:h-32 sm:w-32 lg:h-40 lg:w-40">
          {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-primary-400/25 [animation-duration:2.8s]" />}
          <span className="absolute -inset-2 rounded-full border border-primary-300/40" />
          <span className="relative block h-full w-full overflow-hidden rounded-full border-4 border-primary-300 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9)]">
            <img src={projectInfo.photo} alt={projectInfo.name} className="h-full w-full object-cover" />
          </span>
        </span>
        <span className="mt-2 inline-block whitespace-nowrap rounded-full bg-primary-400 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-navy-950 shadow-lg sm:text-[12px] sm:tracking-[0.16em]">
          {projectInfo.name}
        </span>
      </div>
    </div>
  );
}
