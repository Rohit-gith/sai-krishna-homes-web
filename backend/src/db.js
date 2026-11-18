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
    db.collection('enquiries').createIndex({ id: 1 }, { unique: true }),
    db.collection('enquiries').createIndex({ at: -1 }),
    // rate-limit hits expire on their own
    db.collection('ratelimits').createIndex({ at: 1 }, { expireAfterSeconds: 3600 }),
    db.collection('ratelimits').createIndex({ key: 1, at: -1 }),
  ]);
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
