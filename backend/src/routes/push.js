import { Router } from 'express';
import { z } from 'zod';
import { ACTIVITY, deviceIdOf, logActivity } from '../audit.js';
import { getDb } from '../db.js';
import { notifyTest, publicKey } from '../push.js';
import { requireAdmin } from '../security.js';

/*
 * Turning phone / desktop notifications on and off for the signed-in person (one browser at a time).
 * Each subscription is stored with whose it is and which device, and is removed on logout, so the
 * next person on a shared device never gets someone else's notifications.
 */
const r = Router();
r.use(requireAdmin);

const Sub = z
  .object({
    endpoint: z.string().url().max(1000),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(5).max(100) }),
  })
  .passthrough();

/** The public key the browser needs to subscribe ('' = notifications are not set up on this server). */
r.get('/key', (_req, res) => res.json({ publicKey: publicKey() }));

r.post('/subscribe', async (req, res) => {
  const p = Sub.safeParse(req.body?.subscription);
  if (!p.success) return res.status(400).json({ error: 'Invalid subscription.' });
  const db = await getDb();
  const at = new Date().toISOString();
  const device = String(req.get('user-agent') || '').slice(0, 300);
  const before = await db.collection('push_subscriptions').findOne({ endpoint: p.data.endpoint }, { projection: { email: 1 } });
  await db.collection('push_subscriptions').updateOne(
    { endpoint: p.data.endpoint },
    {
      $set: { endpoint: p.data.endpoint, keys: p.data.keys, email: req.admin.email, deviceId: deviceIdOf(req), device, updatedAt: at },
      $setOnInsert: { createdAt: at },
    },
    { upsert: true },
  );
  if (before?.email !== req.admin.email) {
    await logActivity(ACTIVITY.PUSH_ENABLED, { email: req.admin.email, name: req.admin.name, req, note: 'Notifications turned on for this device' });
  }
  return res.json({ ok: true });
});

r.post('/unsubscribe', async (req, res) => {
  const endpoint = z.string().url().max(1000).safeParse(req.body?.endpoint);
  if (!endpoint.success) return res.status(400).json({ error: 'Invalid request.' });
  const db = await getDb();
  const { deletedCount } = await db.collection('push_subscriptions').deleteOne({ endpoint: endpoint.data, email: req.admin.email });
  if (deletedCount) {
    await logActivity(ACTIVITY.PUSH_DISABLED, { email: req.admin.email, name: req.admin.name, req, note: req.body?.reason === 'logout' ? 'Logged out on this device' : 'Notifications turned off for this device' });
  }
  return res.json({ ok: true });
});

/** A test notification to this person's own devices. */
r.post('/test', async (req, res) => {
  if (!publicKey()) return res.status(503).json({ error: 'Notifications are not set up on the server yet.' });
  const devices = await notifyTest(await getDb(), req.admin.email);
  if (!devices) return res.status(400).json({ error: 'Turn notifications on for this device first.' });
  return res.json({ ok: true, devices });
});

export default r;
