import webpush from 'web-push';
import { can } from './permissions.js';

/*
 * Phone / desktop notifications (Web Push) for the installed CRM app.
 * A browser that turns notifications on gives us a "subscription" (an address at Google / Apple /
 * Mozilla). We keep it in "push_subscriptions" with whose it is, and send through it.
 * Keys: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT in the environment (live has its own).
 * A notification problem must never break the request that caused it, so failures are only printed.
 */

let ready = null;
export function pushReady() {
  if (ready !== null) return ready;
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject } = process.env;
  ready = !!(pub && priv);
  if (ready) webpush.setVapidDetails(subject || 'mailto:support@example.com', pub, priv);
  return ready;
}
export const publicKey = () => (pushReady() ? process.env.VAPID_PUBLIC_KEY : '');

/** Send one message to the given subscriptions; forget the ones the browser has given up. */
async function sendTo(db, subs, message) {
  if (!pushReady() || !subs.length) return { sent: 0 };
  const payload = JSON.stringify(message);
  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 24 * 3600, timeout: 5000 })),
  );
  const dead = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      if ([404, 410].includes(r.reason?.statusCode)) dead.push(subs[i].endpoint);
      else console.error('push failed:', r.reason?.statusCode || '', r.reason?.message);
    }
  });
  if (dead.length) await db.collection('push_subscriptions').deleteMany({ endpoint: { $in: dead } });
  return { sent: results.filter((r) => r.status === 'fulfilled').length };
}

/** Everyone who may see website enquiries (and is active) gets "New website enquiry". */
export async function notifyEnquiry(db, enquiry) {
  try {
    if (!pushReady()) return;
    const people = await db
      .collection('admins')
      .find({ active: { $ne: false } }, { projection: { email: 1, role: 1, permissions: 1 } })
      .toArray();
    const emails = people.filter((u) => can({ role: u.role || 'owner', permissions: u.permissions || [] }, 'enquiries.view')).map((u) => u.email);
    const subs = await db.collection('push_subscriptions').find({ email: { $in: emails } }).toArray();
    await sendTo(db, subs, {
      title: 'New website enquiry',
      body: [enquiry.name, enquiry.form, enquiry.interest].filter(Boolean).join(' · '),
      url: '/admin/enquiries',
      tag: `enquiry-${enquiry.id}`,
    });
  } catch (e) {
    console.error('enquiry notification failed:', e.message);
  }
}

/** "Send a test" from My account: only this person's own devices. */
export async function notifyTest(db, email) {
  const subs = await db.collection('push_subscriptions').find({ email }).toArray();
  await sendTo(db, subs, { title: 'Sai Krishna Homes CRM', body: 'Notifications are working on this device.', url: '/admin/account', tag: 'test' });
  return subs.length;
}
