import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Check, Search, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRegistrationStore } from '../store/useRegistrationStore';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/utils/formatDate';

export default function RegistrationSuccess() {
  const result = useRegistrationStore((s) => s.result);
  const reset = useRegistrationStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.registrationNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="py-6 text-center">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100"
      >
        <CheckCircle2 className="h-11 w-11 text-primary-600" />
      </motion.span>
      <h2 className="mt-6 text-2xl font-bold md:text-3xl">Application submitted!</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Thank you. Our team will verify your details and contact you shortly. Save your registration number to
        track your application.
      </p>

      <div className="mx-auto mt-8 max-w-sm rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/60 p-5">
        <p className="text-xs uppercase tracking-wider text-slate-500">Registration Number</p>
        <div className="mt-1 flex items-center justify-center gap-3">
          <span className="font-display text-2xl font-bold text-navy-950">{result.registrationNo}</span>
          <button onClick={copy} className="rounded-lg p-1.5 text-primary-700 hover:bg-white" aria-label="Copy registration number">
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Submitted on {formatDateTime(result.submittedAt)}</p>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button to={`${ROUTES.APPLICATION_STATUS}?q=${result.registrationNo}`} onClick={reset}>
          <Search className="h-4 w-4" /> Track Application
        </Button>
        <Button to={ROUTES.HOME} variant="outline" onClick={reset}>
          <Home className="h-4 w-4" /> Back to Home
        </Button>
      </div>
    </div>
  );
}
