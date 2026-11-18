import readXlsxFile, { readSheetNames } from 'read-excel-file';

/*
 * Reads a leads workbook (.xlsx) in the browser and turns every row into a clean lead draft.
 * - Works with or without a header row (sheets without one reuse the column order of a sheet that has it).
 * - Cleans phone numbers like "(+91)-9178254727" → "9178254727".
 * - Collapses repeated configurations ("1 BHK 1 BHK 2 BHK") → "1 BHK, 2 BHK".
 * - Parses price ranges like "37.9 Lac-1.03 Crore" into numbers.
 * Nothing leaves the browser.
 */

const FIELDS = {
  date: /date|created|day/i,
  name: /name|customer|client/i,
  phone: /phone|mobile|contact|number|whatsapp/i,
  config: /config|bhk|unit|type/i,
  price: /price|budget|cost/i,
  remark: /remark|note|comment|status|feedback|follow/i,
};

function headerMap(row) {
  const map = {};
  const remarks = [];
  row.forEach((cell, i) => {
    if (typeof cell !== 'string') return;
    for (const [key, re] of Object.entries(FIELDS)) {
      if (!re.test(cell)) continue;
      if (key === 'remark') remarks.push(i);
      else if (map[key] === undefined) map[key] = i;
      return;
    }
  });
  map.remarks = remarks;
  return map.name !== undefined && map.phone !== undefined ? map : null;
}

/** Guess columns from the values themselves (for sheets with no header at all). */
function sniffMap(rows) {
  const width = Math.max(...rows.map((r) => r.length));
  const score = (i, test) => rows.slice(0, 30).filter((r) => r[i] !== null && test(r[i])).length;
  const map = { remarks: [] };
  const used = new Set();
  const pick = (key, test) => {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < width; i++) {
      if (used.has(i)) continue;
      const s = score(i, test);
      if (s > bestScore) [best, bestScore] = [i, s];
    }
    if (best >= 0) {
      map[key] = best;
      used.add(best);
    }
  };
  pick('phone', (v) => String(v).replace(/\D/g, '').length >= 10);
  pick('date', (v) => v instanceof Date || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(String(v).trim()));
  pick('config', (v) => /bhk|studio/i.test(String(v)));
  pick('price', (v) => /lac|lakh|crore|cr\b/i.test(String(v)));
  pick('name', (v) => typeof v === 'string' && /[a-z]/i.test(v) && v.length < 40);
  for (let i = 0; i < width; i++) if (!used.has(i)) map.remarks.push(i);
  return map;
}

export const cleanPhone = (v) => {
  const d = String(v ?? '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
};

const titleCase = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s.'-])([a-z])/g, (m, p, c) => p + c.toUpperCase());

export function cleanConfig(v) {
  const s = String(v ?? '');
  const found = [...s.matchAll(/(\d)\s*(\+?)\s*bhk/gi)].map((m) => `${m[1]}${m[2]} BHK`);
  if (/studio/i.test(s)) found.unshift('Studio');
  const uniq = [...new Set(found)].sort((a, b) => (a === 'Studio' ? -1 : b === 'Studio' ? 1 : a.localeCompare(b)));
  return uniq.join(', ') || s.trim();
}

const AMOUNT = /([\d.]+)\s*(lac|lakh|l\b|crore|cr\b)/gi;
export function parsePrice(v) {
  const s = String(v ?? '');
  const nums = [...s.matchAll(AMOUNT)].map((m) => parseFloat(m[1]) * (/^c/i.test(m[2]) ? 1e7 : 1e5));
  if (!nums.length) return { priceMin: 0, priceMax: 0 };
  return { priceMin: Math.round(Math.min(...nums)), priceMax: Math.round(Math.max(...nums)) };
}

/**
 * Excel often turns an Indian "11-10-2026" (11 Oct) into 10 Nov (month/day swapped). A lead can't be
 * created in the future, so if a date is ahead of today and swapping day/month gives a past date,
 * use the swapped one.
 */
function fixSwapped(y, m, d) {
  const today = new Date();
  const asIs = new Date(y, m, d, 11);
  if (asIs <= today || d > 12) return asIs;
  const swapped = new Date(y, d - 1, m + 1, 11);
  return swapped <= today ? swapped : asIs;
}

function parseDate(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // Excel dates arrive as UTC midnight; keep the calendar day in local time.
    return fixSwapped(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()).toISOString();
  }
  const m = String(v ?? '').trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(y, Number(m[2]) - 1, Number(m[1]), 11).toISOString();
  }
  return null;
}

const isBlank = (r) => r.every((c) => c === null || String(c).trim() === '');

/**
 * @returns {Promise<{ sheets: {name:string, rows:object[], headerless:boolean}[] }>}
 *   each row: { sheet, line, name, phone, config, priceMin, priceMax, createdAt, remarks[], error? }
 */
export async function parseLeadsWorkbook(file) {
  const names = await readSheetNames(file);
  const raw = [];
  for (const name of names) raw.push({ name, rows: (await readXlsxFile(file, { sheet: name })).filter((r) => !isBlank(r)) });

  // A header from any sheet can be reused by header-less sheets with the same width.
  const known = raw.map((s) => (s.rows.length ? headerMap(s.rows[0]) : null));
  const template = known.find(Boolean);
  const templateWidth = template ? raw[known.indexOf(template)].rows[0].length : 0;

  const sheets = raw.map((s, si) => {
    if (!s.rows.length) return { name: s.name, rows: [], headerless: false };
    const own = known[si];
    const map = own || (template && s.rows[0].length === templateWidth ? template : sniffMap(s.rows));
    const data = own ? s.rows.slice(1) : s.rows;
    const rows = data.map((r, i) => {
      const phone = cleanPhone(r[map.phone]);
      const name = titleCase(r[map.name]);
      const remarks = map.remarks.map((c) => String(r[c] ?? '').trim()).filter(Boolean);
      const row = {
        sheet: s.name,
        line: i + (own ? 2 : 1),
        name,
        phone,
        config: map.config !== undefined ? cleanConfig(r[map.config]) : '',
        ...parsePrice(map.price !== undefined ? r[map.price] : ''),
        priceText: map.price !== undefined ? String(r[map.price] ?? '').trim() : '',
        createdAt: map.date !== undefined ? parseDate(r[map.date]) : null,
        remarks,
      };
      if (!/^[6-9]\d{9}$/.test(phone)) row.error = 'Invalid mobile number';
      else if (!name) row.error = 'Missing name';
      return row;
    });
    return { name: s.name, rows, headerless: !own };
  });
  return { sheets };
}
