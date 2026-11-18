import { forwardRef, useId } from 'react';
import FormField, { controlClasses } from './FormField';
import { cn } from '@/utils/cn';

const Input = forwardRef(function Input(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FormField label={label} htmlFor={inputId} required={required} error={error} hint={hint} className={className}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(controlClasses(!!error))}
        {...props}
      />
    </FormField>
  );
});

export default Input;
