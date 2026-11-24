import { useEffect, useRef } from 'react';

/*
 * Live screens. The CRM frame (AdminLayout) asks the server every 3 s "did anything change?" and,
 * when an area changed, announces it with a "skh:live" event: detail = ['leads', 'visits', …].
 * A page passes the areas it shows; it refreshes as soon as one of them changes, at once when the
 * person comes back to it (another tab / the phone app brought back), and, as a safety net, every
 * minute. Nothing runs while the screen is hidden.
 */
export const LIVE_EVENT = 'skh:live';

export function useLiveRefresh(refresh, areas = ['any'], fallbackMs = 60 * 1000) {
  const fn = useRef(refresh);
  fn.current = refresh;
  const key = areas.join(',');
  useEffect(() => {
    const wanted = key.split(',');
    const visible = () => document.visibilityState === 'visible';
    const run = () => visible() && fn.current();
    const onLive = (e) => {
      const changed = e.detail || [];
      if (wanted.includes('any') || changed.some((a) => wanted.includes(a))) run();
    };
    const t = setInterval(run, fallbackMs);
    window.addEventListener(LIVE_EVENT, onLive);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('online', run);
    return () => {
      clearInterval(t);
      window.removeEventListener(LIVE_EVENT, onLive);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('online', run);
    };
  }, [key, fallbackMs]);
}
