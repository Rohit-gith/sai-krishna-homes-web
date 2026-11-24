import { getDb } from './db.js';
import { requireAdmin } from './security.js';

/*
 * "Did anything change?" — what keeps every open CRM screen (phone or laptop) up to date within a
 * couple of seconds, without Refresh. One tiny document holds, per area, when it last changed. Every
 * successful change through the API bumps it; open screens ask for it every few seconds (a very
 * small request) and only fetch real data when their area changed.
 * (Vercel functions can't keep a live connection open, so this is the fast, cheap way there.)
 */

/** Which areas a change to this API path touches. */
function areasOf(path) {
  const p = path.replace(/^\/api\//, '');
  const areas = ['activity']; // nearly every change is also an activity-log entry
  if (p.startsWith('leads')) areas.push('leads', 'bin');
  if (p.startsWith('visits')) areas.push('visits');
  if (p.startsWith('enquiries')) areas.push('enquiries');
  if (p.startsWith('users') || p.startsWith('auth')) areas.push('team');
  if (p.startsWith('projects')) areas.push('projects', 'leads');
  if (p.startsWith('push') || p.startsWith('reports')) return ['activity'];
  return areas;
}

export async function bump(areas) {
  const at = new Date().toISOString();
  const db = await getDb();
  await db
    .collection('live')
    .updateOne({ _id: 'version' }, { $set: Object.fromEntries([...areas, 'any'].map((a) => [a, at])) }, { upsert: true });
}

/**
 * Middleware: after a successful change (POST / PATCH / PUT / DELETE answered below 400), bump the
 * areas it touched before the answer is sent (on Vercel nothing may run after the answer).
 */
export function trackChanges(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    const path = req.originalUrl.split('?')[0];
    // a refused change changes nothing — except a failed / blocked login, which the activity log shows
    if (res.statusCode >= 400 && !path.startsWith('/api/auth/login')) return json(body);
    bump(res.statusCode >= 400 ? ['activity'] : areasOf(path))
      .catch((e) => console.error('live bump failed:', e.message))
      .finally(() => json(body));
    return res;
  };
  return next();
}

/** GET /api/live → { leads: time, visits: time, … } — signed-in people only. */
export const liveRoute = [
  requireAdmin,
  async (_req, res) => {
    const db = await getDb();
    const v = await db.collection('live').findOne({ _id: 'version' });
    const { _id, ...areas } = v || {};
    res.json(areas);
  },
];
