// Create an admin login, or reset an existing admin's password.
//   npm run create-admin      -- <email> "<Full Name>" "<password>"   → testing database (MONGODB_DB in .env)
//   npm run create-admin:live -- <email> "<Full Name>" "<password>"   → LIVE database (the client's real data)
// Run it once per person. Passwords are stored only as bcrypt hashes.
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const live = args.includes('--live');
if (live) process.env.MONGODB_DB = process.env.LIVE_MONGODB_DB || 'saikrishnahomes';
const [email, name, password] = args.filter((a) => a !== '--live');

if (!email || !name || !password) {
  console.error('Usage: npm run create-admin[:live] -- <email> "<Full Name>" "<password>"');
  process.exit(1);
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('That email does not look right.');
  process.exit(1);
}
if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error('Use a password of at least 10 characters with letters and numbers.');
  process.exit(1);
}

const { closeDb, getDb } = await import('../src/db.js');
const { ACTIVITY, logActivity } = await import('../src/audit.js');
const db = await getDb();
const at = new Date().toISOString();
const r = await db.collection('admins').updateOne(
  { email: email.trim().toLowerCase() },
  {
    $set: { name: name.trim(), passwordHash: await bcrypt.hash(password, 12), active: true, updatedAt: at },
    $setOnInsert: { createdAt: at },
  },
  { upsert: true },
);
await logActivity(r.upsertedCount ? ACTIVITY.ADMIN_CREATED : ACTIVITY.PASSWORD_RESET, {
  email: email.trim(),
  name: name.trim(),
  by: 'Fidelsya (create-admin script)',
});
const where = `${db.databaseName}${live ? ' (LIVE)' : ' (testing)'}`;
console.log(r.upsertedCount ? `Admin created in ${where}: ${email}` : `Password updated in ${where}: ${email}`);
await closeDb();
