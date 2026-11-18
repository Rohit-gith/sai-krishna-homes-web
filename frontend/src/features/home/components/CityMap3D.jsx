import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CITY_MAP } from '@/data/nearbyRoutes';
import { cn } from '@/utils/cn';

/* Web-Mercator projection onto the styled city map image. */
const merc = (lat) => {
  const r = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2));
};
const M = CITY_MAP;
const toPx = ([lat, lng]) => [
  ((lng - M.west) / (M.east - M.west)) * M.width,
  ((merc(M.north) - merc(lat)) / (merc(M.north) - merc(M.south))) * M.height,
];
const pathOf = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${toPx(p).map((v) => v.toFixed(1)).join(' ')}`).join(' ');
const pct = ([x, y]) => ({ left: `${(x / M.width) * 100}%`, top: `${(y / M.height) * 100}%` });

const TILT = 52; // degrees the map leans back

/* Top-view vehicles pointing along +x (rotate="auto" turns them along the route). */
function Vehicle({ m }) {
  if (m === 'air')
    return (
      <path
        transform="scale(2.1)"
        d="M16 0 L-4 -2.4 L-10 -13 L-14 -13 L-9.5 -2 L-13.5 -1.6 L-16.5 -6 L-19 -6 L-17 0 L-19 6 L-16.5 6 L-13.5 1.6 L-9.5 2 L-14 13 L-10 13 L-4 2.4 Z"
        fill="#FFE7AE"
        stroke="#0b2a22"
        strokeWidth="1"
      />
    );
  if (m === 'rail')
    return (
      <g transform="scale(2)" fill="#FFE7AE" stroke="#0b2a22" strokeWidth="1">
        <rect x="-31" y="-5.5" width="14" height="11" rx="2.5" />
        <rect x="-15" y="-5.5" width="14" height="11" rx="2.5" />
        <path d="M1 -5.5 h10 a6 5.5 0 0 1 0 11 h-10 z" />
      </g>
    );
  return (
    <g transform="scale(2)">
      <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#FFE7AE" stroke="#0b2a22" strokeWidth="1" />
      <rect x="2" y="-4.5" width="5" height="9" rx="1.2" fill="#0b2a22" opacity="0.55" />
    </g>
  );
}

/**
 * Real city map, tilted back for a 3D look. The project and every place stand on it as pins;
 * routes follow the real roads (OpenStreetMap); the chosen place's plane / train / car travels
 * from the project to it.
 */
/**
 * overview: the residency stays in the centre, the whole neighbourhood is framed, and a vehicle
 * leaves the residency for every place at once (the active one is highlighted in gold).
 */
export default function CityMap3D({ origin, projectInfo, items, routes, activeIndex, onPick, howFar, overview = false, ratio = 0.9, className }) {
  const reduce = useReducedMotion();
  const home = toPx(origin);

  const paths = useMemo(
    () =>
      items.map((p) => {
        if (!p.at) return null;
        const end = toPx(p.at);
        if (p.m === 'air') {
          // flight: a smooth arc instead of the road
          const mx = (home[0] + end[0]) / 2 + 120;
          const my = (home[1] + end[1]) / 2;
          return `M${home[0]} ${home[1]} Q${mx} ${my} ${end[0]} ${end[1]}`;
        }
        const road = routes?.[p.name];
        return road ? pathOf(road) : `M${home[0]} ${home[1]} L${end[0]} ${end[1]}`;
      }),
    [items, routes, home],
  );

  // Camera: zoom to the project + the chosen place (never closer than ~6 km across), filling the frame.
  const sel0 = items[activeIndex];
  const view = useMemo(() => {
    if (overview) {
      // residency in the middle; frame the farthest place on each axis
      const far = items.filter((p) => p.at).map((p) => toPx(p.at));
      const sx = Math.max(M.width * (5 / 28), ...far.map((q) => Math.abs(q[0] - home[0]))) * 2;
      const sy = Math.max(M.width * (5 / 28), ...far.map((q) => Math.abs(q[1] - home[1]))) * 2;
      const k = Math.cos((TILT * Math.PI) / 180);
      const scale = Math.max(1.15, Math.min(0.82 / (sx / M.width), (0.7 * ratio) / ((sy / M.width) * k * 1.05)));
      return { cx: (home[0] / M.width) * 100, cy: (home[1] / M.height) * 100, w: scale * 100 };
    }
    const pts = [home];
    if (sel0?.at) pts.push(toPx(sel0.at));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minSpan = M.width * (6 / 28); // the map is ~28 km wide
    const sx = Math.max(Math.max(...xs) - Math.min(...xs), minSpan);
    const sy = Math.max(Math.max(...ys) - Math.min(...ys), minSpan);
    const k = Math.cos((TILT * Math.PI) / 180);
    const scale = Math.max(1.9, Math.min(0.62 / (sx / M.width), 0.5 / ((sy / M.width) * k * 1.12)));
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return { cx: (cx / M.width) * 100, cy: (cy / M.height) * 100, w: scale * 100 };
  }, [sel0, home, overview, items, ratio]);

  // SVG units per screen pixel, so vehicles and lines keep the same on-screen size at any zoom
  const box = useRef(null);
  const [cw, setCw] = useState(600);
  useEffect(() => {
    if (!box.current) return undefined;
    const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const u = M.width / ((view.w / 100) * cw);

  const sel = items[activeIndex];
  const selPath = paths[activeIndex];
  const travel = 2.4 + Math.min(sel?.mins ?? 20, 70) / 18;

  return (
    <div ref={box} className={cn('relative mx-auto w-full overflow-hidden', className || 'aspect-[10/9] max-w-[40rem]', ' rounded-[1.75rem] border border-primary-400/25 bg-[#0d2a22] shadow-[0_50px_90px_-40px_rgba(0,0,0,0.9)] [perspective:1500px]')}>
      {/* horizon glow */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-[#071a14] to-transparent" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-[#071a14]/80 to-transparent" />

      {/* the tilted plane */}
      <div
        className="absolute left-1/2 top-[54%] [transform-style:preserve-3d]"
        style={{
          width: `${view.w}%`,
          aspectRatio: `${M.width} / ${M.height}`,
          transform: `translate(-${view.cx}%, -${view.cy}%) rotateX(${TILT}deg)`,
          transformOrigin: `${view.cx}% ${view.cy}%`,
          transition: reduce ? 'none' : 'width 1.2s cubic-bezier(.22,1,.36,1), transform 1.2s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <img src={M.src} alt="" className="absolute inset-0 h-full w-full select-none" draggable="false" />
        <svg viewBox={`0 0 ${M.width} ${M.height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="cm-glow">
              <stop offset="0%" stopColor="#d4a64a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#d4a64a" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* every route, faint */}
          {paths.map((d, i) => d && <path key={i} id={`cm-p-${i}`} d={d} fill="none" stroke={overview ? 'rgba(232,192,106,0.45)' : 'rgba(255,231,174,0.22)'} strokeWidth={(overview ? 2.6 : 2) * u} strokeDasharray={overview ? `${5 * u} ${6 * u}` : undefined} strokeLinecap="round" strokeLinejoin="round" />)}
          {/* overview: a vehicle leaves the residency for every place */}
          {overview &&
            !reduce &&
            items.map((p, i) =>
              paths[i] && i !== activeIndex ? (
                <g key={`veh-${p.name}`} opacity="0.9">
                  <g transform={`scale(${0.55 * u})`}>
                    <Vehicle m={p.m} />
                  </g>
                  <animateMotion dur={`${3 + Math.min(p.mins ?? 20, 60) / 12}s`} begin={`${(i * 0.7) % 4}s`} repeatCount="indefinite" rotate="auto" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines="0.45 0 0.25 1">
                    <mpath href={`#cm-p-${i}`} />
                  </animateMotion>
                </g>
              ) : null,
            )}
          {/* glow under the project */}
          <circle cx={home[0]} cy={home[1]} r={70 * u} fill="url(#cm-glow)" />
          {sel?.at && <circle cx={toPx(sel.at)[0]} cy={toPx(sel.at)[1]} r={50 * u} fill="url(#cm-glow)" />}
          {/* the chosen route: draws itself, then the vehicle drives it */}
          {selPath && (
            <g key={`route-${activeIndex}`}>
              <path d={selPath} fill="none" stroke="#0b2a22" strokeWidth={9 * u} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <motion.path
                d={selPath}
                fill="none"
                stroke="#E8C06A"
                strokeWidth={4.5 * u}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={sel.m === 'air' ? `${3 * u} ${9 * u}` : undefined}
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : 1.1, ease: [0.33, 1, 0.68, 1] }}
              />
              <path id="cm-active" d={selPath} fill="none" stroke="none" />
              {!reduce && (
                <g>
                  <g transform={`scale(${0.75 * u})`}>
                    <Vehicle m={sel.m} />
                  </g>
                  <animateMotion dur={`${travel}s`} begin="0.6s" repeatCount="indefinite" rotate="auto" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines="0.45 0 0.25 1">
                    <mpath href="#cm-active" />
                  </animateMotion>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* pins standing on the map */}
        {items.map((p) => {
          if (!p.at) return null;
          const on = p.i === activeIndex;
          // On screen, is this pin crowded by the chosen place, the project or an earlier pin?
          const here = toPx(p.at);
          const near = (q) => Math.hypot(q[0] - here[0], q[1] - here[1]) / u < 70;
          const crowded =
            !on &&
            (near(home) ||
              (sel0?.at && near(toPx(sel0.at))) ||
              items.some((q) => q.at && q.i < p.i && q.i !== activeIndex && near(toPx(q.at))));
          if (crowded)
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onPick(p.i)}
                aria-label={`${p.name}, ${howFar(p)}`}
                title={`${p.name} · ${howFar(p)}`}
                className="absolute z-[1] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#06150f] bg-primary-300 shadow-[0_0_0_3px_rgba(212,166,74,0.25)]"
                style={pct(here)}
              />
            );
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onPick(p.i)}
              aria-pressed={on}
              aria-label={`${p.name}, ${howFar(p)}`}
              title={`${p.name} · ${howFar(p)}`}
              className={cn('absolute [transform-style:preserve-3d]', on ? 'z-[3]' : 'z-[2]')}
              style={{ ...pct(toPx(p.at)), transform: `translate(-50%, -100%) rotateX(-${TILT}deg)`, transformOrigin: '50% 100%' }}
            >
              <span className="flex flex-col items-center">
                <span
                  className={cn(
                    'mb-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold shadow-lg transition-colors sm:text-[11.5px]',
                    on ? 'bg-primary-400 text-navy-950' : 'bg-[#06150f]/85 text-primary-100 ring-1 ring-white/15',
                  )}
                >
                  {on && <span className="hidden sm:inline">{p.name.replace(/ \(.*\)/, '')} · </span>}
                  {howFar(p)}
                </span>
                <span
                  className={cn(
                    'block overflow-hidden rounded-full border-2 bg-navy-900 shadow-[0_10px_22px_-8px_rgba(0,0,0,0.9)] transition-all duration-300',
                    on ? 'h-12 w-12 border-primary-300 ring-4 ring-primary-400/35 sm:h-16 sm:w-16' : 'h-8 w-8 border-white/80 sm:h-11 sm:w-11',
                  )}
                >
                  {p.photo ? <img src={`/images/nearby/${p.photo}.webp`} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="block h-full w-full bg-primary-700" />}
                </span>
                <span className={cn('h-3 w-0.5 sm:h-4', on ? 'bg-primary-300' : 'bg-white/70')} />
                <span className="h-1.5 w-3 rounded-full bg-black/60 blur-[1px]" />
              </span>
            </button>
          );
        })}

        {/* the project */}
        <div
          className="pointer-events-none absolute z-[4] [transform-style:preserve-3d]"
          style={{ ...pct(home), transform: `translate(-50%, -100%) rotateX(-${TILT}deg)`, transformOrigin: '50% 100%' }}
        >
          <span className="flex flex-col items-center">
            <span className="mb-1.5 whitespace-nowrap rounded-full bg-primary-400 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-navy-950 shadow-lg sm:text-[11px]">
              {projectInfo.name}
            </span>
            <span className="relative block h-16 w-16 sm:h-24 sm:w-24">
              {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-primary-400/30 [animation-duration:2.8s]" />}
              <span className="relative block h-full w-full overflow-hidden rounded-full border-[3px] border-primary-300 shadow-[0_18px_36px_-10px_rgba(0,0,0,0.9)]">
                <img src={projectInfo.photo} alt={projectInfo.name} className="h-full w-full object-cover" />
              </span>
            </span>
            <span className="h-5 w-1 bg-gradient-to-b from-primary-300 to-primary-600 sm:h-7" />
            <span className="h-2 w-6 rounded-full bg-black/70 blur-[2px]" />
          </span>
        </div>
      </div>

      {/* compass + credit */}
      <span className="absolute right-4 top-4 z-[2] flex h-10 w-10 flex-col items-center justify-center rounded-full border border-primary-400/40 bg-[#06150f]/80 text-[10px] font-bold text-primary-200">
        <span className="leading-none text-primary-400">▲</span>N
      </span>
      <span className="absolute bottom-2 right-3 z-[2] text-[9.5px] text-white/45">Map © OpenStreetMap contributors</span>
    </div>
  );
}
