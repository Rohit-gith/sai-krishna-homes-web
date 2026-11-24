import dns from 'node:dns';
import { MongoClient } from 'mongodb';

// Some local networks / Windows setups can't resolve Atlas's "mongodb+srv" (SRV) records with the default
// DNS. Setting DNS_SERVERS=8.8.8.8,1.1.1.1 in .env fixes that. Not needed on Vercel.
if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));

/*
 * One MongoDB connection, reused across requests. On Vercel each function instance keeps the
 * client between invocations (module scope survives), so we connect once per cold start, not per request.
 */
let clientPromise = null;
let indexesReady = null;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 }).connect();
    clientPromise.catch(() => {
      clientPromise = null; // let the next request retry instead of caching a failed connection
    });
  }
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'saikrishnahomes');
  if (!indexesReady) indexesReady = ensureIndexes(db).catch((e) => ((indexesReady = null), Promise.reject(e)));
  await indexesReady;
  return db;
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('admins').createIndex({ email: 1 }, { unique: true }),
    db.collection('leads').createIndex({ id: 1 }, { unique: true }),
    db.collection('leads').createIndex({ createdAt: -1 }),
    db.collection('leads_trash').createIndex({ id: 1 }),
    db.collection('leads_trash').createIndex({ 'deleted.at': -1 }),
    // what the owner "deleted forever": kept 120 days for Fidelsya only, then MongoDB removes it by itself
    db.collection('leads_archive').createIndex({ 'archived.expireAt': 1 }, { expireAfterSeconds: 0 }),
    db.collection('leads_archive').createIndex({ id: 1 }),
    db.collection('push_subscriptions').createIndex({ endpoint: 1 }, { unique: true }),
    db.collection('push_subscriptions').createIndex({ email: 1 }),
    db.collection('enquiries').createIndex({ id: 1 }, { unique: true }),
    db.collection('enquiries').createIndex({ at: -1 }),
    // rate-limit hits expire on their own
    db.collection('ratelimits').createIndex({ at: 1 }, { expireAfterSeconds: 3600 }),
    db.collection('ratelimits').createIndex({ key: 1, at: -1 }),
    db.collection('activity').createIndex({ at: -1 }),
    db.collection('visits').createIndex({ id: 1 }, { unique: true }),
    db.collection('visits').createIndex({ at: -1 }),
    db.collection('visits').createIndex({ 'guide.email': 1, at: -1 }),
    db.collection('visits').createIndex({ phone: 1 }),
    db.collection('leads').createIndex({ phone: 1 }),
    db.collection('leads').createIndex({ phoneKey: 1 }),
    db.collection('leads_trash').createIndex({ phoneKey: 1 }),
    db.collection('activity').createIndex({ email: 1, at: -1 }),
    db.collection('activity').createIndex({ email: 1, deviceId: 1, type: 1 }),
  ]);
  await runOnce(db);
}

/*
 * One-time data updates. Each runs once per database (a marker is kept in the "migrations"
 * collection), so a later choice by the owner is never overwritten.
 */
async function runOnce(db) {
  const done = db.collection('migrations');
  const once = async (id, fn) => {
    // claim it first: only one server instance runs it, even if several start together
    const claimed = await done.updateOne({ _id: id }, { $setOnInsert: { at: new Date().toISOString() } }, { upsert: true });
    if (!claimed.upsertedCount) return;
    const result = await fn();
    await done.updateOne({ _id: id }, { $set: { result } });
  };
  // 2026-11-23: website enquiries became a default for sales and site-visit executives; give it to
  // the team members who already existed. The owner can take it away from anyone afterwards.
  await once('enquiries-default-for-staff', async () => {
    const at = new Date().toISOString();
    const r = await db.collection('admins').updateMany(
      { role: { $in: ['sales', 'site_visit'] }, permissions: { $ne: 'enquiries.view' } },
      {
        $addToSet: { permissions: 'enquiries.view' },
        $push: {
          history: {
            $each: [
              {
                at,
                by: { email: 'script', name: 'System' },
                action: 'updated',
                changes: { permissions: { added: ['enquiries.view'], removed: [] } },
                note: 'Website enquiries are now shown to every team member by default',
              },
            ],
            $position: 0,
          },
        },
      },
    );
    return { updated: r.modifiedCount };
  });
  // 2026-11-24: new owner-level power "Download the monthly PDF report". Management accounts get
  // every owner power by default, so the ones that already exist get this one too (owner can untick).
  await once('management-reports-download', async () => {
    const r = await db.collection('admins').updateMany(
      { role: 'management', permissions: { $ne: 'reports.download' } },
      { $addToSet: { permissions: 'reports.download' } },
    );
    return { updated: r.modifiedCount };
  });
  // 2026-11-24: duplicate-lead warning matches on the bare 10-digit mobile number ("phoneKey"), so
  // "+91 94370 99999" and "9437099999" are the same customer. Fill it in for the leads already there.
  await once('leads-phone-key', async () => {
    let n = 0;
    for (const name of ['leads', 'leads_trash']) {
      const col = db.collection(name);
      const ops = [];
      for await (const l of col.find({ phoneKey: { $exists: false } }, { projection: { _id: 1, phone: 1 } })) {
        const d = String(l.phone || '').replace(/\D/g, '');
        ops.push({ updateOne: { filter: { _id: l._id }, update: { $set: { phoneKey: d.length >= 10 ? d.slice(-10) : d } } } });
        if (ops.length === 1000) n += (await col.bulkWrite(ops.splice(0))).modifiedCount;
      }
      if (ops.length) n += (await col.bulkWrite(ops)).modifiedCount;
    }
    return { updated: n };
  });
}

/** Next number in a named sequence (lead IDs SKH-0001, SKH-0002 …), safe under concurrent requests. */
export async function nextSeq(db, name, by = 1) {
  const r = await db
    .collection('counters')
    .findOneAndUpdate({ _id: name }, { $inc: { seq: by } }, { upsert: true, returnDocument: 'after' });
  return r.seq; // last number of the reserved block
}

/** For tests: drop the cached client. */
export async function closeDb() {
  if (clientPromise) {
    const c = await clientPromise.catch(() => null);
    clientPromise = null;
    indexesReady = null;
    await c?.close();
  }
}
