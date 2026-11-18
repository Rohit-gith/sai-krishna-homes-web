import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

/** Round "back to top" button with a gold ring showing how far down the page you are. */
export default function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          // Phones: sits above the Call/WhatsApp bar. Desktop: above the WhatsApp bubble.
          className="group fixed bottom-[5.25rem] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-white shadow-xl lg:bottom-[6.5rem] lg:right-6 lg:h-14 lg:w-14"
        >
          <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
            <motion.circle cx="28" cy="28" r="25" fill="none" stroke="#CFA557" strokeWidth="2.5" strokeLinecap="round" style={{ pathLength: progress }} />
          </svg>
          <ArrowUp className="relative h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
