import Reveal from '@/components/common/Reveal';
import { cn } from '@/utils/cn';

/**
 * Editorial chapter opener: hollow gold roman numeral, small-caps label, large serif title and a
 * short intro on the right, closed by a hairline rule. Replaces the centered "eyebrow/title" pattern.
 */
export default function ChapterHeading({ numeral, label, title, intro, light = false, className }) {
  return (
    <Reveal
      className={cn(
        'mb-12 grid items-end gap-6 border-b pb-8 md:mb-16 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_minmax(0,24rem)] lg:gap-12',
        light ? 'border-white/15' : 'border-navy-900/10',
        className,
      )}
    >
      <span aria-hidden className="text-outline-gold font-serif text-[5.5rem] font-medium leading-[0.8] md:text-[7.5rem]">
        {numeral}
      </span>
      <div>
        <p
          className={cn(
            'text-[11px] font-bold uppercase tracking-[0.35em]',
            light ? 'text-primary-300' : 'text-primary-700',
          )}
        >
          {label}
        </p>
        <h2 className={cn('mt-3 text-[2.2rem] leading-[1.08] md:text-[3.2rem]', light ? 'text-white' : 'text-navy-950')}>
          {title}
        </h2>
      </div>
      {intro && (
        <p className={cn('text-[15.5px] leading-[1.8] md:col-span-2 lg:col-span-1', light ? 'text-white/70' : 'text-slate-600')}>
          {intro}
        </p>
      )}
    </Reveal>
  );
}
