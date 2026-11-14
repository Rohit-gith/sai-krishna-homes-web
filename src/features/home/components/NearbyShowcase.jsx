import { Building2, GraduationCap, Hospital, ShoppingBag, TrainFront } from 'lucide-react';

/* Facilities grouped the way a home buyer thinks about them. */
const GROUP = {
  Hospital: 'Healthcare',
  'Cancer care': 'Healthcare',
  School: 'Education',
  College: 'Education',
  Institute: 'Education',
  Mall: 'Shopping',
  'IT hub': 'Work',
  RBI: 'Work',
  Railway: 'Travel',
  Airport: 'Travel',
  Bus: 'Travel',
};
const GROUP_ICON = { Healthcare: Hospital, Education: GraduationCap, Shopping: ShoppingBag, Work: Building2, Travel: TrainFront };
const GROUP_ORDER = ['Healthcare', 'Education', 'Shopping', 'Travel', 'Work'];

/**
 * "Life around you": the residency and the big facilities around it, as a photo showcase.
 * A summary band (how many hospitals, schools… and the nearest of each) above a bento grid of
 * large photos, nearest first. Every time is a real drive time ("Just 9 min").
 */
export default function NearbyShowcase({ places }) {
  const list = [...places].filter((p) => p.mins != null).sort((a, b) => a.mins - b.mins);


  const groups = GROUP_ORDER.map((g) => {
    const inG = list.filter((p) => GROUP[p.cat] === g);
    return inG.length ? { g, count: inG.length, nearest: inG[0] } : null;
  }).filter(Boolean);


  return (
    <div>
      {/* summary band */}
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
        {groups.map(({ g, count, nearest }) => {
          const Icon = GROUP_ICON[g];
          return (
            <li key={g} className="flex items-center gap-3 bg-[#0b221b] px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-400/15 text-primary-300 ring-1 ring-primary-400/30">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  {count} {g}
                </span>
                <span className="block text-[12.5px] leading-snug text-white/85 sm:text-[13px]">
                  Nearest <span className="font-semibold text-primary-300">just {nearest.mins} min</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>

    </div>
  );
}
