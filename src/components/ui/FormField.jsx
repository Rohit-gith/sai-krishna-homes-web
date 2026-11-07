import { cn } from '@/utils/cn';

/** Wraps a form control with label, hint and error message. */
export default function FormField({ label, htmlFor, required, error, hint, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-navy-900">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export const controlClasses = (hasError) =>
  cn(
    'w-full rounded-xl border bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400',
    'transition-all duration-150 focus:outline-none focus:ring-4',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/15',
  );
