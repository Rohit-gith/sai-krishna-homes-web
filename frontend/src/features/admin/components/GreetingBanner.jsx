import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { greetName } from '../access';
import { cn } from '@/utils/cn';

/*
 * Top of the dashboard: "Good morning, Mr. Shashi" with a small, calm sky that follows the time
 * of day where the viewer is (their device's own time zone, anywhere in the world): sunrise +
 * birds in the morning, a high sun in the afternoon, a sunset in the evening, the moon and stars
 * at night. Motion is slow and stops for people who ask their device for reduced motion.
 */

const localHour = () => new Date().getHours();
const phaseOf = (h) =>
  h >= 5 && h < 12
    ? 'morning'
    : h >= 12 && h < 17
      ? 'afternoon'
      : h >= 17 && h < 20
        ? 'evening'
        : 'night';

const PHASE = {
  morning: {
    greeting: 'Good morning',
    sky: 'linear-gradient(115deg, #fff4e3 0%, #fde3c4 38%, #d9ecf6 100%)',
    dark: false,
  },
  afternoon: {
    greeting: 'Good afternoon',
    sky: 'linear-gradient(115deg, #f3f9fd 0%, #dcedf8 45%, #b9dcf2 100%)',
    dark: false,
  },
  evening: {
    greeting: 'Good evening',
    sky: 'linear-gradient(115deg, #2f2b4f 0%, #7c4a6e 48%, #e98a5a 100%)',
    dark: true,
  },
  night: {
    greeting: 'Good evening', // a greeting on arrival; "Good night" is said when leaving
    sky: 'linear-gradient(115deg, #071a22 0%, #0c2a35 55%, #143a48 100%)',
    dark: true,
  },
};

// the viewer's own date (their time zone), written the same way for everyone
const today = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/* ---------- scene pieces (SVG, viewBox 600 × 200) ---------- */

function Sun({ phase, still }) {
  const pos = { morning: [300, 92], afternoon: [305, 60], evening: [300, 146] }[phase];
  const color = phase === 'evening' ? '#f7a35c' : phase === 'morning' ? '#f8b84e' : '#f9c74f';
  const from = phase === 'morning' ? pos[1] + 70 : phase === 'evening' ? pos[1] - 40 : pos[1];
  return (
    <motion.g
      initial={still ? false : { y: from - pos[1] }}
      animate={{ y: 0 }}
      transition={{ duration: 3, ease: 'easeOut' }}
    >
      <motion.circle
        cx={pos[0]}
        cy={pos[1]}
        r="58"
        fill={color}
        opacity="0.18"
        initial={{ r: 58 }} // a starting size, so the glow never renders without one
        animate={still ? undefined : { r: [54, 64, 54] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx={pos[0]} cy={pos[1]} r="40" fill={color} opacity="0.28" />
      <circle cx={pos[0]} cy={pos[1]} r="27" fill={color} />
      {phase === 'afternoon' && (
        <motion.g
          style={{ originX: `${pos[0]}px`, originY: `${pos[1]}px` }}
          animate={still ? undefined : { rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={pos[0] + Math.cos(a) * 36}
                y1={pos[1] + Math.sin(a) * 36}
                x2={pos[0] + Math.cos(a) * 46}
                y2={pos[1] + Math.sin(a) * 46}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </motion.g>
      )}
    </motion.g>
  );
}

function Moon({ still }) {
  return (
    <motion.g
      initial={still ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
    >
      <circle cx="305" cy="64" r="48" fill="#f4ecd2" opacity="0.08" />
      <mask id="crescent">
        <rect width="600" height="200" fill="white" />
        <circle cx="317" cy="56" r="24" fill="black" />
      </mask>
      <circle cx="305" cy="64" r="26" fill="#f6edd0" mask="url(#crescent)" />
    </motion.g>
  );
}

const STARS = [
  [120, 30, 1.4],
  [180, 70, 1],
  [240, 22, 1.6],
  [300, 55, 1.1],
  [350, 18, 1.3],
  [395, 80, 1],
  [420, 35, 1.5],
  [530, 28, 1.2],
  [560, 95, 1.4],
  [585, 50, 1],
  [270, 100, 1.1],
  [520, 120, 1],
  [150, 110, 1.2],
  [440, 120, 1.3],
];
function Stars({ still }) {
  return (
    <g>
      {STARS.map(([x, y, r], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill="#fff"
          initial={{ opacity: 0.7 }}
          animate={still ? undefined : { opacity: [0.25, 0.95, 0.25] }}
          transition={{
            duration: 2.5 + (i % 4),
            repeat: Infinity,
            delay: (i * 0.37) % 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </g>
  );
}

function Cloud({ x, y, s = 1, still, speed = 70, opacity = 0.75 }) {
  return (
    <motion.g
      initial={{ x: 0 }}
      animate={still ? undefined : { x: [0, 40, 0] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut' }}
      opacity={opacity}
    >
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">
        <ellipse cx="0" cy="0" rx="28" ry="11" />
        <ellipse cx="18" cy="-7" rx="18" ry="12" />
        <ellipse cx="-14" cy="-4" rx="14" ry="9" />
      </g>
    </motion.g>
  );
}

function Birds({ still, color }) {
  const birds = [
    [0, 70, 1],
    [26, 60, 0.8],
    [14, 84, 0.7],
  ];
  return (
    <motion.g
      initial={{ x: still ? 330 : -60 }}
      animate={still ? undefined : { x: [-60, 660] }}
      transition={{ duration: 26, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
    >
      {birds.map(([dx, y, s], i) => (
        <motion.path
          key={i}
          d="M0 0 q 6 -6 12 0 q 6 -6 12 0"
          transform={`translate(${dx} ${y}) scale(${s})`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          animate={still ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 1.2 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </motion.g>
  );
}

/** A quiet city line along the bottom: the business, in silhouette. */
function Skyline({ dark }) {
  const fill = dark ? 'rgba(4,16,22,0.55)' : 'rgba(10,44,58,0.10)';
  const towers = [
    [300, 176, 22, 24],
    [326, 158, 18, 42],
    [348, 186, 30, 14],
    [382, 144, 24, 56],
    [410, 171, 20, 29],
    [434, 152, 28, 48],
    [466, 178, 22, 22],
    [492, 134, 26, 66],
    [522, 166, 20, 34],
    [546, 154, 24, 46],
    [574, 176, 26, 24],
  ];
  return (
    <g fill={fill}>
      {towers.map(([x, y, w, h]) => (
        <rect key={x} x={x} y={y} width={w} height={h} rx="1.5" />
      ))}
      <rect x="290" y="196" width="310" height="4" />
    </g>
  );
}

function Scene({ phase, still }) {
  const dark = PHASE[phase].dark;
  return (
    <svg
      viewBox="0 0 600 200"
      preserveAspectRatio="xMaxYMax meet"
      className="h-full w-full"
      aria-hidden="true"
    >
      {phase === 'night' && <Stars still={still} />}
      {phase === 'night' ? <Moon still={still} /> : <Sun phase={phase} still={still} />}
      {phase !== 'night' && (
        <>
          <Cloud x={200} y={56} s={1.1} still={still} opacity={phase === 'evening' ? 0.25 : 0.8} />
          <Cloud
            x={440}
            y={40}
            s={0.8}
            still={still}
            speed={90}
            opacity={phase === 'evening' ? 0.2 : 0.7}
          />
        </>
      )}
      {(phase === 'morning' || phase === 'evening') && (
        <Birds still={still} color={dark ? '#2a1f33' : '#33424a'} />
      )}
      <Skyline dark={dark} />
    </svg>
  );
}

/** children: actions shown on the right (e.g. "Add new lead"). */
export default function GreetingBanner({ subtitle, children }) {
  const user = useAuthStore((s) => s.user);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(() => phaseOf(localHour()));
  const [date, setDate] = useState(today);
  useEffect(() => {
    const t = setInterval(() => {
      setPhase(phaseOf(localHour()));
      setDate(today());
    }, 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const p = PHASE[phase];
  const name = greetName(user);

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl border border-black/5 shadow-[0_20px_50px_-30px_rgba(8,38,32,0.45)]"
      style={{ background: p.sky }}
      aria-label="Welcome"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full opacity-60 sm:w-[70%] sm:opacity-100">
        <Scene phase={phase} still={!!reduce} />
      </div>
      <div className="flex min-h-[10.5rem] flex-col justify-between gap-5 p-5 sm:flex-row sm:items-end sm:p-7">
        <div className="min-w-0">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-[0.18em]',
              p.dark ? 'text-white/70' : 'text-primary-800/80',
            )}
          >
            {date}
          </p>
          <motion.h1
            key={phase}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              'mt-2 font-display text-[1.75rem] font-bold leading-tight sm:text-[2.2rem]',
              p.dark ? 'text-white' : 'text-navy-950',
            )}
          >
            {p.greeting}
            {name ? `, ${name}` : ''}
          </motion.h1>
          <p
            className={cn(
              'mt-1.5 max-w-xl text-sm sm:text-[15px]',
              p.dark ? 'text-white/80' : 'text-slate-600',
            )}
          >
            {subtitle || 'Welcome back. Here is how Sai Krishna Homes is doing today.'}
          </p>
        </div>
        {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
      </div>
    </section>
  );
}
