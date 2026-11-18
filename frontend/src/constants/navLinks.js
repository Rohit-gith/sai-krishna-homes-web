import { ROUTES } from './routes';
import { chapterPath } from '@/features/explore/chapters';

/** Links with a hash scroll to a section on the home page (handled by ScrollToTop). */
export const NAV_LINKS = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'Projects', to: '/projects', side: 'left' },
  { label: 'Amenities', to: '/#amenities', hash: true, side: 'left' },
  { label: 'About', to: ROUTES.ABOUT },
  { label: 'Contact', to: ROUTES.CONTACT },
];

export const BOOK_VISIT = '/#book-visit';

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', to: ROUTES.ABOUT },
    { label: 'Contact Us', to: ROUTES.CONTACT },
    { label: 'Privacy Policy', to: ROUTES.PRIVACY_POLICY },
    { label: 'Terms & Conditions', to: ROUTES.TERMS },
  ],
  explore: [
    { label: 'Panchawati Residency', to: '/projects/panchawati-residency' },
    { label: 'Sai Krishna Residency', to: '/projects/sai-krishna-residency' },
    { label: 'Past projects', to: '/projects?tab=past' },
    { label: 'Amenities', to: '/#amenities' },
    { label: 'Homes & floor plans', to: chapterPath('homes') },
    { label: '360° Virtual tour', to: chapterPath('virtual-tour') },
    { label: 'Masterplan', to: '/#masterplan' },
    { label: 'Gallery', to: chapterPath('gallery') },
    { label: 'EMI calculator', to: chapterPath('emi-calculator') },
    { label: 'Location', to: chapterPath('location') },
    { label: 'Book a site visit', to: BOOK_VISIT },
  ],
};
