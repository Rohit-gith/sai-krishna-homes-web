import { useId } from 'react';
import { PHOTOS, VIRTUAL_TOURS } from '@/data/projects';
import { cn } from '@/utils/cn';

/*
 * Visual for an Explore chapter card. Most chapters use a photo; chapters a photo can't explain
 * (EMI calculator, location, gallery) get a drawn illustration instead, so the card is
 * recognisable at a glance. SVGs use "slice" so they fill any card shape like object-cover.
 */

const FONT_SANS = "Manrope, system-ui, sans-serif";
const FONT_SERIF = "'Playfair Display', Georgia, serif";

function EmiArt() {
  // Unique ids: the same art can appear twice on a page (e.g. a hidden mobile thumb + a desktop preview).
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`emiBg${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#164536" />
          <stop offset="1" stopColor="#082620" />
        </linearGradient>
        <pattern id={`emiJaali${uid}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="7" fill="none" stroke="#CFA557" strokeOpacity=".14" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="#CFA557" strokeOpacity=".1" />
        </pattern>
      </defs>
      <rect width="300" height="300" fill={`url(#emiBg${uid})`} />
      <rect width="300" height="300" fill={`url(#emiJaali${uid})`} />
      {/* calculator card */}
      <rect x="62" y="58" width="176" height="184" rx="10" fill="#FAF7F0" />
      <text x="80" y="88" fontFamily={FONT_SANS} fontSize="8" fontWeight="700" letterSpacing="2" fill="#7C5B29">MONTHLY EMI</text>
      <text x="80" y="118" fontFamily={FONT_SANS} fontSize="27" fontWeight="700" fill="#0E3B32">₹31,242</text>
      {/* donut: principal vs interest */}
      <circle cx="207" cy="104" r="15" fill="none" stroke="#E2ECE6" strokeWidth="7" />
      <circle cx="207" cy="104" r="15" fill="none" stroke="#B88B3E" strokeWidth="7" strokeDasharray="56 94" transform="rotate(-90 207 104)" />
      {/* sliders */}
      {[
        ['PRICE', 0.62],
        ['DOWN PAYMENT', 0.3],
        ['TENURE', 0.7],
      ].map(([label, v], i) => {
        const y = 150 + i * 30;
        return (
          <g key={label}>
            <text x="80" y={y - 6} fontFamily={FONT_SANS} fontSize="6.5" fontWeight="700" letterSpacing="1.4" fill="#6B665C">{label}</text>
            <rect x="80" y={y} width="140" height="3" rx="1.5" fill="#E3E0D8" />
            <rect x="80" y={y} width={140 * v} height="3" rx="1.5" fill="#B88B3E" />
            <circle cx={80 + 140 * v} cy={y + 1.5} r="5.5" fill="#0E3B32" stroke="#FAF7F0" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

function MapArt() {
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width="300" height="300" fill="#F1EFE6" />
      {/* parks */}
      <rect x="18" y="20" width="70" height="56" rx="6" fill="#CFE3D3" />
      <rect x="196" y="196" width="86" height="80" rx="6" fill="#CFE3D3" />
      <rect x="112" y="214" width="56" height="40" rx="6" fill="#CFE3D3" />
      {/* river */}
      <path d="M-10 250 C 60 220, 90 280, 160 268 S 260 220, 320 238" fill="none" stroke="#A9CFE0" strokeWidth="16" strokeLinecap="round" />
      {/* roads */}
      <g stroke="#FFFFFF" strokeLinecap="round">
        <path d="M-10 120 L 320 96" strokeWidth="12" />
        <path d="M120 -10 L 150 320" strokeWidth="9" />
        <path d="M-10 182 L 320 170" strokeWidth="6" />
        <path d="M230 -10 L 210 320" strokeWidth="6" />
        <path d="M40 -10 L 70 200" strokeWidth="5" />
      </g>
      {/* highway centre line */}
      <path d="M-10 120 L 320 96" stroke="#E8D3A0" strokeWidth="2" strokeDasharray="8 7" />
      {/* pin */}
      <g transform="translate(150 132)">
        <ellipse cx="0" cy="22" rx="14" ry="4" fill="#0E3B32" opacity=".18" />
        <path d="M0 22 C -6 10, -24 -2, -24 -20 A 24 24 0 0 1 24 -20 C 24 -2, 6 10, 0 22 Z" fill="#B88B3E" />
        <circle cx="0" cy="-20" r="9" fill="#0E3B32" />
        <circle cx="0" cy="-20" r="3.5" fill="#FAF7F0" />
      </g>
      <rect x="92" y="164" width="116" height="20" rx="4" fill="#0E3B32" />
      <text x="150" y="177.5" textAnchor="middle" fontFamily={FONT_SANS} fontSize="7.5" fontWeight="700" letterSpacing="1.6" fill="#FAF7F0">BHUBANESWAR</text>
      <text x="22" y="112" fontFamily={FONT_SERIF} fontSize="8" fontStyle="italic" fill="#7C5B29">CB Bypass</text>
    </svg>
  );
}

/** 360° tour: a room outline inside an orbiting arrow, so the card reads as "look around". */
export function TourArt({ className }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className={className || 'h-full w-full'} aria-hidden>
      <defs>
        <radialGradient id={`tourBg${uid}`} cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor="#1F513F" />
          <stop offset="1" stopColor="#082620" />
        </radialGradient>
        <pattern id={`tourJaali${uid}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="7" fill="none" stroke="#CFA557" strokeOpacity=".12" />
        </pattern>
      </defs>
      <rect width="300" height="300" fill={`url(#tourBg${uid})`} />
      <rect width="300" height="300" fill={`url(#tourJaali${uid})`} />
      {/* room in perspective */}
      <g fill="none" stroke="#E8D3A0" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M110 112 H190 V182 H110 Z" />
        <path d="M70 82 L110 112 M230 82 L190 112 M70 212 L110 182 M230 212 L190 182" />
        <path d="M128 182 V146 H150 V182" opacity=".8" />
        <path d="M162 128 H180 V146 H162 Z" opacity=".8" />
      </g>
      {/* orbit arrow */}
      <ellipse cx="150" cy="150" rx="112" ry="34" fill="none" stroke="#CFA557" strokeWidth="3" strokeDasharray="560 60" transform="rotate(-8 150 150)" />
      <path d="M246 128 l16 4 -9 13 z" fill="#CFA557" transform="rotate(-8 150 150)" />
      <text x="150" y="250" textAnchor="middle" fontFamily={FONT_SERIF} fontSize="30" fontWeight="600" fill="#FAF7F0">360°</text>
    </svg>
  );
}

const COLLAGE = [PHOTOS.pwGate, PHOTOS.pwPool, PHOTOS.skAerialPool, PHOTOS.pwRooftop];
function Collage() {
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[3px] bg-ivory">
      {COLLAGE.map((p) => (
        <img key={p.sm} src={p.sm} alt="" loading="lazy" className="h-full w-full object-cover" />
      ))}
    </div>
  );
}

export default function ChapterVisual({ chapter, className }) {
  let inner;
  if (chapter.art === 'emi') inner = <EmiArt />;
  else if (chapter.art === 'map') inner = <MapArt />;
  else if (chapter.art === 'collage') inner = <Collage />;
  else if (chapter.art === 'tour')
    inner = (
      <span className="relative block h-full w-full">
        <img src={VIRTUAL_TOURS[0].poster.sm} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
        <span className="absolute bottom-[8%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary-300/80 bg-navy-950/70 px-3 py-1 font-serif text-sm text-white backdrop-blur">
          360°
        </span>
      </span>
    );
  else inner = <img src={chapter.photo.sm} alt="" loading="lazy" className="h-full w-full object-cover" />;
  return <span className={cn('block overflow-hidden', className)}>{inner}</span>;
}
