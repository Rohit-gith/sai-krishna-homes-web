import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Plus } from 'lucide-react';
import ChapterHeading from '@/features/home/components/ChapterHeading';
import { cn } from '@/utils/cn';

/** "Have Questions?" accordion for a project page. */
export default function ProjectFaq({ project, numeral, onEnquire }) {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section bg-white">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-44 lg:self-start">
          <ChapterHeading
            numeral={numeral}
            label="Have questions?"
            title="Frequently asked questions"
            intro={`Find answers to the most commonly asked questions about ${project.name}`}
            className="mb-8 border-0 pb-0 md:mb-8 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr]"
          />
          <p className="font-serif text-xl text-navy-950">Still have questions? We&apos;re happy to help!</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a href={`tel:+${project.contact.phone}`} className="inline-flex items-center justify-center gap-2 bg-navy-900 px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-navy-800">
              <Phone className="h-4 w-4 text-primary-300" /> Call us now
            </a>
            <button type="button" onClick={onEnquire} className="inline-flex items-center justify-center border border-navy-900/20 px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-navy-900 hover:border-primary-400">
              Send enquiry
            </button>
          </div>
        </div>

        <ul className="border-t border-navy-900/10">
          {project.faq.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <li key={q} className="border-b border-navy-900/10">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="flex gap-4">
                    <span className="font-serif text-sm text-primary-500">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-serif text-lg text-navy-950 md:text-xl">{q}</span>
                  </span>
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all', isOpen ? 'rotate-45 border-navy-900 bg-navy-900 text-white' : 'border-navy-900/20 text-navy-900')}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="pb-6 pl-9 text-[15.5px] leading-[1.8] text-slate-600">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
