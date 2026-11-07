import { cn } from '@/utils/cn';

const TONES = {
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  navy: 'bg-navy-50 text-navy-700 ring-navy-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  white: 'bg-white/10 text-white ring-white/20',
};

export default function Badge({ tone = 'primary', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
