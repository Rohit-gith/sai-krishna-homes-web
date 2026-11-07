import { useEffect } from 'react';

/** The admin is always shown in the day theme, even if the visitor chose the site's night view. */
export function useForceDay() {
  useEffect(() => {
    const el = document.documentElement;
    const wasNight = el.classList.contains('night');
    el.classList.remove('night');
    return () => {
      if (wasNight) el.classList.add('night');
    };
  }, []);
}
