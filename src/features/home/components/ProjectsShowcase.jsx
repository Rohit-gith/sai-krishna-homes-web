import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import ChapterHeading from './ChapterHeading';
import { PROJECTS, responsive } from '@/data/projects';
import { Link } from 'react-router-dom';
import { projectPath } from '@/data/projectPages';
import { cn } from '@/utils/cn';

/** Expanding panels: the active project grows to reveal its story; the other folds to a slim spine. */
export default function ProjectsShowcase() {
  const [open, setOpen] = useState(0);

  return (
    <section id="projects" className="section scroll-mt-24 bg-white">
      <div className="container">
        <ChapterHeading
          numeral="I"
          label="The addresses"
          title="Two addresses, one promise"
          intro="From a classical boutique residence to a complete township, every Sai Krishna home is planned to add lasting value to your family's life."
        />

        <div className="flex flex-col gap-4 lg:h-[40rem] lg:flex-row">
          {PROJECTS.map((p, i) => {
            const isOpen = open === i;
            return (
              <motion.article
                key={p.id}
                onMouseEnter={() => setOpen(i)}
                data-cursor="view"
                initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 1.2, delay: i * 0.12, ease: [0.76, 0, 0.24, 1] }}
                className={cn(
                  'group relative min-h-[34rem] overflow-hidden bg-navy-900 transition-[flex-grow] duration-700 ease-[cubic-bezier(.22,1,.36,1)] lg:min-h-0',
                  isOpen ? 'lg:flex-[2.4]' : 'lg:flex-[1]',
                )}
              >
                <img
                  {...responsive(p.cover, '(min-width: 1024px) 66vw, 100vw')}
                  loading="lazy"
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out',
                    isOpen ? 'scale-100' : 'scale-110',
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 transition-colors duration-700',
                    isOpen
                      ? 'bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent'
                      : 'bg-navy-950/45 lg:bg-navy-950/55',
                  )}
                />

                {/* Numeral + status */}
                <div className="absolute left-6 right-6 top-6 flex items-start justify-between text-white sm:left-8 sm:right-8 sm:top-8">
                  <span className="font-serif text-5xl leading-none text-white/90">0{i + 1}</span>
                  <span className="border border-white/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em]">
                    {p.status}
                  </span>
                </div>

                {/* Collapsed spine (desktop) */}
                {!isOpen && (
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="absolute inset-0 hidden items-end justify-between p-8 text-left text-white lg:flex"
                    aria-label={`Show ${p.name}`}
                  >
                    <span className="rotate-180 font-serif text-4xl [writing-mode:vertical-rl]">{p.name}</span>
                    <span className="flex h-12 w-12 items-center justify-center border border-white/40 transition-colors group-hover:bg-white group-hover:text-navy-950">
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>
                )}

                {/* Story (always on mobile, when open on desktop) */}
                <AnimatePresence>
                  <motion.div
                    key={isOpen ? 'open' : 'closed'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: isOpen ? 0.25 : 0 }}
                    className={cn(
                      'absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-10',
                      !isOpen && 'lg:hidden',
                    )}
                  >
                    <h3 className="font-serif text-[2rem] font-semibold leading-tight text-white md:text-[2.6rem]">
                      {p.name}
                    </h3>
                    <p className="mt-2 max-w-xl text-[15px] text-primary-100">{p.tagline}</p>

                    <ul className="mt-6 grid max-w-2xl gap-x-8 gap-y-2.5 text-[14px] text-white/85 sm:grid-cols-2">
                      {p.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-3">
                          <span className="h-px w-5 bg-primary-300" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                      <Link
                        to={projectPath(p.id === 'panchawati' ? 'panchawati-residency' : 'sai-krishna-residency')}
                        className="inline-flex items-center justify-center gap-3 bg-ivory px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-950 transition-colors hover:bg-primary-200"
                      >
                        Explore the project <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <div className="hidden gap-2 sm:flex">
                        {p.photos.slice(1).map((ph) => (
                          <img
                            key={ph.src}
                            src={ph.sm}
                            alt={ph.alt}
                            loading="lazy"
                            className="h-16 w-24 border border-white/30 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
