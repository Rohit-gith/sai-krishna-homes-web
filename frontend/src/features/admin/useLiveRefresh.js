import { useEffect, useRef } from 'react';

/**
 * Keep a screen up to date by itself: run `refresh` every `ms` while the page is on screen, and at
 * once when the person comes back to it (another tab, or the phone app brought back from the
 * background). Nothing runs while it is hidden, so it costs no data or battery in the background.
 */
export function useLiveRefresh(refresh, ms = 30000) {
  const fn = useRef(refresh);
  fn.current = refresh;
  useEffect(() => {
    const run = () => document.visibilityState === 'visible' && fn.current();
    const t = setInterval(run, ms);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('online', run);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('online', run);
    };
  }, [ms]);
}
