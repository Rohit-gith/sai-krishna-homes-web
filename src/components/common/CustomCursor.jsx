import { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

const LABELS = { view: 'View', drag: 'Drag' };

function enabled() {
  try {
    return (
      window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/**
 * Desktop-only follower ring. Grows into a "View" / "Drag" badge over elements marked with
 * data-cursor="view" | "drag", and swells slightly over links and buttons. The native pointer is
 * kept visible, so nothing about how the page is used changes.
 */
export default function CustomCursor() {
  const [on] = useState(enabled);
  const [mode, setMode] = useState('default'); // default | link | view | drag
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  useEffect(() => {
    if (!on) return undefined;
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e) => {
      const t = e.target instanceof Element ? e.target : null;
      const tagged = t?.closest('[data-cursor]');
      const link = t?.closest('a, button, [role="tab"], select, input:not([type="range"])');
      // A link/button *inside* a tagged area wins (e.g. the brochure link inside a project panel);
      // a tagged element that is itself a button keeps its View/Drag badge.
      if (link && link !== tagged && (!tagged || tagged.contains(link))) return setMode('link');
      if (tagged) return setMode(tagged.getAttribute('data-cursor'));
      return setMode('default');
    };
    const leave = () => setVisible(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [on, x, y]);

  if (!on) return null;

  const big = mode === 'view' || mode === 'drag';
  const size = big ? 84 : mode === 'link' ? 48 : 30;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden items-center justify-center rounded-full border lg:flex"
      style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      animate={{
        width: size,
        height: size,
        opacity: visible ? 1 : 0,
        backgroundColor: big ? 'rgba(14, 59, 50, 0.92)' : 'rgba(184, 139, 62, 0)',
        borderColor: big ? 'rgba(14, 59, 50, 0)' : 'rgba(184, 139, 62, 0.85)',
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      initial={false}
    >
      {big && (
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-200"
        >
          {LABELS[mode]}
        </motion.span>
      )}
    </motion.div>
  );
}
