import { PHOTOS } from '@/data/projects';

/** "Explore" chapters: each one is its own page at /explore/:slug (kept off the home page; the masterplan lives on the home page itself). */
export const CHAPTERS = [
  { slug: 'virtual-tour', title: '360° Virtual tour', blurb: 'Walk through a 3 BHK home, room by room', photo: PHOTOS.pwGate, art: 'tour' },
  { slug: 'homes', title: 'Homes & floor plans', blurb: 'Type-1 and Type-2 residences, elevations and specs', photo: PHOTOS.skT1Front },
  { slug: 'gallery', title: 'Gallery', blurb: 'Every façade, amenity and view in full screen', photo: PHOTOS.pwPool, art: 'collage' },
  { slug: 'a-day-at-panchawati', title: 'A day at Panchawati', blurb: 'From sunrise to lantern light', photo: PHOTOS.pwDay },
  { slug: 'emi-calculator', title: 'EMI calculator', blurb: 'Plan your monthly instalment in seconds', photo: PHOTOS.pwRooftop, art: 'emi' },
  { slug: 'location', title: 'Location', blurb: 'Map, directions and what is nearby', photo: PHOTOS.skGate, art: 'map' },
];

export const chapterPath = (slug) => `/explore/${slug}`;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
