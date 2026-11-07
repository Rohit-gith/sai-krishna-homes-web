import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Expand, MessageCircle, Phone, ShieldCheck, Timer, Footprints } from 'lucide-react';
import { Lightbox } from '@/features/home/components/GallerySection';
import Reveal from '@/components/common/Reveal';

/** "Direct Leadership Connect": the project's sales lead with photo (opens full size), call & WhatsApp. */
export default function LeadershipConnect({ project }) {
  const c = project.contact;
  const [open, setOpen] = useState(false);
  const first = c.name.split(' ')[0];

  return (
    <Reveal className="grid overflow-hidden bg-white shadow-[0_40px_90px_-45px_rgba(8,38,32,0.55)] sm:grid-cols-[0.9fr_1.1fr]">
      {/* Photo with name band */}
      <button type="button" data-cursor="view" onClick={() => setOpen(true)} className="group relative block min-h-[24rem] overflow-hidden bg-slate-100 text-left" aria-label={`View full photo of ${c.name}`}>
        <img src={c.photo} alt={`${c.name}, ${c.role}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1.2s] group-hover:scale-105" />
        <span className="absolute left-4 top-4 flex items-center gap-1.5 bg-primary-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-navy-950">
          <ShieldCheck className="h-3.5 w-3.5" /> {c.badge}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1.5 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy-900 opacity-0 transition-opacity group-hover:opacity-100 max-lg:opacity-100">
          <Expand className="h-3.5 w-3.5" /> View full photo
        </span>
        {/* thick name band */}
        <span className="absolute inset-x-0 bottom-0 border-t-4 border-primary-400 bg-navy-900 px-5 py-4">
          <span className="block font-serif text-xl uppercase tracking-[0.06em] text-white">{c.name}</span>
          <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-primary-300">{c.role}</span>
        </span>
      </button>

      <div className="flex flex-col p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">Direct Leadership Connect</p>
        <p className="mt-3 font-serif text-[1.65rem] leading-snug text-navy-950">Speak directly with {first}</p>
        <p className="mt-3 text-[15px] leading-[1.75] text-slate-600">{project.connectText}</p>
        <ul className="mt-5 flex flex-wrap gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-navy-900">
          <li className="flex items-center gap-1.5 bg-ivory px-3 py-2"><Timer className="h-4 w-4 text-primary-600" /> Instant Response</li>
          <li className="flex items-center gap-1.5 bg-ivory px-3 py-2"><Footprints className="h-4 w-4 text-primary-600" /> Guided Site Visit</li>
        </ul>
        <div className="mt-auto grid gap-3 pt-7">
          <a href={`tel:+${c.phone}`} className="flex items-center justify-between bg-navy-900 px-5 py-4 text-white hover:bg-navy-800">
            <span className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary-300" />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Direct Call</span>
                <span className="block text-[15px] font-bold tracking-wide">{c.phoneDisplay}</span>
              </span>
            </span>
          </a>
          <a
            href={`https://wa.me/${c.phone}?text=${encodeURIComponent(`Hi ${first} Ji, I am interested in ${project.name}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border border-navy-900/15 px-5 py-4 hover:border-[#25D366]"
          >
            <MessageCircle className="h-5 w-5 text-[#1fa855]" />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Instant Chat</span>
              <span className="block text-[15px] font-bold text-navy-950">WhatsApp Now</span>
            </span>
          </a>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <Lightbox items={[{ src: c.photo, alt: `${c.name}, ${c.role}`, title: `${c.name} · ${c.role}` }]} index={0} onClose={() => setOpen(false)} onNav={() => {}} />
        )}
      </AnimatePresence>
    </Reveal>
  );
}
