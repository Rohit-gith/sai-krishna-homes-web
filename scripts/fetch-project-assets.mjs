/**
 * One-off: downloads the project images from the client's existing website and converts them to WebP
 * in public/images/projects/. Usage: node scripts/fetch-project-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'public', 'images', 'projects');
const BASE = 'https://apcagenciesandconsultancy.com/saikrishna/assets/images/';

// [source path, output name, kind]  kind: photo (two sizes) | plan (one large, sharper)
export const ASSETS = [
  // Sai Krishna Residency
  ['Sai-krishna/krishna-banner.webp', 'skr/banner', 'photo'],
  ['Sai-krishna/krishna-night-banner.webp', 'skr/banner-night', 'photo'],
  ['Advertise.webp', 'skr/gate', 'photo'],
  ['Sai-krishna/sai-master-plan.webp', 'skr/master-plan', 'plan'],
  ['Sai-krishna/1bhk.png', 'skr/plan-1bhk', 'plan'],
  ['Sai-krishna/2bhk.png', 'skr/plan-2bhk', 'plan'],
  ['Sai-krishna/3bhk.png', 'skr/plan-3bhk', 'plan'],
  ['Sai-krishna/map.webp', 'skr/map', 'plan'],
  ['Sai-krishna/jogging-track.webp', 'skr/jogging-track', 'photo'],
  ['Sai-krishna/Gallery/dining-room.webp', 'skr/dining-room', 'photo'],
  ['Sai-krishna/Gallery/ground-floor-bed-room.webp', 'skr/bedroom', 'photo'],
  ['Sai-krishna/Gallery/ground-floor-drawing-room.webp', 'skr/drawing-room', 'photo'],
  ['sports-zone.webp', 'skr/sports-zone', 'photo'],
  ['Lawn.webp', 'skr/lawn', 'photo'],
  ['temple.webp', 'skr/temple-market', 'photo'],
  // Panchawati Residency
  ['Night-view.webp', 'pw/banner-night', 'photo'],
  ['Panchwati/panchawati-about.webp', 'pw/gate', 'photo'],
  ['Panchwati/Master-Plan.png', 'pw/master-plan', 'plan'],
  ['Panchwati/Block-A-Floor-Plan.png', 'pw/block-a', 'plan'],
  ['Panchwati/Block-A-Bhk-2.png', 'pw/block-a-2bhk', 'plan'],
  ['Panchwati/Block-A-Bhk-3.png', 'pw/block-a-3bhk', 'plan'],
  ['Panchwati/Floor-Plan-Block-B.png', 'pw/block-b', 'plan'],
  ['Panchwati/Block-B-Bhk-2.png', 'pw/block-b-2bhk', 'plan'],
  ['Panchwati/Block-B-Bhk-3.png', 'pw/block-b-3bhk', 'plan'],
  ['Panchwati/Block-C-Floor-Plan.png', 'pw/block-c', 'plan'],
  ['Panchwati/Block-c-Bhk-1.png', 'pw/block-c-1bhk', 'plan'],
  ['Panchwati/Block-C-Bhk-2.png', 'pw/block-c-2bhk', 'plan'],
  ['Panchwati/map-2.webp', 'pw/map', 'plan'],
  ['Panchwati/classical-elevation.webp', 'pw/a-classical-elevation', 'photo'],
  ['Panchwati/intercom.webp', 'pw/a-intercom', 'photo'],
  ['Panchwati/gym.png', 'pw/a-gym', 'photo'],
  ['Panchwati/solar-panel.webp', 'pw/a-solar', 'photo'],
  ['Panchwati/ev-charging.webp', 'pw/a-ev-charging', 'photo'],
  ['Panchwati/pool-amen.webp', 'pw/a-pool', 'photo'],
  ['Panchwati/kid-playzone.webp', 'pw/a-kids-play', 'photo'],
  ['Panchwati/senior-citizen.webp', 'pw/a-senior-seating', 'photo'],
  ['Panchwati/jogging.webp', 'pw/a-jogging', 'photo'],
  ['Panchwati/ac-hall.webp', 'pw/a-ac-hall', 'photo'],
  ['Panchwati/borewell.webp', 'pw/a-borewell', 'photo'],
  ['Panchwati/yoga.webp', 'pw/a-yoga', 'photo'],
  ['Panchwati/security.webp', 'pw/a-security', 'photo'],
  ['Panchwati/rain-water.jpg', 'pw/a-rainwater', 'photo'],
  ['Panchwati/power-backup.jpg', 'pw/a-power-backup', 'photo'],
  ['about2.webp', 'pw/a-driveway', 'photo'],
  ['Panchwati/separate-transformer.webp', 'pw/a-transformer', 'photo'],
  ['Panchwati/reflexology-path.webp', 'pw/a-reflexology', 'photo'],
  ['Panchwati/sewage.webp', 'pw/a-stp', 'photo'],
  ['Panchwati/fire-protection.webp', 'pw/a-fire', 'photo'],
  // Past projects gallery (as labelled on the old site)
  ['indoor_1.jpg', 'past/living-room', 'photo'],
  ['outdoor_4.jpg', 'past/parking', 'photo'],
  ['indoor_2.jpg', 'past/lobby', 'photo'],
  ['indoor_4.jpg', 'past/co-working', 'photo'],
  ['kitchen_large.jpg', 'past/kitchen', 'photo'],
  ['living_room.jpg', 'past/bedroom', 'photo'],
  ['junior_play.jpg', 'past/junior-play', 'photo'],
  ['indoor_5.jpg', 'past/bathroom', 'photo'],
  ['indoor_3.jpg', 'past/gym', 'photo'],
  ['swimming_pool.jpg', 'past/terrace-pool', 'photo'],
];

const report = [];
for (const [src, name, kind] of ASSETS) {
  try {
    const res = await fetch(BASE + src, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const sizes = kind === 'plan' ? [['', 2000, 90]] : [['', 1800, 80], ['-sm', 760, 74]];
    for (const [suffix, width, quality] of sizes) {
      const dest = path.join(OUT, `${name}${suffix}.webp`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      await sharp(buf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dest);
    }
    const m = await sharp(path.join(OUT, `${name}.webp`)).metadata();
    report.push(`ok   ${name.padEnd(26)} ${m.width}x${m.height}`);
  } catch (e) {
    report.push(`FAIL ${name.padEnd(26)} ${src} ${e.message}`);
  }
}
console.log(report.join('\n'));
