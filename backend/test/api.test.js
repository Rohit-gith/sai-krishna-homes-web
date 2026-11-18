// End-to-end API tests against a throwaway in-memory MongoDB.  Run: npm test
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';

let mongo, server, base, getDb, closeDb;
let cookie = '';

const call = async (path, { method = 'GET', body, auth = true, origin, headers = {} } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get('set-cookie');
  return { status: res.status, body: await res.json().catch(() => null), set };
};

const enquiry = (o = {}) => ({ form: 'Contact form', name: 'Test Visitor', phone: '9876543210', email: 'a@b.co', interest: '2 BHK', message: 'Hi', ...o });

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB = 'test';
  process.env.JWT_SECRET = 'x'.repeat(48);
  process.env.ALLOWED_ORIGINS = 'https://site.example';
  ({ getDb, closeDb } = await import('../src/db.js'));
  const { default: app } = await import('../src/app.js');
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  const db = await getDb();
  await db.collection('admins').insertOne({ email: 'admin@test.in', name: 'Test Admin', passwordHash: await bcrypt.hash('Secret12345', 4), active: true });
});

after(async () => {
  server?.close();
  await closeDb();
  await mongo?.stop();
});

describe('public enquiries', () => {
  test('saves a valid enquiry', async () => {
    const r = await call('/api/enquiries', { method: 'POST', body: enquiry(), auth: false });
    assert.equal(r.status, 201);
    const db = await getDb();
    assert.equal(await db.collection('enquiries').countDocuments({ name: 'Test Visitor' }), 1);
  });
  test('rejects a bad phone number', async () => {
    const r = await call('/api/enquiries', { method: 'POST', body: enquiry({ phone: '12345' }), auth: false });
    assert.equal(r.status, 400);
  });
  test('honeypot: bots get 201 but nothing is stored', async () => {
    const r = await call('/api/enquiries', { method: 'POST', body: enquiry({ name: 'Bot Bot', website: 'spam.com' }), auth: false });
    assert.equal(r.status, 201);
    assert.equal(await (await getDb()).collection('enquiries').countDocuments({ name: 'Bot Bot' }), 0);
  });
  test('blocks other websites (Origin check)', async () => {
    const r = await call('/api/enquiries', { method: 'POST', body: enquiry(), auth: false, origin: 'https://evil.example' });
    assert.equal(r.status, 403);
    const ok = await call('/api/enquiries', { method: 'POST', body: enquiry(), auth: false, origin: 'https://site.example', headers: { 'X-Forwarded-For': '10.0.0.9' } });
    assert.equal(ok.status, 201);
  });
  test('rate limit: 9th enquiry from one IP in 10 minutes is refused', async () => {
    const h = { 'X-Forwarded-For': '10.0.0.77' };
    for (let i = 0; i < 8; i++) assert.equal((await call('/api/enquiries', { method: 'POST', body: enquiry(), auth: false, headers: h })).status, 201);
    assert.equal((await call('/api/enquiries', { method: 'POST', body: enquiry(), auth: false, headers: h })).status, 429);
  });
  test('admin list needs login', async () => {
    assert.equal((await call('/api/enquiries', { auth: false })).status, 401);
  });
});

describe('admin login', () => {
  test('wrong password is refused', async () => {
    const r = await call('/api/auth/login', { method: 'POST', body: { email: 'admin@test.in', password: 'nope' }, auth: false });
    assert.equal(r.status, 401);
  });
  test('correct password sets an httpOnly session cookie', async () => {
    const r = await call('/api/auth/login', { method: 'POST', body: { email: 'ADMIN@test.in', password: 'Secret12345' }, auth: false });
    assert.equal(r.status, 200);
    assert.match(r.set, /HttpOnly/i);
    cookie = r.set.split(';')[0];
    const me = await call('/api/auth/me');
    assert.equal(me.body.email, 'admin@test.in');
  });
  test('tampered cookie is refused', async () => {
    const r = await call('/api/auth/me', { auth: false, headers: { Cookie: cookie.slice(0, -3) + 'abc' } });
    assert.equal(r.status, 401);
  });
});

describe('CRM', () => {
  let id;
  test('enquiries: list, mark read, delete', async () => {
    const list = await call('/api/enquiries');
    assert.ok(list.body.length >= 1);
    assert.equal(list.body[0]._id, undefined);
    const e = list.body[0];
    assert.equal((await call(`/api/enquiries/${e.id}`, { method: 'PATCH', body: { read: true, leadId: 'SKH-0001' } })).body.read, true);
    assert.equal((await call(`/api/enquiries/${e.id}`, { method: 'DELETE', body: {} })).status, 200);
  });
  test('create lead gets SKH-0001', async () => {
    const r = await call('/api/leads', { method: 'POST', body: { name: 'Ravi Kumar', phone: '9123456789', project: 'Panchawati Residency', config: '2 BHK', source: 'Website', budget: '4500000' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.id, 'SKH-0001');
    assert.equal(r.body.budget, 4500000);
    id = r.body.id;
  });
  test('attempt moves a new lead to contacted', async () => {
    const r = await call(`/api/leads/${id}/attempts`, { method: 'POST', body: { type: 'Call', outcome: 'interested', note: 'ok', nextFollowUp: '2026-12-01' } });
    assert.equal(r.body.status, 'contacted');
    assert.equal(r.body.attempts.length, 1);
    assert.equal(r.body.nextFollowUp, '2026-12-01');
  });
  test('bulk status, then won/lost only via commit', async () => {
    const s = await call('/api/leads/status', { method: 'POST', body: { ids: [id], status: 'visit' } });
    assert.equal(s.body[0].status, 'visit');
    assert.equal((await call('/api/leads/status', { method: 'POST', body: { ids: [id], status: 'won' } })).status, 400);
    const w = await call(`/api/leads/${id}/commit`, { method: 'POST', body: { result: 'won', value: 4400000, unit: 'A-101', note: '' } });
    assert.equal(w.body.status, 'won');
    assert.equal(w.body.dealValue, 4400000);
    // closed leads ignore bulk moves
    assert.equal((await call('/api/leads/status', { method: 'POST', body: { ids: [id], status: 'new' } })).body.length, 0);
    const o = await call(`/api/leads/${id}/reopen`, { method: 'POST', body: {} });
    assert.equal(o.body.status, 'negotiation');
    assert.equal(o.body.closed, null);
  });
  test('excel import reserves a block of IDs', async () => {
    const r = await call('/api/leads/import', { method: 'POST', body: { drafts: [{ name: 'A', phone: '9000000011', createdAt: '2026-10-01' }, { name: 'B', phone: '9000000012', sheet: 'Oct' }] } });
    assert.equal(r.status, 201);
    assert.deepEqual(r.body.map((l) => l.id).sort(), ['SKH-0002', 'SKH-0003']);
    const n = await call('/api/leads', { method: 'POST', body: { name: 'Next One', phone: '9123456780' } });
    assert.equal(n.body.id, 'SKH-0004');
  });
  test('update and delete', async () => {
    assert.equal((await call(`/api/leads/${id}`, { method: 'PATCH', body: { notes: 'VIP' } })).body.notes, 'VIP');
    assert.equal((await call('/api/leads/delete', { method: 'POST', body: { ids: [id] } })).body.deleted, 1);
    assert.equal((await call('/api/leads')).body.some((l) => l.id === id), false);
  });
  test('non-JSON writes are refused', async () => {
    const r = await fetch(base + '/api/leads', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'text/plain' }, body: 'x' });
    assert.equal(r.status, 415);
  });
  test('logout ends the session', async () => {
    const r = await call('/api/auth/logout', { method: 'POST', body: {} });
    assert.match(r.set, /skh_admin=;/);
  });
});
