import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * Photo that unveils bottom-to-top as it enters the viewport, then drifts gently with scroll
 * (parallax). The image is slightly oversized so the drift never exposes an edge.
 * Users with "reduce motion" get a static image (MotionConfig reducedMotion="user").
 */
export default function ParallaxImage({ img, className, imgClassName, strength = 8, reveal = true }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);

  return (
    <motion.div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      initial={reveal ? { clipPath: 'inset(100% 0% 0% 0%)' } : false}
      whileInView={reveal ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.img
        {...img}
        loading="lazy"
        style={{ y, scale: 1 + (strength * 2.2) / 100 }}
        className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
      />
    </motion.div>
  );
}
