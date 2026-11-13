import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/*
 * Scroll management for route changes:
 * - Back / Forward (POP): return to where the visitor was on that page.
 * - New link with a #hash: scroll to that section (waiting for lazy pages to render).
 * - Any other new page: start at the top.
 *
 * The last scroll position is tracked continuously and stored for the OUTGOING page at commit time,
 * before the browser clamps scrollY to the (often shorter) new page.
 */
const KEY = 'skh_scroll_positions';
let positions = {};
try {
  positions = JSON.parse(sessionStorage.getItem(KEY) || '{}');
} catch {
  positions = {};
}
const persist = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(positions));
  } catch {
    /* storage unavailable: positions are still kept in memory */
  }
};

export default function ScrollToTop() {
  const { key: navKey, pathname, hash } = useLocation();
  // Every fresh page load gets the key "default", so the path is part of the id: otherwise the
  // home page's saved position would be applied to a different page opened in the same tab.
  const key = `${navKey}:${pathname}`;
  const navType = useNavigationType();
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const prevKey = useRef(key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const onScroll = () => {
      lastY.current = window.scrollY;
    };
    const onHide = () => {
      positions[prevKey.current] = lastY.current;
      persist();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  useLayoutEffect(() => {
    // Save where we were on the page we are leaving (scroll events are async, so lastY is still accurate).
    if (prevKey.current !== key) {
      positions[prevKey.current] = lastY.current;
      persist();
      prevKey.current = key;
    }

    let timer;
    const saved = positions[key];

    if (navType === 'POP' && typeof saved === 'number') {
      // Lazy pages and images may still be growing: retry until the page is tall enough.
      let tries = 0;
      const restore = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: Math.min(saved, max), behavior: 'instant' });
        lastY.current = window.scrollY;
        if ((max < saved || Math.abs(window.scrollY - saved) > 2) && ++tries < 60) timer = setTimeout(restore, 50);
      };
      restore();
    } else if (hash) {
      let tries = 0;
      timer = setInterval(() => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el || ++tries > 30) {
          clearInterval(timer);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      lastY.current = 0;
    }
    return () => {
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [key, hash, navType]);

  return null;
}
