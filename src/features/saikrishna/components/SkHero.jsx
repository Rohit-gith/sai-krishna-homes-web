import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import { SK, SK_CONFIGS, SK_STATS } from '../data';

const ease = [0.22, 1, 0.36, 1];
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay, ease },
});

export default function SkHero({ onEnquire }) {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-sk-ink">
      {/* Background: aerial night render with slow cinematic zoom */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/saikrishna/hero-aerial.webp"
          alt="Aerial night view of the Sai Krishna Homes township, Bhubaneswar"
          className="h-full w-full animate-kenburns object-cover object-center"
          fetchpriority="high"
        />
        {/* Readability + mood overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-sk-ink via-sk-ink/70 to-sk-ink/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-sk-ink via-transparent to-sk-ink/60" />
        <div className="absolute -left-40 top-1/3 h-[36rem] w-[36rem] rounded-full bg-sk-gold/10 blur-[120px]" />
      </div>

      {/* Fine gold frame lines */}
      <div className="pointer-events-none absolute inset-x-4 bottom-0 top-24 -z-10 hidden border-x border-white/[0.04] sm:inset-x-6 lg:inset-x-10 lg:block" />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 pb-8 pt-28 sm:px-6 md:pt-32 lg:px-10">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.35fr_1fr]">
          {/* Copy */}
          <div className="max-w-2xl">
            <motion.p
              {...rise(0.1)}
              className="flex items-center gap-4 font-lux text-[11px] font-semibold uppercase tracking-[0.35em] text-sk-gold"
            >
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-sk-gold" />
              Est. {SK.established} · Bhubaneswar
            </motion.p>

            <motion.h1
              {...rise(0.2)}
              className="mt-7 font-serif text-[3.1rem] font-medium leading-[0.95] tracking-tight text-sk-ivory sm:text-7xl lg:text-[5.4rem]"
            >
              We shape the{' '}
              <em className="bg-[linear-gradient(110deg,#9C7A35_20%,#F1DDA8_40%,#C9A65A_60%,#9C7A35_80%)] bg-[length:200%_100%] bg-clip-text pr-2 font-medium text-transparent animate-shimmer">
                essence
              </em>
              <br className="hidden sm:block" /> of living.
            </motion.h1>

            <motion.p
              {...rise(0.35)}
              className="mt-7 max-w-xl font-lux text-base leading-relaxed text-sk-ivory/70 sm:text-lg"
            >
              A 6-acre gated township of 500+ homes in Southern Bhubaneswar, with resort-style amenities, a
              shopping hub inside the gates, and every approval in place.
            </motion.p>

            <motion.div {...rise(0.45)} className="mt-8 flex flex-wrap items-center gap-2.5">
              <span className="mr-1 font-lux text-xs uppercase tracking-[0.2em] text-sk-mist">Available in</span>
              {SK_CONFIGS.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-sk-gold/30 bg-white/[0.03] px-4 py-1.5 font-lux text-sm text-sk-ivory backdrop-blur"
                >
                  {c}
                </span>
              ))}
            </motion.div>

            <motion.div {...rise(0.55)} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => onEnquire()}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-sk-gold-deep via-sk-gold to-sk-gold-light px-8 py-4 font-lux text-sm font-bold uppercase tracking-[0.18em] text-sk-ink shadow-[0_10px_40px_-10px_rgba(201,166,90,0.6)] transition-transform hover:scale-[1.02]"
              >
                Book a Site Visit
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <a
                href={`tel:${SK.phone}`}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 px-7 py-4 font-lux text-sm font-medium text-sk-ivory backdrop-blur transition-colors hover:border-sk-gold hover:text-sk-gold-light"
              >
                <Phone className="h-4 w-4 text-sk-gold" /> {SK.phoneDisplay}
              </a>
            </motion.div>

            <motion.div {...rise(0.65)} className="mt-7 flex items-center gap-3 font-lux text-sm text-sk-ivory/70">
              <span className="flex text-sk-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </span>
              <span>
                <strong className="font-semibold text-sk-ivory">4.8</strong> from 1,000+ resident reviews
              </span>
            </motion.div>
          </div>

          {/* Featured project card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.7, ease }}
            className="hidden justify-self-end lg:block"
          >
            <div className="w-[22rem] rounded-[1.75rem] border border-white/10 bg-sk-ink/40 p-3 shadow-2xl backdrop-blur-2xl">
              <div className="relative overflow-hidden rounded-[1.25rem]">
                <img
                  src="/saikrishna/panchawati-residency.webp"
                  alt="Panchawati Residency at dusk"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute left-3 top-3 rounded-full bg-sk-ink/70 px-3 py-1 font-lux text-[10px] font-semibold uppercase tracking-[0.2em] text-sk-gold-light backdrop-blur">
                  Now booking
                </span>
              </div>
              <div className="px-3 pb-3 pt-5">
                <p className="font-serif text-2xl text-sk-ivory">Panchawati Residency</p>
                <p className="mt-1 flex items-center gap-1.5 font-lux text-xs text-sk-mist">
                  <MapPin className="h-3.5 w-3.5 text-sk-gold" /> Patia, Bhubaneswar
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="flex items-center gap-1.5 font-lux text-xs text-sk-ivory/80">
                    <ShieldCheck className="h-4 w-4 text-sk-gold" /> RERA approved
                  </span>
                  <button
                    type="button"
                    onClick={() => onEnquire('Panchawati Residency')}
                    className="group flex items-center gap-1.5 font-lux text-xs font-semibold uppercase tracking-[0.15em] text-sk-gold-light"
                  >
                    Enquire
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-10 grid grid-cols-2 border-t border-white/10 md:grid-cols-4"
        >
          {SK_STATS.map((s, i) => (
            <div
              key={s.label}
              className={`py-6 md:py-7 ${i % 2 ? 'pl-5 md:pl-8' : 'pr-5 md:pr-8'} ${i > 0 ? 'md:border-l md:border-white/10 md:pl-8' : ''} ${i % 2 ? 'border-l border-white/10' : ''} ${i > 1 ? 'border-t border-white/10 md:border-t-0' : ''}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="font-serif text-4xl text-sk-ivory md:text-5xl">
                  {s.value}
                  {s.suffix && <span className="ml-1.5 text-2xl text-sk-gold md:text-3xl">{s.suffix}</span>}
                </span>
                <span className="mt-1.5 block font-lux text-[11px] uppercase tracking-[0.2em] text-sk-mist">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        className="absolute bottom-10 right-6 hidden flex-col items-center gap-3 lg:right-10 xl:flex"
        aria-label="Scroll to next section"
      >
        <span className="font-lux text-[10px] uppercase tracking-[0.4em] text-sk-mist [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span className="relative h-16 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-scrollcue bg-sk-gold" />
        </span>
      </a>
    </section>
  );
}
