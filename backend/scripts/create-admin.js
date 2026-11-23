// Create a CRM login, or reset an existing person's password (Fidelsya's command-line tool).
//   npm run create-admin      -- <email> "<Full Name>" "<password>" [--role superowner|owner|management|sales|site_visit]
//   npm run create-admin:live -- ...same...   → LIVE database (the client's real data)
// New accounts default to role "owner" unless --role is given; an existing account keeps its role
// unless --role is given. Staff created here get the default permissions for their role.
// Passwords are stored only as bcrypt hashes. Every run is recorded in the activity log.
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const live = args.includes('--live');
if (live) process.env.MONGODB_DB = process.env.LIVE_MONGODB_DB || 'saikrishnahomes';
const ri = args.indexOf('--role');
const role = ri >= 0 ? args[ri + 1] : undefined;
const [email, name, password] = args.filter((a, i) => a !== '--live' && i !== ri && i !== ri + 1);

if (!email || !name || !password) {
  console.error('Usage: npm run create-admin[:live] -- <email> "<Full Name>" "<password>" [--role superowner|owner|management|sales|site_visit]');
  process.exit(1);
}
if (role !== undefined && !['superowner', 'owner', 'management', 'sales', 'site_visit'].includes(role)) {
  console.error('--role must be superowner, owner, management, sales or site_visit');
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
const { DEFAULT_PERMISSIONS } = await import('../src/permissions.js');
const db = await getDb();
const at = new Date().toISOString();
const by = { email: 'script', name: 'Fidelsya (create-admin script)', role: 'superowner' };
const mail = email.trim().toLowerCase();
const existing = await db.collection('admins').findOne({ email: mail });
const finalRole = role || existing?.role || 'owner';
const set = {
  name: name.trim(),
  passwordHash: await bcrypt.hash(password, 12),
  passwordChangedAt: at,
  active: true,
  updatedAt: at,
  role: finalRole,
};
if (!existing && DEFAULT_PERMISSIONS[finalRole]) set.permissions = DEFAULT_PERMISSIONS[finalRole];
await db.collection('admins').updateOne(
  { email: mail },
  {
    $set: set,
    $setOnInsert: { createdAt: at, createdBy: by },
    $inc: { sessionVersion: 1 }, // a reset logs the person out everywhere
    $push: { history: { $each: [{ at, by, action: existing ? 'password_reset' : 'created', role: finalRole }], $position: 0 } },
  },
  { upsert: true },
);
await logActivity(existing ? ACTIVITY.PASSWORD_RESET : ACTIVITY.ADMIN_CREATED, {
  email: by.email,
  name: by.name,
  target: { email: mail, name: name.trim(), role: finalRole },
});
const where = `${db.databaseName}${live ? ' (LIVE)' : ' (testing)'}`;
console.log(`${existing ? 'Password updated' : 'Account created'} in ${where}: ${mail} (role: ${finalRole})`);
await closeDb();
