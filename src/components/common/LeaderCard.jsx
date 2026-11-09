import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Expand, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Lightbox } from '@/features/home/components/GallerySection';
import { cn } from '@/utils/cn';

/**
 * The one standard portrait card for every leader on the site: 4:5 photo, gold rule, name band,
 * role. Same size wherever it is used (About, project pages). Tap the photo to view it full size.
 * person: { name, role, photo, photoPos?, photoBg?, badge?, phone?, phoneDisplay? }
 */
export default function LeaderCard({ person, actions = false, waText, footer, fill = false, className }) {
  const [open, setOpen] = useState(false);
  const first = person.name.split(' ')[0];

  return (
    <article className={cn('flex w-full flex-col bg-white shadow-[0_30px_70px_-40px_rgba(8,38,32,0.55)]', className)}>
      <button
        type="button"
        data-cursor="view"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[4/5] w-full overflow-hidden"
        style={{ backgroundColor: person.photoBg || '#f1f2f5' }}
        aria-label={`View full photo of ${person.name}`}
      >
        <img
          src={person.photo}
          alt={`${person.name}, ${person.role}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
          style={{ objectPosition: person.photoPos || '50% 20%' }}
        />
        {person.badge && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-primary-500 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950">
            <ShieldCheck className="h-3.5 w-3.5" /> {person.badge}
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-white/90 text-navy-900 opacity-0 transition-opacity group-hover:opacity-100 max-lg:opacity-100">
          <Expand className="h-4 w-4" />
        </span>
      </button>

      {/* name band: identical height on every card */}
      <div className={cn('flex h-[7.5rem] flex-col justify-center border-t-4 border-primary-400 bg-navy-900 px-5', fill && 'h-auto min-h-[7.5rem] flex-1')}>
        <p className="font-serif text-xl uppercase leading-tight tracking-[0.05em] text-white">{person.name}</p>
        <p className="mt-1.5 text-[11px] font-bold uppercase leading-snug tracking-[0.18em] text-primary-300">{person.role}</p>
      </div>

      {footer && <div className="flex h-[4.5rem] items-stretch p-3">{footer}</div>}

      {actions && person.phone && (
        <div className="grid h-[4.5rem] grid-cols-[1fr_auto] gap-2 p-3">
          <a href={`tel:+${person.phone}`} className="flex items-center justify-center gap-2 bg-ivory px-3 py-3 text-[12.5px] font-bold tracking-wide text-navy-950 hover:bg-primary-100">
            <Phone className="h-4 w-4 text-primary-600" /> {person.phoneDisplay}
          </a>
          <a
            href={`https://wa.me/${person.phone}?text=${encodeURIComponent(waText || `Hi ${first} Ji, I'd like to know more about Sai Krishna Homes.`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${person.name}`}
            className="flex w-12 items-center justify-center border border-navy-900/15 hover:border-[#25D366]"
          >
            <MessageCircle className="h-5 w-5 text-[#1fa855]" />
          </a>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <Lightbox
            items={[{ src: person.photo, alt: `${person.name}, ${person.role}`, title: `${person.name} · ${person.role}` }]}
            index={0}
            onClose={() => setOpen(false)}
            onNav={() => {}}
          />
        )}
      </AnimatePresence>
    </article>
  );
}
