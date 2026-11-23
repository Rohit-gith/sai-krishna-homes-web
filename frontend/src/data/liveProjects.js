import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { LEADERSHIP } from './companyInfo';
import { PROJECT_PAGES } from './projectPages';

/*
 * Projects the owner added in the CRM and switched on for the website ("Show on website").
 * They come from the backend (/api/public/projects) and are shaped like the built-in project pages,
 * so the Projects page, the menu and the booking form treat every project the same way.
 */
export const LIVE_STATUS = {
  upcoming: 'Upcoming project',
  ongoing: 'Current project',
  ready: 'Ready to move',
  completed: 'Completed project',
};
const [CMO, GM] = LEADERSHIP.contacts;

/** Backend record → the shape the website pages use. */
export function toPage(x) {
  const photos = (x.photos || []).map((ph) => ({ src: ph.url, sm: ph.url, alt: ph.alt || x.name }));
  const cover = photos[0] || null;
  return {
    ...x,
    live: true,
    statusId: x.status,
    status: LIVE_STATUS[x.status] || 'Current project',
    headline: x.tagline,
    startingFrom: x.startingPrice || null,
    configs: x.configs || [],
    photos,
    card: cover,
    hero: cover,
    about: String(x.about || '')
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .filter(Boolean),
    stats: [
      [x.units, 'Homes'],
      [x.land, 'Land area'],
      [x.possession, 'Possession'],
      [(x.configs || []).join(' · '), 'Home types'],
    ].filter(([v]) => v),
    contact: x.contact === 'gm' ? GM : CMO,
  };
}

const useLiveStore = create((set, get) => ({
  list: [],
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const r = await fetch('/api/public/projects');
      const list = r.ok ? await r.json() : [];
      set({ list: Array.isArray(list) ? list.map(toPage) : [], loaded: true, loading: false });
    } catch {
      set({ loaded: true, loading: false }); // the website still works with the built-in projects
    }
  },
}));

/** Every project on the website: the two built-in ones first, then the owner's live ones. */
export function useProjectList() {
  const live = useLiveStore((s) => s.list);
  const load = useLiveStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);
  return useMemo(() => [...PROJECT_PAGES, ...live.filter((p) => p.card)], [live]);
}
