/**
 * Pricing & area data, typed from the client's documents (_client-docs):
 *  - "PRICE LIST.pdf"                 → Panchawati Residency, Blocks A/B/C
 *  - "Flat Details (SKR) Phase-I.pdf" → Sai Krishna Residency, Phase-I area statement (no prices)
 * Areas are in sq ft. Prices are in rupees. A listed flat number does NOT mean it is unsold.
 */

const L = (lakhs) => Math.round(lakhs * 1e5);
const row = (flats, type, carpet, balcony, sbu, price) => ({ flats, type, carpet, balcony, sbu, price });

export const PANCHAWATI_PRICES = {
  notes: [
    'Price includes 1 unit of car parking, electrification, IDC & EDC (internal and external development charges).',
    'GST & registration charges extra (approx. 11% – 12%).',
  ],
  blocks: [
    {
      id: 'A',
      label: 'Block A',
      rows: [
        row('201', '3 BHK', 954, 80, 1659, L(99)),
        row('102 / 302', '3 BHK', 974, 89, 1701, L(101)),
        row('103 / 303', '2 BHK', 788, 55, 1359, L(81.46)),
        row('212 / 412', '2 BHK', 743, 55, 1294, L(77.75)),
        row('104 / 304', '2 BHK', 811, 55, 1428, L(88.25)),
        row('105 / 205 / 305', '2 BHK', 835, 56, 1428, L(88.25)),
        row('110 / 210 / 410', '2 BHK', 812, 59, 1403, L(86.77)),
        row('211 / 411', '2 BHK', 779, 55, 1348, L(83.53)),
        row('106 / 206 / 306 / 406', '2 BHK', 778, 55, 1358, L(84.12)),
        row('107 / 207 / 307 / 407', '3 BHK', 997, 90, 1732, L(106)),
        row('208 / 408', '3 BHK', 1018, 89, 1768, L(108)),
        row('209 / 309 / 409', '2 BHK', 721, 55, 1291, L(80.16)),
      ],
    },
    {
      id: 'B',
      label: 'Block B',
      rows: [
        row('101 / 301 / 401', '3 BHK', 1010, 50, 1698, L(101)),
        row('202 / 402', '3 BHK', 1009, 50, 1698, L(101)),
        row('203 / 403', '2 BHK', 809, 40, 1361, L(81.57)),
        row('112 / 312 / 412', '2 BHK', 750, 40, 1334, L(80)),
        row('204', '2 BHK', 795, 39, 1348, L(83.53)),
        row('105 / 205', '2 BHK', 796, 40, 1348, L(83.53)),
        row('110 / 310 / 410', '2 BHK', 774, 40, 1320, L(81.9)),
        row('111 / 311 / 411', '2 BHK', 775, 39, 1320, L(81.9)),
        row('106 / 206 / 306', '2 BHK', 809, 39, 1361, L(84.3)),
        row('207', '3 BHK', 1009, 50, 1698, L(104)),
        row('108 / 208 / 308 / 408', '3 BHK', 1009, 50, 1698, L(104)),
        row('109 / 309 / 409', '2 BHK', 751, 39, 1334, L(82.71)),
      ],
    },
    {
      id: 'C',
      label: 'Block C',
      rows: [
        row('101 / 201 / 401', '2 BHK', 620, 44, 1089, L(66.1)),
        row('202 / 302', '2 BHK', 620, 44, 1084, L(65.8)),
        row('303', '1 BHK', 496, 53, 904, L(57.34)),
        row('106 / 206 / 306 / 406', '1 BHK', 371, 39, 689, L(44.66)),
        row('304 / 404', '2 BHK', 620, 44, 1079, L(67.67)),
        row('105 / 205 / 405', '2 BHK', 620, 44, 1079, L(67.67)),
      ],
    },
  ],
};

/** Lowest price per configuration, e.g. { '1 BHK': 4466000, ... } */
export function startingPrices(table) {
  const out = {};
  for (const b of table.blocks) for (const r of b.rows) out[r.type] = Math.min(out[r.type] ?? Infinity, r.price);
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

const cx = (name, type, floors, units) => ({ name, type, floors, units });
const u = (count, carpet, bu) => ({ count, carpet, bu });

/** Sai Krishna Residency, Phase-I (Mouza: Nandapur & Pandiapada). Each complex has 6 floors. */
export const SKR_AREA_STATEMENT = {
  title: 'Phase-I area statement',
  location: 'Mouza: Nandapur & Pandiapada',
  complexes: [
    ...['Ganga', 'Yamuna', 'Saraswati', 'Sindhu', 'Brahmaputra', 'Kaberi'].map((n, i) =>
      cx(n, `Type I · Block ${'ABCDEF'[i]}`, 6, [u(8, 523.883, 643.364)]),
    ),
    cx('Mahanadi', 'Type II · Block A', 6, [u(8, 423.993, 526.682), u(4, 405.372, 510.644)]),
    cx('Prachi', 'Type III', 6, [u(2, 522.915, 643.471), u(1, 425.5, 538.2)]),
    cx('Sagar', 'Type IV · Market complex', 6, [u(2, 1093.407, 1256.589)]),
    cx('Daya', 'Type V · Block A', 6, [u(4, 823.015, 1063.267), u(2, 837.223, 1066.174)]),
    cx('Bhargabi', 'Type V · Block B', 6, [u(4, 823.015, 1063.267), u(2, 837.223, 1066.174)]),
    cx('Baitarani', 'Type V · Block C', 6, [u(4, 781.681, 1000.19), u(2, 785.879, 1000.083)]),
  ],
};
