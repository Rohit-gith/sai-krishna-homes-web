import Reveal from '@/components/common/Reveal';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { COMPANY } from '@/data/companyInfo';

const FIGURES = [
  { value: 2010, label: 'Year founded', plain: true },
  { value: 500, suffix: '+', label: 'Homes in the township' },
  { value: 6, suffix: ' acres', label: 'Gated community' },
  { value: 25, suffix: '+', label: 'Curated amenities' },
  { value: 2, label: 'Signature projects' },
];

/** Brand manifesto between the hero and the projects: who we are, in one sentence, plus key figures. */
export default function BrandStatement() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <div aria-hidden className="bg-jaali pointer-events-none absolute -right-24 top-0 h-full w-[28rem] opacity-[0.08]" />
      <div className="container relative">
        <Reveal className="grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-16">
          <div className="flex items-start gap-4 lg:flex-col">
            <span className="h-px w-12 translate-y-3 bg-primary-400 lg:translate-y-0" />
            <p className="text-[11px] font-bold uppercase leading-relaxed tracking-[0.35em] text-primary-700">
              {COMPANY.name}
              <br />
              Est. {COMPANY.established}
            </p>
          </div>

          <div>
            <p className="font-serif text-[1.9rem] leading-[1.35] text-navy-950 md:text-[2.6rem] md:leading-[1.3]">
              Driven by a simple yet powerful vision: to create{' '}
              <em className="text-gold-rich font-medium">spaces that add lasting value</em> to people’s lives. For over
              a decade we have been shaping homes in Bhubaneswar where{' '}
              <em className="text-gold-rich font-medium">modern luxury meets the warmth of family living.</em>
            </p>
          </div>
        </Reveal>

        <dl className="mt-16 grid grid-cols-2 gap-y-10 border-t border-navy-900/10 pt-10 sm:grid-cols-3 lg:grid-cols-5">
          {FIGURES.map((f, i) => (
            <Reveal key={f.label} delay={i * 0.06} className="flex flex-col-reverse border-l border-primary-200 pl-5">
              <dt className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{f.label}</dt>
              <dd className="font-serif text-[2.6rem] font-semibold leading-none text-navy-950">
                {f.plain ? f.value : <AnimatedCounter value={f.value} suffix={f.suffix} />}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
