// Empty the TESTING database (leads, enquiries, activity, counters, ratelimits). Admin logins are kept,
// so you can still log in locally. Refuses to touch the live database, whatever .env says.
//   npm run clear-test-db
const LIVE = process.env.LIVE_MONGODB_DB || 'saikrishnahomes';
const name = process.env.MONGODB_DB || LIVE;
if (name === LIVE || !name.endsWith('_dev')) {
  console.error(`Refusing: "${name}" is not a testing database (it must end with _dev and not be "${LIVE}").`);
  console.error('Set MONGODB_DB=saikrishnahomes_dev in backend/.env');
  process.exit(1);
}

const { closeDb, getDb } = await import('../src/db.js');
const db = await getDb();
const KEEP = ['admins'];
console.log(`Clearing testing database "${db.databaseName}" (admin logins are kept):`);
for (const { name: col } of await db.listCollections().toArray()) {
  if (KEEP.includes(col)) {
    console.log(`  kept     ${col.padEnd(12)} ${await db.collection(col).countDocuments()} records`);
    continue;
  }
  const { deletedCount } = await db.collection(col).deleteMany({});
  console.log(`  cleared  ${col.padEnd(12)} ${deletedCount} records`);
}
console.log('Done. Lead numbers start again from SKH-0001.');
await closeDb();
