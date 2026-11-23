import { useState } from 'react';
import { cn } from '@/utils/cn';

/*
 * Donut chart (part-to-whole, up to 4 slices) with a legend + table, for the Reports page.
 * Colours were checked with the dataviz palette validator (colour-blind safe as adjacent pairs:
 * aqua / blue / orange). Identity never relies on colour alone: every slice is named in the legend
 * with its count and share, and hovering a slice shows the same in a tooltip.
 */
export const CHART = {
  good: '#1baf7a', // won, satisfied
  mid: '#2a78d6', // still open, neutral
  bad: '#eb6834', // lost, not satisfied
};

const TAU = Math.PI * 2;
function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/**
 * slices: [{ id, label, value, color }]. centerLabel: small text under the total.
 * Renders the donut, a legend with count + %, and nothing misleading when the total is 0.
 */
export function Donut({ title, slices, centerLabel, emptyText = 'No data in this period.' }) {
  const [hover, setHover] = useState(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const size = 180;
  const c = size / 2;
  const r = 70;
  const stroke = 26;
  let a = 0;
  const shown = slices.filter((s) => s.value > 0);
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);
  const active = slices.find((s) => s.id === hover);

  return (
    <figure className="flex flex-col items-center gap-4">
      <p className="w-full text-sm font-semibold text-navy-950">{title}</p>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label={`${title}: ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}
        >
          <circle cx={c} cy={c} r={r} fill="none" stroke="#eef0f2" strokeWidth={stroke} />
          {total > 0 &&
            shown.map((s) => {
              const sweep = (s.value / total) * TAU;
              const a0 = a;
              a += sweep;
              // a single slice is a full ring; otherwise leave a small surface gap between slices
              const gap = shown.length > 1 ? 0.025 : 0;
              const d = shown.length === 1 ? null : arc(c, c, r, a0 + gap / 2, a - gap / 2);
              return d ? (
                <path
                  key={s.id}
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.id ? stroke + 6 : stroke}
                  onMouseEnter={() => setHover(s.id)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer transition-[stroke-width]"
                />
              ) : (
                <circle
                  key={s.id}
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  onMouseEnter={() => setHover(s.id)}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {active ? (
            <>
              <span className="font-display text-2xl font-bold leading-none text-navy-950">
                {active.value}
              </span>
              <span className="mt-1 max-w-[6.5rem] text-[11px] font-semibold leading-tight text-slate-600">
                {active.label} · {pct(active.value)}%
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-3xl font-bold leading-none text-navy-950">
                {total}
              </span>
              <span className="mt-1 text-[11px] font-semibold text-slate-500">{centerLabel}</span>
            </>
          )}
        </div>
      </div>
      <figcaption className="w-full min-w-0">
        {total === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <tbody>
              {slices.map((s) => (
                <tr
                  key={s.id}
                  onMouseEnter={() => setHover(s.id)}
                  onMouseLeave={() => setHover(null)}
                  className={cn(
                    'cursor-default border-b border-slate-100 last:border-0',
                    hover === s.id && 'bg-slate-50',
                  )}
                >
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ background: s.color }}
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap text-slate-700">{s.label}</span>
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold text-navy-950">{s.value}</td>
                  <td className="w-14 py-2 text-right text-slate-500">{pct(s.value)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </figcaption>
    </figure>
  );
}
