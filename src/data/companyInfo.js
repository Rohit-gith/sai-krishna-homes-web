/**
 * Company details used across the site (TopBar, Footer, Contact page, etc.)
 * Update here once and it changes everywhere.
 */
export const COMPANY = {
  name: 'Sai Krishna Homes Pvt. Ltd.',
  shortName: 'Sai Krishna Homes',
  tagline: 'We shape the essence of living.',
  established: '2010',
  phone: '9178255757',
  phoneDisplay: '+91 91782 55757',
  whatsapp: '919178255757',
  email: 'saikrishnahomes@gmail.com',
  address: '6RWM+VR9, Rath Rd, Shiva Nagar, Old Town, Bhubaneswar, Odisha 751002',
  // Plus code of the written site-office address. NOTE: the old website's map link pointed to
  // 20.2074357,85.7453264 (near Mahura / Retang Rd), a different place; confirm with the client
  // whether that is the project site.
  plusCode: '6RWM+VR9 Bhubaneswar',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=6RWM%2BVR9%20Bhubaneswar',
  cin: '', // TODO: add Sai Krishna Homes' CIN (shown only when filled)
  incorporated: '2010',
  workingHours: 'Mon – Sat, 10:00 AM – 6:00 PM',
  social: {
    facebook: 'https://www.facebook.com/people/Sai-Krishna-Residency/61590891552291/',
    instagram: 'https://www.instagram.com/sai_krishna_homes_/',
    linkedin: '#',
    twitter: '#',
  },
};

/** People shown on the website (from the client's existing site). Phones are dialable as written. */
export const LEADERSHIP = {
  md: {
    name: 'Shashi Sekhar Garabadu',
    role: 'Managing Director',
    badge: 'Official MD',
    photo: '/images/team/managing-director.webp',
    photoBg: '#cfceb9',
    photoPos: '41% 30%',
  },
  contacts: [
    { name: 'Shyam Prashad Misra', role: 'Chief Marketing Officer (CMO)', badge: 'Official CMO', phone: '918342948803', phoneDisplay: '+91 83429 48803', photo: '/images/team/shyam-prashad-misra.webp', photoBg: '#eeecf4', photoAspect: 768 / 1364, photoPos: '50% 22%' },
    // Photo labelled "Devarshi Negi, Sales & Marketing (GM)" on the old Sai Krishna Residency page. TODO: confirm with client.
    { name: 'Devarshi Negi', role: 'General Manager (GM) – Sales & Marketing', badge: 'Official GM', phone: '919178255757', phoneDisplay: '+91 91782 55757', photo: '/images/team/devarshi-negi.webp', photoBg: '#f4f6fa', photoAspect: 900 / 752, photoPos: '50% 30%' },
  ],
};

export const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
