import { useEffect } from 'react';

/**
 * Makes casual copying of the site's photos and videos harder: no right-click / long-press menu
 * ("Save image as…"), no dragging images to the desktop, no Ctrl+S page save.
 * This is a deterrent only. Anything a browser shows can still be screenshotted or pulled from
 * the network tab; it is not real protection.
 */
const isMedia = (el) => el instanceof Element && !!el.closest('img, video, picture, svg image, [data-protect]');

export default function MediaGuard() {
  useEffect(() => {
    const block = (e) => {
      if (isMedia(e.target)) e.preventDefault();
    };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.preventDefault();
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return null;
}
