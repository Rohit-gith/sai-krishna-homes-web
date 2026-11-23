// Change an existing account's role, without touching the password.
//   npm run set-role      -- <email> <superowner|owner|management|sales|site_visit>   → testing database
//   npm run set-role:live -- <email> <superowner|owner|management|sales|site_visit>   → LIVE database
const args = process.argv.slice(2);
const live = args.includes('--live');
if (live) process.env.MONGODB_DB = process.env.LIVE_MONGODB_DB || 'saikrishnahomes';
const [email, role] = args.filter((a) => a !== '--live');
if (!email || !['superowner', 'owner', 'management', 'sales', 'site_visit'].includes(role)) {
  console.error('Usage: npm run set-role[:live] -- <email> <superowner|owner|management|sales|site_visit>');
  process.exit(1);
}
const { closeDb, getDb } = await import('../src/db.js');
const { ACTIVITY, logActivity } = await import('../src/audit.js');
const db = await getDb();
const mail = email.trim().toLowerCase();
const user = await db.collection('admins').findOne({ email: mail });
if (!user) {
  console.error(`No account with email ${mail} in ${db.databaseName}`);
  await closeDb();
  process.exit(1);
}
const at = new Date().toISOString();
const by = { email: 'script', name: 'Fidelsya (set-role script)', role: 'superowner' };
const changes = { role: { from: user.role || '', to: role } };
// Management starts with every power (the owner can untick); staff keep only what their role can hold
const { DEFAULT_PERMISSIONS, allowedFor } = await import('../src/permissions.js');
const permissions =
  role === 'management' ? DEFAULT_PERMISSIONS.management : (user.permissions || []).filter((p) => allowedFor(role).includes(p));
await db.collection('admins').updateOne(
  { _id: user._id },
  { $set: { role, permissions, updatedAt: at }, $push: { history: { $each: [{ at, by, action: 'updated', changes }], $position: 0 } } },
);
await logActivity(ACTIVITY.USER_UPDATED, { email: by.email, name: by.name, target: { email: mail, name: user.name, role }, changes });
console.log(`Role set in ${db.databaseName}${live ? ' (LIVE)' : ''}: ${mail} → ${role}`);
await closeDb();
