import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { CHAPTERS, chapterPath } from './chapters';
import ChapterVisual from './ChapterVisual';
import { responsive } from '@/data/projects';
import { cn } from '@/utils/cn';

const ease = [0.22, 1, 0.36, 1];

/**
 * Full-screen "table of contents": numbered serif chapters on the left, a photo that changes
 * with the hovered chapter on the right. Phones get a list with thumbnails.
 */
export default function ExploreMenu({ open, onClose }) {
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const shown = CHAPTERS[hover];

  // Portal to <body>: the sticky header uses backdrop-blur, which would otherwise trap this fixed overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Explore Sai Krishna Homes"
          className="fixed inset-0 z-[60] overflow-y-auto bg-ivory"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div aria-hidden className="bg-jaali pointer-events-none fixed inset-0 opacity-[0.05]" />
          <div className="container relative flex min-h-full flex-col py-6 md:py-8">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary-700">Explore · Sai Krishna Homes</p>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-navy-900 hover:text-primary-700"
              >
                Close <span className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-900/20"><X className="h-5 w-5" /></span>
              </button>
            </div>

            <div className="mt-8 grid flex-1 items-center gap-12 lg:mt-0 lg:grid-cols-[1.1fr_1fr]">
              <ol className="border-t border-navy-900/10">
                {CHAPTERS.map((c, i) => (
                  <motion.li
                    key={c.slug}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 + i * 0.06, ease }}
                    className="border-b border-navy-900/10"
                  >
                    <Link
                      to={chapterPath(c.slug)}
                      onClick={onClose}
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      className="group flex items-center gap-4 py-4 sm:gap-6 md:py-5"
                    >
                      <ChapterVisual chapter={c} className="h-14 w-20 shrink-0 lg:hidden" />
                      <span className="hidden w-10 shrink-0 font-serif text-lg text-primary-500 lg:block">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block font-serif text-[1.6rem] leading-tight transition-colors sm:text-3xl xl:text-[2.6rem]',
                            hover === i ? 'text-navy-950 lg:italic' : 'text-navy-950 lg:text-navy-900/45',
                          )}
                        >
                          {c.title}
                        </span>
                        <span className="mt-1 block text-[13px] text-slate-500 lg:hidden">{c.blurb}</span>
                      </span>
                      <ArrowUpRight
                        className={cn(
                          'h-6 w-6 shrink-0 text-primary-600 transition-all',
                          hover === i ? 'lg:translate-x-0 lg:opacity-100' : 'lg:-translate-x-2 lg:opacity-0',
                        )}
                      />
                    </Link>
                  </motion.li>
                ))}
              </ol>

              {/* Desktop preview */}
              <div className="relative hidden lg:block">
                <div className="rounded-t-full border border-primary-300 p-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-t-full bg-navy-100">
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={shown.slug}
                        initial={{ opacity: 0, scale: 1.06 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease }}
                        className="absolute inset-0"
                      >
                        {shown.art ? (
                          <ChapterVisual chapter={shown} className="h-full w-full" />
                        ) : (
                          <img {...responsive(shown.photo, '40vw')} alt="" className="h-full w-full object-cover" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                <p className="mt-5 flex items-baseline justify-between gap-6 border-t border-navy-900/10 pt-4">
                  <span className="font-serif text-xl text-navy-950">{shown.blurb}</span>
                  <span className="text-outline-gold font-serif text-5xl">{String(hover + 1).padStart(2, '0')}</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
