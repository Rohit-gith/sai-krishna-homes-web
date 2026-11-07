import { forwardRef, useId } from 'react';
import FormField, { controlClasses } from './FormField';
import { cn } from '@/utils/cn';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, id, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const textareaId = id || autoId;
  return (
    <FormField label={label} htmlFor={textareaId} required={required} error={error} hint={hint} className={className}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={!!error}
        className={cn(controlClasses(!!error), 'resize-none')}
        {...props}
      />
    </FormField>
  );
});

export default Textarea;
