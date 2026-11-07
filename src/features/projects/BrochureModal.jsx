import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Download, X } from 'lucide-react';
import { COMPANY } from '@/data/companyInfo';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { whatsappLink } from '@/utils/whatsapp';
import logoImg from '@/assets/logo/logo.png';
import { cn } from '@/utils/cn';

const INTERESTS = ['Buy a Property', '1 BHK', '2 BHK', '3 BHK', 'Commercial Property'];

const field =
  'w-full border-0 border-b border-navy-900/20 bg-transparent px-0 py-3 text-[15px] text-navy-950 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-0';

/**
 * "Download Brochure" form. The lead is saved for the admin and the visitor either downloads the
 * PDF (when the project has one) or the request goes to the sales team on WhatsApp.
 */
export default function BrochureModal({ open, onClose, project }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', interest: '', message: '' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setErr('');
    setDone(false);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!project) return null;
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Please enter your full name.');
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setErr('Please enter a valid 10-digit phone number.');
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.');
    if (!f.interest) return setErr('Please choose what you are interested in.');
    setErr('');
    useCrmStore.getState().captureEnquiry({
      form: `Brochure · ${project.name}`,
      name: f.name.trim(),
      phone: f.phone,
      email: f.email.trim(),
      interest: `${project.name} · ${f.interest}`,
      message: f.message.trim() || 'Requested the brochure',
    });
    if (project.brochure) {
      const a = Object.assign(document.createElement('a'), { href: project.brochure, download: `${project.slug}-brochure.pdf` });
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const msg = [
        `Hello ${COMPANY.shortName}, please share the ${project.name} brochure.`,
        '',
        `Name: ${f.name.trim()}`,
        `Phone: +91 ${f.phone}`,
        f.email && `Email: ${f.email.trim()}`,
        `Interested in: ${f.interest}`,
        f.message && `Message: ${f.message.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');
      const url = whatsappLink(msg).replace(COMPANY.whatsapp, project.contact.phone);
      if (!window.open(url, '_blank')) window.location.href = url;
    }
    setDone(true);
    return undefined;
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-navy-950/60 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Download ${project.name} brochure`}
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid max-h-[94svh] w-full overflow-y-auto bg-ivory shadow-2xl sm:max-w-3xl md:grid-cols-[0.9fr_1.1fr]"
          >
            {/* Cover */}
            <div className="relative hidden overflow-hidden bg-navy-950 md:block">
              <img src={project.card.sm} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-7 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-300">Project brochure</p>
                <p className="mt-2 font-serif text-3xl leading-tight">{project.name}</p>
                <p className="mt-2 text-sm text-white/70">{project.location}</p>
                <p className="mt-6 border-t border-white/15 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">RERA {project.rera}</p>
              </div>
            </div>

            <div className="relative p-6 sm:p-8">
              <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-navy-900/60 hover:text-navy-950">
                <X className="h-5 w-5" />
              </button>
              <span className="block h-11 w-9 overflow-hidden">
                <img src={logoImg} alt="" className="h-auto w-full" />
              </span>

              {done ? (
                <div className="py-10">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                  <p className="mt-4 font-serif text-3xl text-navy-950">Thank you, {f.name.split(' ')[0]}.</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    {project.brochure
                      ? 'Your brochure download has started.'
                      : `We've opened WhatsApp with your request. Tap send and ${project.contact.name.split(' ')[0]} will share the ${project.name} brochure with you.`}
                  </p>
                  <button type="button" onClick={onClose} className="mt-8 bg-navy-900 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-navy-800">
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h2 className="mt-5 font-serif text-3xl text-navy-950">Download Brochure</h2>
                  <p className="mt-2 text-[14.5px] text-slate-600">Please fill out this form to download our property brochures.</p>
                  <div className="mt-5 space-y-1">
                    <label className="block"><span className="sr-only">Full name</span><input className={field} placeholder="Full Name*" value={f.name} onChange={set('name')} autoComplete="name" /></label>
                    <label className="flex items-center gap-2 border-b border-navy-900/20 focus-within:border-primary-500">
                      <span className="text-[15px] text-slate-500">+91</span>
                      <span className="sr-only">Phone number</span>
                      <input className={cn(field, 'border-0')} placeholder="Phone Number*" value={f.phone} onChange={set('phone')} inputMode="numeric" autoComplete="tel-national" />
                    </label>
                    <label className="block"><span className="sr-only">Email</span><input className={field} placeholder="Email Address" value={f.email} onChange={set('email')} type="email" autoComplete="email" /></label>
                  </div>
                  <fieldset className="mt-5">
                    <legend className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700">Interest*</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {INTERESTS.map((x) => (
                        <button
                          key={x}
                          type="button"
                          onClick={() => setF((v) => ({ ...v, interest: x }))}
                          aria-pressed={f.interest === x}
                          className={cn('border px-3.5 py-2 text-[13px] font-semibold transition-colors', f.interest === x ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 text-navy-900 hover:border-primary-400')}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="mt-3 block"><span className="sr-only">Message</span><textarea className={field} rows={2} placeholder="Message (optional)" value={f.message} onChange={set('message')} /></label>
                  {err && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{err}</p>}
                  <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2.5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-navy-950 shadow-gold">
                    <Download className="h-4 w-4" /> Download {project.name.split(' ')[0]} brochure
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
