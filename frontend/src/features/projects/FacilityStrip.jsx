import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Armchair, ArrowUpDown, Baby, BrickWall, Building2, Car, CloudRain, Droplets, Dumbbell, Flame, Flower2, Footprints,
  Landmark, LayoutGrid, MapPin, Phone, PlugZap, Recycle, ShieldCheck, Sparkles, Sun, Trees, Trophy, Users, Waves, Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// first match wins
const ICONS = [
  [/open area/i, Trees],
  [/density/i, LayoutGrid],
  [/society|community/i, Users],
  [/people|centric/i, MapPin],
  [/pool/i, Waves],
  [/water|bore/i, Droplets],
  [/rain/i, CloudRain],
  [/lift/i, ArrowUpDown],
  [/parking|driveway/i, Car],
  [/power|transformer|generator/i, Zap],
  [/wall/i, BrickWall],
  [/gym/i, Dumbbell],
  [/security/i, ShieldCheck],
  [/yoga/i, Flower2],
  [/kid|children/i, Baby],
  [/solar/i, Sun],
  [/^ev\b/i, PlugZap],
  [/jog|reflexology/i, Footprints],
  [/hall/i, Users],
  [/fire/i, Flame],
  [/stp|sewer/i, Recycle],
  [/intercom/i, Phone],
  [/senior|seating/i, Armchair],
  [/elevation/i, Building2],
  [/temple|market/i, Landmark],
  [/green|lawn/i, Trees],
  [/court|basket|badminton/i, Trophy],
];
const iconFor = (name) => ICONS.find(([re]) => re.test(name))?.[1] || Sparkles;

const DWELL = 2600; // ms the highlight rests on each facility
const pad = (n) => String(n).padStart(2, '0');

/**
 * Hero strip with all of a project's facilities in one row; a gold highlight glides from one to the
 * next. Hover or tap a facility to hold it. Long lists scroll inside the strip (never the page).
 * Paused while the strip is off screen.
 */
export default function FacilityStrip({ items = [], label = 'Facilities', className = '' }) {
  const reduce = useReducedMotion();
  const box = useRef(null);
  const row = useRef(null);
  const inView = useInView(box, { amount: 0.3 });
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const running = inView && !hold && !reduce && items.length > 1;

  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => setI((x) => (x + 1) % items.length), DWELL);
    return () => clearTimeout(t);
  }, [i, running, items.length]);

  // keep the highlighted facility in view inside the strip (horizontal scroll of the strip only)
  useEffect(() => {
    const r = row.current;
    const cell = r?.children[i];
    if (!r || !cell || r.scrollWidth <= r.clientWidth) return;
    const left = cell.offsetLeft - (r.clientWidth - cell.offsetWidth) / 2;
    r.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
  }, [i, reduce]);

  if (!items.length) return null;

  return (
    <div
      ref={box}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary-300/35 bg-navy-950/65 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl md:flex md:items-stretch',
        className,
      )}
    >
      {/* label cell */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:w-44 md:shrink-0 md:flex-col md:items-start md:justify-center md:border-b-0 md:border-r md:px-6">
        <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.3em] text-primary-300">
          <span className="h-1.5 w-1.5 rotate-45 bg-primary-300" />
          {label}
        </p>
        <p className="font-serif text-[13px] tabular-nums text-white/60 md:mt-1.5 md:text-[15px]">
          <span className="text-white">{pad(i + 1)}</span> / {pad(items.length)}
        </p>
      </div>

      {/* the facilities */}
      <ul
        ref={row}
        className="flex flex-1 snap-x gap-1 overflow-x-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseLeave={() => setHold(false)}
      >
        {items.map((name, k) => {
          const Icon = iconFor(name);
          const on = k === i;
          return (
            <li key={name} className="relative min-w-[10.5rem] flex-1 snap-start md:min-w-[12.5rem]">
              <button
                type="button"
                onMouseEnter={() => {
                  setI(k);
                  setHold(true);
                }}
                onClick={() => {
                  setI(k);
                  setHold(true);
                }}
                aria-pressed={on}
                className="relative flex h-full w-full items-center gap-3 rounded-xl px-3 py-3 text-left md:px-3.5"
              >
                {on && (
                  // the gold highlight glides between facilities
                  <motion.span
                    layoutId="facility-glow"
                    className="absolute inset-0 rounded-xl border border-primary-300/60 bg-gradient-to-br from-primary-300/25 via-primary-400/10 to-transparent shadow-[0_0_30px_-6px_rgba(232,192,106,0.55)]"
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  >
                    {running && (
                      <motion.span
                        key={`bar-${i}`}
                        className="absolute inset-x-3 bottom-1.5 h-[2px] origin-left rounded-full bg-primary-300"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: DWELL / 1000, ease: 'linear' }}
                      />
                    )}
                  </motion.span>
                )}
                <span
                  className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                    on ? 'border-transparent bg-gradient-to-br from-primary-200 via-primary-400 to-primary-600 text-navy-950 shadow-[0_8px_20px_-6px_rgba(232,192,106,0.8)]' : 'border-primary-300/35 text-primary-300',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className={cn('relative text-[12.5px] font-semibold leading-snug transition-colors duration-300 md:text-[13px]', on ? 'text-white' : 'text-white/70')}>
                  {name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
