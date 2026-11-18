import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { cn } from '@/utils/cn';

/** Sun/moon switch between the day and night look of the site. */
export default function ThemeToggle({ className }) {
  const night = useThemeStore((s) => s.night);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={night}
      aria-label={night ? 'Switch to day view' : 'Switch to night view'}
      title={night ? 'Day view' : 'Night view'}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-navy-900/20 text-navy-900 transition-colors hover:border-primary-400 hover:text-primary-700',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={night ? 'moon' : 'sun'}
          initial={{ y: 18, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -18, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.3 }}
        >
          {night ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
