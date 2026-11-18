/**
 * Converts the client's original photos in _raw-photos/ into web-ready WebP files in public/images/.
 *
 * For every photo two files are produced:
 *   <slug>.webp     – large, max 2400px wide (hero / full-screen / lightbox)
 *   <slug>-sm.webp  – small, max 900px wide (cards, thumbnails, mobile)
 *
 * Usage:  node scripts/optimize-photos.mjs
 * Prints a JSON report of every output (width, height, bytes) so the result can be verified.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const RAW = path.join(ROOT, '_raw-photos');
const OUT = path.join(ROOT, 'public', 'images');

/** original file name → output path (without extension) */
export const PHOTOS = {
  // Panchawati Residency (classical, premium)
  'DAY View.jpg.jpeg': 'panchawati/day-view',
  'Night View.jpg.jpeg': 'panchawati/night-view',
  'Gate A.jpg.jpeg': 'panchawati/gate-a',
  'Swimming Pool.jpg.jpeg': 'panchawati/swimming-pool',
  'Roof Top.jpg.jpeg': 'panchawati/rooftop-lounge',
  'Senio Citizen.jpg.jpeg': 'panchawati/senior-citizen-garden',
  // Sai Krishna Residency (township)
  '1.jpg.jpeg': 'sai-krishna/aerial-township',
  '2.jpg.jpeg': 'sai-krishna/aerial-green',
  '7.jpg.jpeg': 'sai-krishna/aerial-pool',
  '3.jpg.jpeg': 'sai-krishna/street-view',
  '4.jpg.jpeg': 'sai-krishna/panorama-wide',
  '5.jpg.jpeg': 'sai-krishna/panorama',
  '6.jpg.jpeg': 'sai-krishna/panorama-towers',
  '15.jpg.jpeg': 'sai-krishna/central-plaza',
  '11.jpg.jpeg': 'sai-krishna/twin-towers',
  '9.jpg.jpeg': 'sai-krishna/commercial-complex',
  'GATE.jpg.jpeg': 'sai-krishna/main-gate',
  'type-1 front ,2 bhk.jpg.jpeg': 'sai-krishna/type-1-2bhk-front',
  'type 1 side.jpg.jpeg': 'sai-krishna/type-1-2bhk-side',
  'type-2 front(1 bhk).jpg.jpeg': 'sai-krishna/type-2-1bhk-front',
  'type 2,side,1 bhk.jpg.jpeg': 'sai-krishna/type-2-1bhk-side',
};

const SIZES = [
  { suffix: '', width: 2400, quality: 78 },
  { suffix: '-sm', width: 900, quality: 72 },
];

const report = [];
for (const [original, slug] of Object.entries(PHOTOS)) {
  const src = path.join(RAW, original);
  if (!fs.existsSync(src)) {
    report.push({ original, error: 'MISSING' });
    continue;
  }
  for (const { suffix, width, quality } of SIZES) {
    const dest = path.join(OUT, `${slug}${suffix}.webp`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(src)
      .rotate() // respect camera orientation
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(dest);
    const meta = await sharp(dest).metadata(); // re-open to prove the file is a valid image
    report.push({
      original,
      output: path.relative(ROOT, dest).replaceAll('\\', '/'),
      width: meta.width,
      height: meta.height,
      kb: Math.round(fs.statSync(dest).size / 1024),
    });
  }
}

const unmapped = fs.readdirSync(RAW, { recursive: true }).filter(
  (f) => fs.statSync(path.join(RAW, f)).isFile() && !PHOTOS[path.basename(f)],
);
console.log(JSON.stringify({ report, unmapped }, null, 1));
