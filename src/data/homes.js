/**
 * "Choose your home": one clear card per configuration (1, 2 and 3 BHK only) for each project.
 *
 * Sources (nothing here is guessed):
 *  - Panchawati areas and prices: computed from the client's price list (pricing.js), so they stay in
 *    step with it. Areas in sq ft; prices before GST & registration.
 *  - Bedrooms / toilets / balconies / rooms: counted on the client's floor-plan drawings.
 *  - Sai Krishna total areas: as published on the client's floor plans (no price list yet).
 *  - Key features: the project's own specification sheet (projectPages.js).
 */
import { PANCHAWATI_PRICES } from './pricing';

const plan = (name, alt, label) => ({ src: `/images/projects/${name}.webp`, alt, label });

/** Count flats in a price-list row, e.g. "102 / 302" → 2. */
const flatCount = (flats) => String(flats).split('/').filter((x) => x.trim()).length;

/** Min/max of carpet, balcony, super built-up and price for one BHK type in the Panchawati price list. */
function fromPriceList(type) {
  const rows = PANCHAWATI_PRICES.blocks.flatMap((b) => b.rows.filter((r) => r.type === type).map((r) => ({ ...r, block: b.id })));
  const range = (k) => [Math.min(...rows.map((r) => r[k])), Math.max(...rows.map((r) => r[k]))];
  return {
    carpet: range('carpet'),
    balcony: range('balcony'),
    sbu: range('sbu'),
    price: range('price'),
    blocks: [...new Set(rows.map((r) => r.block))].sort(),
    flats: rows.reduce((n, r) => n + flatCount(r.flats), 0),
  };
}

export const HOMES = {
  'panchawati-residency': {
    priceNote: 'Price includes 1 car parking, electrification, IDC & EDC. GST & registration extra (approx. 11–12%).',
    features: [
      'Vitrified flooring in every room',
      'Granite kitchen counter with stainless steel sink',
      'Branded CP fittings and porcelain wash basins',
      'Glazed aluminium windows',
      'AC power points in all bedrooms and the living room',
      '2 lifts in Blocks A & B, 1 in Block C; generator backup',
    ],
    facilities: ['Swimming pool', 'Modern gym', 'Yoga room', 'A/C society hall', 'Rooftop solar', 'EV charging', '24/7 security'],
    types: [
      {
        id: '1bhk',
        label: '1 BHK',
        tagline: 'A smart first home for singles and young couples.',
        bedrooms: 1,
        toilets: 1,
        balconies: '1',
        rooms: ['1 Bedroom', 'Drawing / Dining', 'Kitchen', '1 Toilet', '1 Balcony'],
        ...fromPriceList('1 BHK'),
        plans: [plan('pw/block-c-1bhk', 'Block C, 1 BHK floor plan (904 sq ft)', 'Block C · 904 sq ft')],
      },
      {
        id: '2bhk',
        label: '2 BHK',
        tagline: 'Room to grow, with a master bedroom and two toilets.',
        bedrooms: 2,
        toilets: 2,
        balconies: '1',
        rooms: ['Master bedroom', '1 Bedroom', 'Drawing', 'Dining', 'Kitchen', '2 Toilets', '1 Balcony'],
        ...fromPriceList('2 BHK'),
        plans: [
          plan('pw/block-a-2bhk', 'Block A, 2 BHK floor plan (1,428 sq ft)', 'Block A · 1,428 sq ft'),
          plan('pw/block-b-2bhk', 'Block B, 2 BHK floor plan', 'Block B'),
          plan('pw/block-c-2bhk', 'Block C, 2 BHK floor plan (1,079 sq ft)', 'Block C · 1,079 sq ft'),
        ],
      },
      {
        id: '3bhk',
        label: '3 BHK',
        tagline: 'The family home: three bedrooms, separate drawing and dining.',
        bedrooms: 3,
        toilets: 2,
        balconies: '1–2',
        rooms: ['Master bedroom', '2 Bedrooms', 'Drawing', 'Dining', 'Kitchen', '2 Toilets', '1–2 Balconies', 'Store room (Block A)'],
        ...fromPriceList('3 BHK'),
        plans: [
          plan('pw/block-a-3bhk', 'Block A, 3 BHK floor plan (1,768 sq ft)', 'Block A · 1,768 sq ft'),
          plan('pw/block-b-3bhk', 'Block B, 3 BHK floor plan (1,698 sq ft)', 'Block B · 1,698 sq ft'),
        ],
      },
    ],
  },

  'sai-krishna-residency': {
    priceNote: 'Prices on request: our team shares the latest price list and spot-booking offers.',
    features: [
      'Earthquake-resistant RCC frame structure',
      'Vitrified floor tiles in living, dining and bedrooms',
      'Granite kitchen platform with stainless steel sink',
      'Glazed aluminium windows',
      'Reputed brand sanitary ware and CP fittings',
      'Two lifts in most residential blocks; power backup',
    ],
    facilities: ['Swimming pool', 'Modern gym', 'Basketball & badminton', "Children's park", 'Jogging track', 'Community hall', '24/7 security'],
    types: [
      {
        id: '1bhk',
        label: '1 BHK',
        tagline: 'A compact, well-planned home for young professionals and small families.',
        bedrooms: 1,
        toilets: 1,
        balconies: '1',
        rooms: ['1 Bedroom', 'Drawing / Dining', 'Kitchen', '1 Toilet', '1 Balcony'],
        total: 698,
        plans: [plan('skr/plan-1bhk', '1 BHK floor plan, Sai Krishna Residency', '1 BHK · 698 sq ft')],
      },
      {
        id: '2bhk',
        label: '2 BHK',
        tagline: 'Spacious and well ventilated, for growing families.',
        bedrooms: 2,
        toilets: 2,
        balconies: '1',
        rooms: ['2 Bedrooms', 'Drawing / Dining', 'Kitchen', '2 Toilets', '1 Balcony'],
        total: 936,
        plans: [plan('skr/plan-2bhk', '2 BHK floor plan, Sai Krishna Residency', '2 BHK · 936 sq ft')],
      },
      {
        id: '3bhk',
        label: '3 BHK',
        tagline: 'Generous family living with three balconies.',
        bedrooms: 3,
        toilets: 2,
        balconies: '3',
        rooms: ['3 Bedrooms', 'Drawing / Dining', 'Kitchen', '2 Toilets', '3 Balconies'],
        total: 1451,
        plans: [plan('skr/plan-3bhk', '3 BHK floor plan, Sai Krishna Residency', '3 BHK · 1,451 sq ft')],
      },
    ],
  },
};
