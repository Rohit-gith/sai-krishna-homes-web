/**
 * Home-page "Compare" section. Facts come from the client's own documents (projectPages.js /
 * pricing.js), the Odisha RERA record and Google Maps (distances, see LANDMARKS).
 * Do NOT add competitor prices or "cheapest / best" claims without written proof from the client
 * (RERA s.12 / ASCI: misleading property advertising is penalised).
 */
import { PANCHAWATI_PRICES } from './pricing';
import { PROJECT_PAGES } from './projectPages';

const minPrice = Math.min(...PANCHAWATI_PRICES.blocks.flatMap((b) => b.rows.map((r) => r.price)));
const page = (slug) => PROJECT_PAGES.find((p) => p.slug === slug);

/** Lowest listed home price (Panchawati price list), used in the "affordable" banner. */
export const STARTING_FROM = minPrice;

/**
 * Price check: Panchawati's rate per sq ft (listed price ÷ super built-up area, from the client's
 * price list) against the Patia locality average published by Square Yards (page read 13 Nov 2026,
 * "Patia ₹6,950 per sq ft"; the page's figures are dated September 2026). Only claims we can show:
 * every listed Panchawati flat is below that average. Update MARKET when the portal figure changes.
 */
const pwRows = PANCHAWATI_PRICES.blocks.flatMap((b) => b.rows);
const pwRates = pwRows.map((r) => r.price / r.sbu);
export const PRICE_CHECK = {
  market: {
    area: 'Patia',
    rate: 6950,
    source: 'Square Yards, Patia locality rate',
    url: 'https://www.squareyards.com/property-rates/bhubaneswar-north',
    asOf: 'Sep 2026',
  },
  ours: {
    name: 'Panchawati Residency',
    avg: Math.round(pwRates.reduce((a, b) => a + b, 0) / pwRates.length),
    min: Math.round(Math.min(...pwRates)),
    max: Math.round(Math.max(...pwRates)),
    flats: pwRows.length, // rows on the price list = flat types (one row can cover several flats)
  },
  exampleSqft: 1300, // a typical Panchawati 2 BHK (super built-up 1,291–1,428 sq ft)
  included: ['1 car parking', 'Electrification', 'Internal & external development charges (IDC & EDC)'],
};

export const COMPARE_PROJECTS = [
  {
    slug: 'panchawati-residency',
    name: 'Panchawati Residency',
    place: 'Patia, Bhubaneswar',
    photo: '/images/panchawati/day-view-sm.webp',
    mapsQuery: 'Panchawati Residency, Patia, Bhubaneswar',
    reraUrl: page('panchawati-residency').reraUrl,
  },
  {
    slug: 'sai-krishna-residency',
    name: 'Sai Krishna Residency',
    place: 'South Bhubaneswar',
    photo: '/images/projects/skr/banner-night-sm.webp',
    mapsQuery: '20.2080265,85.7453687',
    reraUrl: page('sai-krishna-residency').reraUrl,
  },
];

/**
 * At-a-glance rows: [label, Panchawati, Sai Krishna]. Units, building height, approving authority,
 * possession and RERA numbers are exactly as registered on the Odisha RERA portal (checked 13 Nov 2026).
 */
export const COMPARE_FACTS = [
  ['Homes', '1, 2 & 3 BHK', '1, 2 & 3 BHK'],
  ['Starting price', `₹${(minPrice / 1e5).toFixed(2).replace(/\.?0+$/, '')} L*`, 'On request'],
  ['Units (RERA)', '120 homes · S+4', '497 units · S+6'],
  ['Amenities', '20 amenities & services', '25+ at the Sports Arena'],
  ['Parking', '1 car park included in price', '900+ parking spaces'],
  ['Plan approved by', 'Bhubaneswar Development Authority', 'DUDA, Khordha'],
  ['Possession (RERA)', 'Nov 2027', 'May 2028'],
  ['RERA', page('panchawati-residency').rera, page('sai-krishna-residency').rera],
];
export const PRICE_NOTE = '*Lowest listed price, Panchawati price list. GST & registration extra (approx. 11–12%).';

/** Feature checklist: [feature, Panchawati, Sai Krishna]. Grouped so green features stand out. */
export const COMPARE_FEATURES = [
  ['Green living', [
    ['Rooftop solar panels', true, false],
    ['Rainwater harvesting', true, false],
    ['Sewerage treatment plant (STP)', true, false],
    ['EV charging', true, false],
    ['Lush green open spaces', false, true],
  ]],
  ['Lifestyle', [
    ['Swimming pool', true, true],
    ['Gym', true, true],
    ['Jogging track', true, true],
    ["Kids' play area", true, true],
    ['Community / society hall', true, true],
    ['Yoga room', true, false],
    ['Senior citizen seating', true, false],
    ['Basketball & badminton courts', false, true],
    ['Temple & market complex', false, true],
  ]],
  ['Safety & comfort', [
    ['24/7 gated security', true, true],
    ['Power backup', true, true],
    ['Lifts in every block', true, true],
    ['Fire protection', true, false],
    ['Intercom', true, false],
  ]],
];

/**
 * Real photos of the landmarks, from Wikimedia Commons (CC BY-SA). The licence requires the
 * photographer credit + licence link, which the site shows under the cards. Only the real place
 * gets its photo (e.g. Retang station does NOT reuse the Bhubaneswar station photo).
 */
export const PHOTO_CREDITS = {
  utkal: ['Government of Odisha', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Utkal_Hospital.jpg'],
  'esplanade-one': ['Soumendra Kumar Sahoo', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Esplanade_one_mall,_Rasulgarh.jpg'],
  baramunda: ['Anubhav2010', 'CC0', 'https://commons.wikimedia.org/wiki/File:ISBT_Baramunda_Bhubaneswar.jpg'],
  // Photos supplied by the project team (14 Nov 2026).
  'patia-station': ['Patia station photo', 'courtesy', null],
  'sai-international': ['Sai International School photo', 'courtesy', null],
  apollo: ['Apollo Hospitals photo', 'courtesy', null],
  'dn-regalia': ['DN Regalia Mall photo', 'courtesy', null],
  airport: ['Aditya Mahar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Biju_Patnaik_Airport_Bhubaneswar.jpg'],
  railway: ['Ajit kumar sahu19w', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Bhubaneswar_railway_station.jpg'],
  kiit: ['La Azara', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:KIIT_University.jpg'],
  iit: ['Monsterthinks', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:IITBBS.jpg'],
  aiims: ['Krupasindhu Muduli', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:AIIMS_Bhubaneswar_01.jpg'],
  kims: ['Amartyabag', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Kims_casualty.jpg'],
  rbi: ['Subhrasingh', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:RBI_Bhubaneswar.jpg'],
  // Places with no free photo: a map of the exact spot (OpenStreetMap, pin = the place itself).
  // Photo supplied by the project team (13 Nov 2026), credited to the school.
  odm: ['ODM Public School', 'courtesy', null],
  // Photo supplied by the project team (13 Nov 2026).
  retang: ['Retang station photo', 'courtesy', null],
  infosys: ['rajagopal_rajeev', 'CC BY 2.0', 'https://www.flickr.com/photos/25185529@N00/7854968142'],
};

/**
 * One nearby place. km = road distance in km (number) when known; time = drive time text when only
 * that is published; photo = key into /images/nearby; q = Google Maps search text for the live route.
 */
const L = (name, cat, { km = null, mins = null, time = null, q = null, photo = null, at = null } = {}) => ({ name, cat, km, mins, time, q, photo, at });

/**
 * Panchawati: road distances from Google Maps (fastest driving route from the project's own Google
 * Maps listing, Patia, checked 13 Nov 2026), so they match what a visitor sees on "live route".
 * Sai Krishna: the client's published figures, until the project's exact map pin is confirmed (the
 * Google Maps listing for it does not match the RERA address, so it is NOT used for distances).
 */
/** Project location used to work out each place's direction. Both from the projects' own Google Maps listings. */
export const ORIGIN = {
  'panchawati-residency': [20.3558912, 85.8405083], // Google listing, Patia
  'sai-krishna-residency': [20.2080265, 85.7453687], // Google listing, Pandiapada (~2 km from Retang station)
};

export const DISTANCE_SOURCE = {
  'panchawati-residency': 'Drive times and distances from Google Maps (fastest route, Nov 2026); times vary with traffic.',
  'sai-krishna-residency': 'Drive times from Google Maps (fastest route, Nov 2026); times vary with traffic.',
};

export const LANDMARKS = {
  'panchawati-residency': [
    // mins + at (lat, lng): Google Maps, fastest driving route from Panchawati, 14 Nov 2026
    L('Patia Railway Station', 'Railway', { km: 1, mins: 4, at: [20.3469265, 85.8414745], q: 'Patia Railway Station, Bhubaneswar', photo: 'patia-station' }),
    L('KIIT Square', 'College', { km: 2.7, mins: 9, at: [20.3534389, 85.8268315], q: 'KIIT Square, Patia, Bhubaneswar', photo: 'kiit' }),
    L('ODM Public School', 'School', { km: 4.9, mins: 14, at: [20.3451533, 85.8184683], q: 'ODM Public School, Bhubaneswar', photo: 'odm' }),
    L('Sai International School', 'School', { km: 5.4, mins: 15, at: [20.3444948, 85.8149512], q: 'Sai International School, Bhubaneswar', photo: 'sai-international' }),
    L('KIMS Hospital', 'Hospital', { km: 4.4, mins: 17, at: [20.3519291, 85.8133651], q: 'KIMS Hospital, Bhubaneswar', photo: 'kims' }),
    L('Infosys Bhubaneswar', 'IT hub', { km: 6.3, mins: 17, at: [20.3411869, 85.8031549], q: 'Infosys Limited, Infocity, Chandrasekharpur, Bhubaneswar', photo: 'infosys' }),
    L('Esplanade One Mall', 'Mall', { km: 8.8, mins: 21, at: [20.2913331, 85.8565252], q: 'Esplanade One Mall, Rasulgarh, Bhubaneswar', photo: 'esplanade-one' }),
    L('Utkal Hospital', 'Hospital', { km: 8.5, mins: 22, at: [20.3225785, 85.8004278], q: 'Utkal Hospital, Bhubaneswar', photo: 'utkal' }),
    L('Apollo Hospitals', 'Hospital', { km: 10, mins: 27, at: [20.3063554, 85.832169], q: 'Apollo Hospitals, Sainik School Road, Bhubaneswar', photo: 'apollo' }),
    L('Biju Patnaik International Airport', 'Airport', { km: 14.5, mins: 37, at: [20.2506821, 85.8145388], q: 'Biju Patnaik International Airport, Bhubaneswar', photo: 'airport' }),
  ],
  'sai-krishna-residency': [
    // mins + at: Google Maps, fastest driving route from Sai Krishna Residency's Google listing
    // (Pandiapada, 20.2080265, 85.7453687), 14 Nov 2026.
    L('Retang Railway Station', 'Railway', { km: 2.1, mins: 6, at: [20.19929, 85.76075], q: 'Retang Railway Station', photo: 'retang' }),
    L('DN Regalia Mall', 'Mall', { km: 12.7, mins: 23, at: [20.2409448, 85.7583554], q: 'DN Regalia Mall, Patrapada, Bhubaneswar', photo: 'dn-regalia' }),
    L('IT Parks · Infocity-II', 'IT hub', { km: 10.6, mins: 23, at: [20.2365174, 85.6926267], q: 'Infocity 2, Bhubaneswar', photo: 'infosys' }),
    L('AIIMS Bhubaneswar', 'Hospital', { km: 14.1, mins: 25, at: [20.2312962, 85.7744788], q: 'AIIMS Bhubaneswar', photo: 'aiims' }),
    L('Baramunda ISBT (Bus Stand)', 'Bus', { km: 15.5, mins: 25, at: [20.2712295, 85.7905174], q: 'Baramunda Bus Stand, Bhubaneswar', photo: 'baramunda' }),
    L('Reserve Bank of India', 'RBI', { km: 21, mins: 36, at: [20.2743478, 85.8346241], q: 'RBI Bhubaneswar', photo: 'rbi' }),
    L('Biju Patnaik International Airport', 'Airport', { km: 20.7, mins: 37, at: [20.2506821, 85.8145388], q: 'Biju Patnaik International Airport, Bhubaneswar', photo: 'airport' }),
    L('IIT Bhubaneswar', 'Institute', { km: 16.2, mins: 37, at: [20.1483345, 85.6712472], q: 'IIT Bhubaneswar, Argul', photo: 'iit' }),
  ],
};


export const routeUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
