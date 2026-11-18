// Create an admin login, or reset an existing admin's password.
//   npm run create-admin -- <email> "<Full Name>" "<password>"
// Run it once per person. Passwords are stored only as bcrypt hashes.
import bcrypt from 'bcryptjs';
import { closeDb, getDb } from '../src/db.js';

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('Usage: npm run create-admin -- <email> "<Full Name>" "<password>"');
  process.exit(1);
}
if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error('Use a password of at least 10 characters with letters and numbers.');
  process.exit(1);
}

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
console.log(r.upsertedCount ? `Admin created: ${email}` : `Password updated: ${email}`);
await closeDb();
