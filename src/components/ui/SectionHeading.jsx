import { cn } from '@/utils/cn';
import Reveal from '@/components/common/Reveal';

/** Eyebrow + title + subtitle used at the top of each section. */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', light = false, className }) {
  return (
    <Reveal
      className={cn(
        'mb-12 max-w-2xl md:mb-16',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            'mb-4 inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em]',
            light ? 'text-primary-300' : 'text-primary-700',
          )}
        >
          <span className="h-px w-8 bg-current opacity-60" />
          {eyebrow}
          {align === 'center' && <span className="h-px w-8 bg-current opacity-60" />}
        </span>
      )}
      <h2 className={cn('text-[2rem] font-semibold leading-[1.15] md:text-[2.75rem]', light && 'text-white')}>{title}</h2>
      {subtitle && (
        <p className={cn('mt-5 text-base leading-[1.75] md:text-[1.075rem]', light ? 'text-slate-300' : 'text-slate-600')}>
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
