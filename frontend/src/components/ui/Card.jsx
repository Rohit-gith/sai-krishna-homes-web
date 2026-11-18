import { cn } from '@/utils/cn';

export default function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
