import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import { GALLERY, GALLERY_FILTERS, responsive } from '@/data/projects';
import { cn } from '@/utils/cn';

export function Lightbox({ items, index, onClose, onNav }) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onNav]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[70] flex flex-col bg-navy-950/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-4 text-white sm:px-8">
        <p className="text-sm">
          <span className="font-serif text-lg">{item.title}</span>
          <span className="ml-3 text-white/50">
            {index + 1} / {items.length}
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-8 sm:px-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={item.src}
            src={item.src}
            alt={item.alt}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) onNav(1);
              if (info.offset.x > 60) onNav(-1);
            }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-full cursor-grab rounded-2xl object-contain shadow-2xl active:cursor-grabbing"
          />
        </AnimatePresence>
        {[-1, 1].map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNav(dir);
            }}
            aria-label={dir < 0 ? 'Previous photo' : 'Next photo'}
            className={cn(
              'absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex',
              dir < 0 ? 'left-5' : 'right-5',
            )}
          >
            {dir < 0 ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/** Film-strip gallery: one large featured frame, a scrollable contact strip, and a full-screen viewer. */
export default function GallerySection({ numeral = 'V' } = {}) {
  const [filter, setFilter] = useState('All');
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(null);
  const strip = useRef(null);

  // Keep the featured frame in sync with whatever was last shown in the full-screen viewer.
  useEffect(() => {
    if (open !== null) setCurrent(open);
  }, [open]);

  const items = useMemo(() => (filter === 'All' ? GALLERY : GALLERY.filter((g) => g.tag === filter)), [filter]);
  const item = items[current] ?? items[0];

  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback((dir) => setOpen((i) => (i + dir + items.length) % items.length), [items.length]);
  const step = (dir) => {
    const next = (current + dir + items.length) % items.length;
    setCurrent(next);
    strip.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <section id="gallery" className="section scroll-mt-24 bg-ivory">
      <div className="container">
        <ChapterHeading
          numeral={numeral}
          label="In frames"
          title="Have a look around"
          intro="Façades, amenities and township views. Select a frame, or open it full screen."
        />

        {/* Filters as editorial tabs */}
        <div className="mb-8 flex flex-wrap gap-x-8 gap-y-3 border-b border-navy-900/10" role="tablist" aria-label="Filter photos">
          {GALLERY_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => {
                setFilter(f);
                setCurrent(0);
                strip.current?.scrollTo({ left: 0 });
              }}
              className={cn(
                '-mb-px border-b-2 pb-3 text-[12px] font-bold uppercase tracking-[0.22em] transition-colors',
                filter === f ? 'border-primary-500 text-navy-950' : 'border-transparent text-navy-900/50 hover:text-navy-950',
              )}
            >
              {f}
              <span className="ml-2 font-serif text-sm normal-case tracking-normal text-primary-600">
                {f === 'All' ? GALLERY.length : GALLERY.filter((g) => g.tag === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Featured frame */}
        <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
          <button
            type="button"
            onClick={() => setOpen(current)}
            data-cursor="view"
            className="group relative aspect-[16/9] overflow-hidden bg-navy-100 text-left"
            aria-label={`Open full screen: ${item.title}`}
          >
            <AnimatePresence initial={false}>
              <motion.img
                key={item.src}
                {...responsive(item, '(min-width: 1024px) 75vw, 100vw')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <span className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center bg-ivory text-navy-950 opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="h-5 w-5" />
            </span>
          </button>

          <div className="flex flex-row items-end justify-between gap-6 lg:flex-col lg:items-start">
            <div>
              <p className="font-serif text-6xl font-semibold leading-none text-navy-950">
                {String(current + 1).padStart(2, '0')}
                <span className="text-2xl text-navy-900/30"> / {String(items.length).padStart(2, '0')}</span>
              </p>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-primary-700">{item.tag}</p>
              <p className="mt-1 font-serif text-2xl text-navy-950">{item.title}</p>
              <p className="mt-2 hidden text-sm leading-relaxed text-slate-600 sm:block">{item.alt}</p>
            </div>
            <div className="flex gap-2">
              {[-1, 1].map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => step(dir)}
                  aria-label={dir < 0 ? 'Previous photo' : 'Next photo'}
                  className="flex h-14 w-14 items-center justify-center border border-navy-900/20 text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
                >
                  {dir < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact strip */}
        <div ref={strip} className="no-scrollbar mt-6 flex snap-x gap-3 overflow-x-auto pb-2">
          {items.map((g, i) => (
            <button
              key={g.src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Show ${g.title}`}
              aria-pressed={current === i}
              className={cn(
                'relative h-20 w-32 shrink-0 snap-start overflow-hidden transition-all sm:h-24 sm:w-36',
                current === i ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-ivory' : 'opacity-55 hover:opacity-100',
              )}
            >
              <img src={g.sm} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox items={items} index={open} onClose={close} onNav={nav} />}
      </AnimatePresence>
    </section>
  );
}
