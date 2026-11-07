import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

/** Back / Next buttons shared by every registration step. */
export default function StepActions({ onBack, nextLabel = 'Save & Continue', loading, disabled }) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" loading={loading} disabled={disabled}>
        {nextLabel} {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
