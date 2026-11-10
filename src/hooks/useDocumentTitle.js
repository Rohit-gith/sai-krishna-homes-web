import { useEffect } from 'react';
import { COMPANY } from '@/data/companyInfo';

// Live address of the site. Change this one line when the client's own domain is connected.
export const SITE_URL = 'https://sai-krishna-homes-web.vercel.app';

const DEFAULT_DESCRIPTION =
  'Sai Krishna Homes Pvt. Ltd. — premium residences in Bhubaneswar since 2010. Panchawati Residency, Patia and Sai Krishna Residency, South Bhubaneswar. RERA approved.';

/** Find or create a <meta>/<link> tag in <head> and set one attribute on it. */
function setHead(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(create.tag);
    Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Per-page SEO: browser tab title, search-result description, canonical URL and the
 * title/description/URL used in link previews (WhatsApp, Facebook, LinkedIn).
 */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${COMPANY.shortName}` : `${COMPANY.shortName} | Premium Residences in Bhubaneswar`;
    const desc = description || DEFAULT_DESCRIPTION;
    const url = SITE_URL + window.location.pathname;

    document.title = fullTitle;
    setHead('meta[name="description"]', { tag: 'meta', attrs: { name: 'description' } }, 'content', desc);
    setHead('link[rel="canonical"]', { tag: 'link', attrs: { rel: 'canonical' } }, 'href', url);
    setHead('meta[property="og:title"]', { tag: 'meta', attrs: { property: 'og:title' } }, 'content', fullTitle);
    setHead('meta[property="og:description"]', { tag: 'meta', attrs: { property: 'og:description' } }, 'content', desc);
    setHead('meta[property="og:url"]', { tag: 'meta', attrs: { property: 'og:url' } }, 'content', url);
  }, [title, description]);
}
