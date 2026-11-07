import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Horizontal progress stepper for multi-step forms. `current` is 0-based. */
export default function Stepper({ steps, current }) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <li key={step.label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 transition-colors duration-500',
                  done || active ? 'bg-primary-500' : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                done && 'border-primary-600 bg-primary-600 text-white',
                active && 'border-primary-600 bg-white text-primary-700 shadow-glow',
                !done && !active && 'border-slate-200 bg-white text-slate-400',
              )}
            >
              {done ? <Check className="h-5 w-5" /> : Icon ? <Icon className="h-5 w-5" /> : i + 1}
            </span>
            <span
              className={cn(
                'mt-2 hidden text-xs font-semibold sm:block',
                active || done ? 'text-navy-950' : 'text-slate-400',
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
