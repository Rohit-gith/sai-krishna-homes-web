import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import logoImg from '@/assets/logo/logo.png';

const KEY = 'skh_intro_seen';

function shouldPlay() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(KEY) !== '1';
  } catch {
    return false;
  }
}

/** One-time-per-visit brand reveal: the logo rises, then an ivory curtain lifts off the page. */
export default function IntroCurtain() {
  const [show, setShow] = useState(shouldPlay);

  useEffect(() => {
    if (!show) return undefined;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable: the intro simply plays again next time */
    }
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ivory"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          role="presentation"
        >
          <div className="bg-jaali pointer-events-none absolute inset-0 opacity-[0.06]" />
          <motion.span
            className="block h-[3.55rem] w-[4.2rem] overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={logoImg} alt="" className="h-auto w-full" />
          </motion.span>
          <motion.p
            className="mt-5 font-serif text-3xl tracking-[0.16em] text-navy-950 md:text-4xl"
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '0.16em' }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            SAI KRISHNA
          </motion.p>
          <motion.span
            className="mt-3 h-px w-40 origin-left bg-primary-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.p
            className="mt-3 text-[10px] font-bold uppercase tracking-[0.6em] text-primary-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Homes · Since 2010
          </motion.p>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="absolute bottom-8 text-[10px] font-bold uppercase tracking-[0.3em] text-navy-900/50 hover:text-navy-900"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
