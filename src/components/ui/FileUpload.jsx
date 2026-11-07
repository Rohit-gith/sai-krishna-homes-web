import { useRef, useState } from 'react';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const MAX_MB = 2;

/**
 * Drag & drop file picker.
 * `value` is a lightweight file meta object ({ name, size, type }) so it can live in Zustand.
 */
export default function FileUpload({
  label,
  required,
  accept = '.pdf,.jpg,.jpeg,.png',
  value,
  onChange,
  error,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setLocalError(`File must be smaller than ${MAX_MB} MB`);
      return;
    }
    setLocalError('');
    onChange?.({ name: file.name, size: file.size, type: file.type });
  };

  const shownError = localError || error;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-navy-900">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
          <FileCheck2 className="h-5 w-5 shrink-0 text-primary-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-navy-950">{value.name}</p>
            <p className="text-xs text-slate-500">{(value.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="rounded-full p-1.5 text-slate-500 hover:bg-white hover:text-red-600"
            aria-label={`Remove ${value.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragging
              ? 'border-primary-500 bg-primary-50'
              : shownError
                ? 'border-red-300 bg-red-50/40'
                : 'border-slate-200 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/50',
          )}
        >
          <UploadCloud className="h-7 w-7 text-primary-600" />
          <span className="text-sm text-navy-900">
            <span className="font-semibold text-primary-700">Click to upload</span> or drag & drop
          </span>
          <span className="text-xs text-slate-500">PDF, JPG or PNG · max {MAX_MB} MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {shownError && <p className="text-xs font-medium text-red-600">{shownError}</p>}
    </div>
  );
}
