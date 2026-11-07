import AnimatedCounter from '@/components/common/AnimatedCounter';
import Reveal from '@/components/common/Reveal';

// NOTE: placeholder figures — update with real numbers.
const STATS = [
  { value: 17, suffix: '+', label: 'Services offered' },
  { value: 500, suffix: '+', label: 'Clients served' },
  { value: 50, suffix: '+', label: 'Business associates' },
  { value: 98, suffix: '%', label: 'Client satisfaction' },
];

export default function StatsSection() {
  return (
    <section className="relative z-10 -mt-8">
      <div className="container">
        <Reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-soft md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white px-6 py-8 text-center">
              <p className="font-display text-3xl font-bold text-navy-950 md:text-4xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
