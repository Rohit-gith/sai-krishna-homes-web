import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import FormField, { controlClasses } from './FormField';
import { cn } from '@/utils/cn';

const Select = forwardRef(function Select(
  { label, error, hint, required, options = [], placeholder = 'Select one', className, id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <FormField label={label} htmlFor={selectId} required={required} error={error} hint={hint} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={cn(controlClasses(!!error), 'appearance-none pr-10')}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </FormField>
  );
});

export default Select;
