// Run the API against a throwaway in-memory MongoDB (no Atlas account needed). Data is lost on exit.
//   npm run dev:memory
// Creates a test admin:  admin@test.local / Test@12345
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB ||= 'saikrishnahomes';
process.env.JWT_SECRET ||= 'local-dev-only-secret-'.padEnd(64, 'x');
process.env.ALLOWED_ORIGINS ||= 'http://localhost:5174,http://localhost:5175';

const { getDb } = await import('../src/db.js');
const db = await getDb();
await db.collection('admins').insertOne({
  email: 'admin@test.local',
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
