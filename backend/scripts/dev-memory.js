// Run the API against a throwaway in-memory MongoDB (no Atlas account needed). Data is lost on exit.
//   npm run dev:memory
// Creates a test admin:  admin@test.local / Test@12345
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';

// One fixed folder, wiped on every start. (The default is a new folder in the system temp dir each run,
// and those pile up — gigabytes on C: — whenever the process is killed instead of stopped.)
const dbPath = fileURLToPath(new URL('../.memory-db', import.meta.url));
rmSync(dbPath, { recursive: true, force: true });
mkdirSync(dbPath, { recursive: true });
const mongo = await MongoMemoryServer.create({ instance: { dbPath } });
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB ||= 'saikrishnahomes_dev'; // in-memory, never the real database
process.env.JWT_SECRET ||= 'local-dev-only-secret-'.padEnd(64, 'x');
process.env.ALLOWED_ORIGINS ||= 'http://localhost:5174,http://localhost:5175';

const { getDb } = await import('../src/db.js');
const db = await getDb();
await db.collection('admins').insertOne({
  email: 'admin@test.local',
  role: 'superowner',
  name: 'Test Admin',
  passwordHash: await bcrypt.hash('Test@12345', 10),
  active: true,
  createdAt: new Date().toISOString(),
});
console.log('In-memory MongoDB ready. Test admin: admin@test.local / Test@12345');
await import('../src/dev.js');

const stop = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
