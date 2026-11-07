import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { SkMark } from './SkLogo';
import { SK, SK_CONFIGS, SK_PROJECTS } from '../data';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  project: z.string(),
  config: z.string(),
});

const fieldCls =
  'w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 font-lux text-[15px] text-sk-ivory placeholder:text-sk-mist/70 focus:border-sk-gold focus:outline-none focus:ring-0';

/** Site-visit enquiry. Submits by opening WhatsApp with a pre-filled message to the sales team. */
export default function SkEnquiryModal({ open, onClose, defaultProject }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', project: SK_PROJECTS[0], config: SK_CONFIGS[2] },
  });

  useEffect(() => {
    if (!open) return undefined;
    if (defaultProject) reset((v) => ({ ...v, project: defaultProject }));
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, defaultProject, onClose, reset]);

  const onSubmit = ({ name, phone, project, config }) => {
    const msg = `Hello Sai Krishna Homes, I'd like to book a site visit.\n\nName: ${name}\nPhone: ${phone}\nProject: ${project}\nLooking for: ${config}`;
    window.open(`https://wa.me/${SK.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sk-enquiry-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-sk-gold/20 bg-sk-night p-7 shadow-2xl sm:rounded-3xl sm:p-10"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sk-gold/10 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-sk-mist hover:text-sk-ivory"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <SkMark className="h-10 w-8" />
            <p className="mt-5 font-lux text-[11px] font-semibold uppercase tracking-[0.3em] text-sk-gold">
              Private site visit
            </p>
            <h2 id="sk-enquiry-title" className="mt-2 font-serif text-4xl font-medium text-sk-ivory">
              Discover your <em className="text-sk-gold-light">dream home</em>
            </h2>
            <p className="mt-2 font-lux text-sm text-sk-mist">
              Share your details and our relationship manager will reach you on WhatsApp.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
              <div>
                <input {...register('name')} placeholder="Full name" className={fieldCls} autoComplete="name" />
                {errors.name && <p className="mt-1 font-lux text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <input
                  {...register('phone')}
                  placeholder="Mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  className={fieldCls}
                  autoComplete="tel-national"
                />
                {errors.phone && <p className="mt-1 font-lux text-xs text-red-400">{errors.phone.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <select {...register('project')} className={`${fieldCls} [&>option]:bg-sk-night`}>
                  {SK_PROJECTS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <select {...register('config')} className={`${fieldCls} [&>option]:bg-sk-night`}>
                  {SK_CONFIGS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="mt-3 w-full rounded-full bg-gradient-to-r from-sk-gold-deep via-sk-gold to-sk-gold-light py-4 font-lux text-sm font-bold uppercase tracking-[0.2em] text-sk-ink transition-transform hover:scale-[1.01]"
              >
                Book my visit
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
