import { create } from 'zustand';

const KEY = 'skh_theme';
const root = () => document.documentElement;

/**
 * Day / Night look for the whole site. The initial class is applied by an inline script in
 * index.html (before React renders) so the page never flashes the wrong theme.
 */
export const useThemeStore = create((set) => ({
  night: typeof document !== 'undefined' && root().classList.contains('night'),
  toggle: () =>
    set((s) => {
      const night = !s.night;
      const el = root();
      // Animate colours only during the switch, not on every hover.
      el.classList.add('theme-anim');
      el.classList.toggle('night', night);
      setTimeout(() => el.classList.remove('theme-anim'), 700);
      try {
        localStorage.setItem(KEY, night ? 'night' : 'day');
      } catch {
        /* storage blocked: the choice simply isn't remembered */
      }
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', night ? '#0A1513' : '#0E3B32');
      return { night };
    }),
}));
