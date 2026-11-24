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
  test('anti-bot field: the enquiry is still kept (autofill can fill it), tagged as possible spam', async () => {
    const r = await call('/api/enquiries', { method: 'POST', body: enquiry({ name: 'Bot Bot', website: 'spam.com' }), auth: false, headers: { 'X-Forwarded-For': '10.0.0.66' } });
    assert.equal(r.status, 201);
    const saved = await (await getDb()).collection('enquiries').findOne({ name: 'Bot Bot' });
    assert.equal(saved.spam, true);
    assert.equal(saved.website, undefined);
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
  test('excel import: one over-long cell never fails the whole import', async () => {
    const r = await call('/api/leads/import', { method: 'POST', body: { drafts: [
      { name: 'Long Config', phone: '9000000201', config: 'Wants a corner flat facing east with garden view near the main gate', notes: 'Remark 1: hi' },
      { name: 'Long Notes', phone: '9000000202', config: '2 BHK', notes: 'R'.repeat(12000), priceMin: 'abc', status: 'weird' },
      { name: 'N'.repeat(200), phone: 9000000203, createdAt: null, sheet: null },
    ] } });
    assert.equal(r.status, 201);
    const [a, b, c] = ['Long Config', 'Long Notes'].map((n) => r.body.find((l) => l.name === n)).concat(r.body.find((l) => l.name.startsWith('NNN')));
    assert.equal(a.config, '');
    assert.match(a.notes, /^Configuration: Wants a corner flat/);
    assert.match(a.notes, /Remark 1: hi$/);
    assert.equal(b.config, '2 BHK');
    assert.equal(b.notes.length, 10000);
    assert.equal(b.priceMin, 0);
    assert.equal(b.status, 'new');
    assert.equal(c.name.length, 80);
    assert.equal(c.phone, '9000000203');
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

describe('activity log', () => {
  test('logins, failed logins and logouts are recorded with time, IP and device', async () => {
    const h = { 'User-Agent': 'TestBrowser/1.0', 'X-Forwarded-For': '10.9.9.9' };
    await call('/api/auth/login', { method: 'POST', body: { email: 'admin@test.in', password: 'wrong-one' }, auth: false, headers: h });
    const ok = await call('/api/auth/login', { method: 'POST', body: { email: 'admin@test.in', password: 'Secret12345' }, auth: false, headers: h });
    cookie = ok.set.split(';')[0];
    const list = (await call('/api/activity')).body;
    const latest = list[0];
    assert.equal(latest.type, 'login');
    assert.equal(latest.email, 'admin@test.in');
    assert.equal(latest.name, 'Test Admin');
    assert.equal(latest.ip, '10.9.9.9');
    assert.equal(latest.device, 'TestBrowser/1.0');
    assert.ok(!Number.isNaN(Date.parse(latest.at)));
    assert.equal(list[1].type, 'login_failed');
    assert.equal(list[1].note, 'Wrong password');
    // earlier logout in the CRM suite was recorded too
    assert.ok(list.some((a) => a.type === 'logout'));
  });
  test('each browser has its own device ID; the first login from it is tagged "new device"', async () => {
    const as = (id) => ({ 'X-Device-Id': id, 'X-Forwarded-For': '10.9.9.10' });
    const login = (id) =>
      call('/api/auth/login', { method: 'POST', body: { email: 'admin@test.in', password: 'Secret12345' }, auth: false, headers: as(id) });
    const latest = async () => (await call('/api/activity?type=login')).body[0];
    cookie = (await login('a1b2c3d4e5f6')).set.split(';')[0];
    let a = await latest();
    assert.equal(a.deviceId, 'a1b2c3d4e5f6');
    assert.equal(a.newDevice, true);
    cookie = (await login('a1b2c3d4e5f6')).set.split(';')[0]; // same browser again: not new
    a = await latest();
    assert.equal(a.newDevice, undefined);
    cookie = (await login('0000ffff1111')).set.split(';')[0]; // phone on the same WiFi: same IP, new device
    a = await latest();
    assert.equal(a.deviceId, '0000ffff1111');
    assert.equal(a.ip, '10.9.9.10');
    assert.equal(a.newDevice, true);
    cookie = (await login('<script>bad')).set.split(';')[0]; // junk IDs are ignored
    a = await latest();
    assert.equal(a.deviceId, undefined);
    assert.equal(a.newDevice, undefined);
  });
  test('filter by type, and login is required', async () => {
    const failed = (await call('/api/activity?type=login_failed')).body;
    assert.ok(failed.length >= 1 && failed.every((a) => a.type === 'login_failed'));
    assert.equal((await call('/api/activity?type=nonsense')).status, 400);
    assert.equal((await call('/api/activity', { auth: false })).status, 401);
  });
});

describe('team: roles, permissions, active/inactive, passwords (Phase 1)', () => {
  const login = async (email, password) => {
    const r = await call('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
    return { status: r.status, body: r.body, ck: r.set ? r.set.split(';')[0] : '' };
  };
  const as = async (ck, path, opts = {}) => {
    const keep = cookie;
    cookie = ck;
    try {
      return await call(path, opts);
    } finally {
      cookie = keep;
    }
  };
  let owner, fid, sales, salesId, visitId, ownerId;

  test('setup: owner + Fidelsya superowner', async () => {
    const db = await getDb();
    await db.collection('admins').updateOne({ email: 'admin@test.in' }, { $set: { role: 'owner' } });
    await db.collection('admins').insertOne({ email: 'fid@fidelsya.test', name: 'Fidelsya Support', role: 'superowner', active: true, passwordHash: await bcrypt.hash('Fidelsya12345', 4) });
    owner = (await login('admin@test.in', 'Secret12345')).ck;
    fid = (await login('fid@fidelsya.test', 'Fidelsya12345')).ck;
    assert.equal((await as(owner, '/api/auth/me')).body.role, 'owner');
    const meta = (await as(owner, '/api/users/meta')).body;
    assert.deepEqual(meta.roles.map((x) => x.id), ['owner', 'management', 'sales', 'site_visit']); // an owner can add a co-owner
    assert.ok(meta.permissions.length >= 10);
    assert.deepEqual((await as(fid, '/api/users/meta')).body.roles.map((x) => x.id), ['owner', 'management', 'sales', 'site_visit']);
  });

  test('owner creates staff; history + activity recorded', async () => {
    const s = await as(owner, '/api/users', { method: 'POST', body: { name: 'Sam Sales', email: 'sam@test.in', phone: '9876500011', role: 'sales', password: 'SamSales123' } });
    assert.equal(s.status, 201);
    assert.deepEqual(s.body.permissions, ['leads.create', 'leads.edit', 'attempts.log', 'deals.close', 'enquiries.view']);
    assert.equal(s.body.createdBy.email, 'admin@test.in');
    assert.equal(s.body.history[0].action, 'created');
    assert.equal(s.body.passwordHash, undefined);
    salesId = s.body.id;
    const v = await as(owner, '/api/users', { method: 'POST', body: { name: 'Vic Visit', email: 'vic@test.in', role: 'site_visit', password: 'VicVisit123', permissions: ['visits.log'] } });
    visitId = v.body.id;
    assert.equal((await as(owner, '/api/users', { method: 'POST', body: { name: 'Dup', email: 'SAM@test.in', role: 'sales', password: 'SamSales123' } })).status, 409);
    assert.equal((await as(owner, '/api/users', { method: 'POST', body: { name: 'Weak', email: 'w@test.in', role: 'sales', password: 'short' } })).status, 400);
    const log = (await as(owner, '/api/activity?type=admin_created')).body.find((a) => a.target?.email === 'sam@test.in');
    assert.equal(log.email, 'admin@test.in');
  });

  test('owner never sees Fidelsya; Fidelsya sees everyone', async () => {
    const list = (await as(owner, '/api/users')).body;
    assert.ok(!list.some((u) => u.email === 'fid@fidelsya.test'));
    ownerId = list.find((u) => u.email === 'admin@test.in').id;
    const fidUser = (await as(fid, '/api/users')).body.find((u) => u.email === 'fid@fidelsya.test');
    assert.ok(fidUser);
    assert.equal((await as(owner, `/api/users/${fidUser.id}`)).status, 404);
    assert.equal((await as(owner, `/api/users/${fidUser.id}/status`, { method: 'PATCH', body: { active: false } })).status, 404);
  });

  test('sales: only own leads, only allowed actions; assignment credits them', async () => {
    sales = (await login('sam@test.in', 'SamSales123')).ck;
    assert.equal((await as(sales, '/api/auth/me')).body.role, 'sales');
    assert.equal((await as(sales, '/api/users')).status, 403);
    assert.equal((await as(sales, '/api/activity')).status, 403);
    assert.equal((await as(sales, '/api/enquiries')).status, 200); // website enquiries: shown to staff by default
    const ownerLead = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Owner Lead', phone: '9123400001' } })).body;
    const mine = await as(sales, '/api/leads', { method: 'POST', body: { name: 'Sam Lead', phone: '9123400002' } });
    assert.equal(mine.status, 201);
    assert.equal(mine.body.createdBy.email, 'sam@test.in');
    const seen = (await as(sales, '/api/leads')).body.map((l) => l.id);
    assert.ok(seen.includes(mine.body.id) && !seen.includes(ownerLead.id));
    assert.equal((await as(sales, `/api/leads/${ownerLead.id}`, { method: 'PATCH', body: { notes: 'x' } })).status, 404);
    assert.equal((await as(sales, '/api/leads/delete', { method: 'POST', body: { ids: [mine.body.id] } })).status, 403);
    assert.equal((await as(sales, '/api/leads/import', { method: 'POST', body: { drafts: [{ name: 'A', phone: '9000000999' }] } })).status, 403);
    assert.equal((await as(sales, '/api/leads/exported', { method: 'POST', body: { count: 1 } })).status, 403);
    const a = await as(owner, '/api/leads/assign', { method: 'POST', body: { ids: [ownerLead.id], to: 'sam@test.in' } });
    assert.equal(a.body[0].assignedTo.email, 'sam@test.in');
    assert.match(a.body[0].history[0].text, /Assigned to Sam Sales/);
    assert.ok((await as(sales, '/api/leads')).body.some((l) => l.id === ownerLead.id));
    assert.equal((await as(owner, '/api/activity?type=lead_assigned')).body[0].target.email, 'sam@test.in');
    assert.equal((await as(owner, '/api/leads/assign', { method: 'POST', body: { ids: [ownerLead.id], to: 'vic@test.in' } })).status, 400);
    assert.equal((await as(owner, '/api/leads/exported', { method: 'POST', body: { count: 5, filters: 'Project: Panchawati' } })).status, 200);
  });

  test('permission change applies at once and is recorded (who, what added/removed)', async () => {
    const before = (await as(sales, '/api/leads')).body.length;
    const u = await as(owner, `/api/users/${salesId}`, { method: 'PATCH', body: { permissions: ['leads.view_all', 'leads.create'], note: 'Promoted' } });
    assert.deepEqual(u.body.history[0].changes.permissions, { added: ['leads.view_all'], removed: ['leads.edit', 'attempts.log', 'deals.close', 'enquiries.view'] });
    assert.ok((await as(sales, '/api/leads')).body.length > before);
    assert.equal((await as(sales, '/api/enquiries')).status, 403); // the owner took enquiries away
    const log = (await as(owner, '/api/activity?type=user_updated')).body[0];
    assert.equal(log.target.email, 'sam@test.in');
    assert.equal(log.note, 'Promoted');
  });

  test('inactive: logged out at once, cannot log in; reactivate works', async () => {
    const d = await as(owner, `/api/users/${salesId}/status`, { method: 'PATCH', body: { active: false, note: 'On leave' } });
    assert.equal(d.body.active, false);
    assert.equal(d.body.history[0].action, 'deactivated');
    const kicked = await as(sales, '/api/leads');
    assert.equal(kicked.status, 401);
    assert.match(kicked.body.error, /deactivated/);
    assert.equal((await login('sam@test.in', 'SamSales123')).status, 403);
    assert.equal((await login('sam@test.in', 'nope')).status, 401);
    assert.equal((await as(owner, `/api/users/${salesId}/status`, { method: 'PATCH', body: { active: true } })).body.active, true);
    sales = (await login('sam@test.in', 'SamSales123')).ck;
    assert.equal((await as(sales, '/api/auth/me')).status, 200);
    assert.equal((await as(owner, `/api/users/${ownerId}/status`, { method: 'PATCH', body: { active: false } })).status, 400);
  });

  test('password reset by owner logs the person out; new password works', async () => {
    assert.equal((await as(owner, `/api/users/${salesId}/password`, { method: 'POST', body: { password: 'weak' } })).status, 400);
    assert.equal((await as(owner, `/api/users/${salesId}/password`, { method: 'POST', body: { password: 'NewSales456', note: 'Forgot it' } })).status, 200);
    assert.equal((await as(sales, '/api/auth/me')).status, 401);
    assert.equal((await login('sam@test.in', 'SamSales123')).status, 401);
    sales = (await login('sam@test.in', 'NewSales456')).ck;
    assert.equal((await as(sales, '/api/auth/me')).status, 200);
    assert.equal((await as(owner, '/api/activity?type=password_reset')).body[0].target.email, 'sam@test.in');
  });

  test('owner cannot manage owners; Fidelsya can reset the owner and stays hidden', async () => {
    assert.equal((await as(owner, `/api/users/${ownerId}`, { method: 'PATCH', body: { name: 'Hack' } })).status, 403);
    assert.equal((await as(fid, `/api/users/${ownerId}/password`, { method: 'POST', body: { password: 'OwnerNew789' } })).status, 200);
    assert.equal((await as(owner, '/api/auth/me')).status, 401);
    owner = (await login('admin@test.in', 'OwnerNew789')).ck;
    const ownerView = (await as(owner, '/api/activity?limit=2000')).body;
    assert.ok(!ownerView.some((a) => a.email === 'fid@fidelsya.test'));
    // nothing Fidelsya did from the command line (scripts) reaches the owner either, in any form
    const db = await getDb();
    await db.collection('activity').insertMany([
      { at: new Date().toISOString(), type: 'admin_created', email: 'script', name: 'Fidelsya (create-admin script)', target: { email: 'x@test.in', name: 'X' } },
      { at: new Date().toISOString(), type: 'admin_created', email: 'admin@test.in', name: 'Test Admin', by: 'Fidelsya (create-admin script)' },
    ]);
    const again = JSON.stringify((await as(owner, '/api/activity?limit=2000')).body);
    assert.ok(!/fidelsya|"script"/i.test(again));
    assert.match(JSON.stringify((await as(fid, '/api/activity?limit=2000')).body), /create-admin script/);
    assert.ok((await as(fid, '/api/activity?limit=2000')).body.some((a) => a.email === 'fid@fidelsya.test' && a.type === 'password_reset'));
  });

  test('change my own password: needs the current one, keeps me in, logs other devices out', async () => {
    const other = (await login('vic@test.in', 'VicVisit123')).ck;
    const mine = (await login('vic@test.in', 'VicVisit123')).ck;
    assert.equal((await as(mine, '/api/auth/change-password', { method: 'POST', body: { currentPassword: 'wrong', newPassword: 'VicNewPass1' } })).status, 400);
    const ok = await as(mine, '/api/auth/change-password', { method: 'POST', body: { currentPassword: 'VicVisit123', newPassword: 'VicNewPass1' } });
    assert.equal(ok.status, 200);
    assert.equal((await as(ok.set.split(';')[0], '/api/auth/me')).status, 200);
    assert.equal((await as(other, '/api/auth/me')).status, 401);
    assert.equal((await as(owner, `/api/users/${visitId}`)).body.history[0].action, 'password_changed');
  });

  /* ---------------- Phase 4: site visits ---------------- */
  let vic, visit1;
  test('site visit executive records a visit; it links to the lead and notes its history', async () => {
    vic = (await login('vic@test.in', 'VicNewPass1')).ck;
    const lead = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Visit Customer', phone: '9555000001' } })).body;
    const v = await as(vic, '/api/visits', {
      method: 'POST',
      body: { customerName: 'Visit Customer', phone: '9555000001', project: 'Panchawati Residency', config: '2 BHK', people: 3, rating: 5, feedback: 'Loved the pool', outcome: 'booking' },
    });
    assert.equal(v.status, 201);
    assert.equal(v.body.id, 'VIS-0001');
    assert.equal(v.body.satisfaction, 'satisfied');
    assert.equal(v.body.guide.email, 'vic@test.in');
    assert.equal(v.body.leadId, lead.id);
    visit1 = v.body;
    const after = (await as(owner, '/api/leads')).body.find((l) => l.id === lead.id);
    assert.equal(after.status, 'visit'); // new → site visit
    assert.match(after.history[0].text, /Site visit VIS-0001 by Vic Visit · ★★★★★/);
    // no lead with that number → still saved, just not linked
    const n = await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'Walk In', phone: '9555000002', rating: 2, feedback: 'Too far', outcome: 'not_interested' } });
    assert.equal(n.body.leadId, null);
    assert.equal(n.body.satisfaction, 'not_satisfied');
    // typing a known mobile fills the form, even though Vic cannot see the lead list
    const look = (await as(vic, '/api/visits/lookup?phone=9555000001')).body;
    assert.equal(look.lead.name, 'Visit Customer');
    assert.equal(look.previousVisits, 1);
    assert.deepEqual(Object.keys(look.lead).sort(), ['config', 'id', 'name', 'project']); // nothing more
    assert.equal((await as(vic, '/api/visits/lookup?phone=95550')).status, 400); // only a full number
    assert.equal((await as(vic, '/api/visits/lookup?phone=9555000099')).body.lead, null);
    assert.equal((await as(sales, '/api/visits/lookup?phone=9555000001')).status, 403);
  });

  test('visit validation, future dates, and who can record', async () => {
    assert.equal((await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'X', phone: '123', rating: 4 } })).status, 400);
    assert.equal((await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'Xy', phone: '9555000003', rating: 9 } })).status, 400);
    const future = new Date(Date.now() + 3 * 864e5).toISOString();
    assert.equal((await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'Xy', phone: '9555000003', rating: 4, at: future } })).status, 400);
    // a visit executive cannot record for someone else
    assert.equal((await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'Xy', phone: '9555000003', rating: 4, guideEmail: 'sam@test.in' } })).status, 403);
    // sales without visits.log cannot record or list visits
    assert.equal((await as(sales, '/api/visits')).status, 403);
    // the owner can record a visit on behalf of an executive, with a past date
    const past = new Date(Date.now() - 40 * 864e5).toISOString();
    const o = await as(owner, '/api/visits', { method: 'POST', body: { customerName: 'Old Visit', phone: '9555000004', rating: 3, guideEmail: 'vic@test.in', at: past, outcome: 'follow_up' } });
    assert.equal(o.status, 201);
    assert.equal(o.body.guide.email, 'vic@test.in');
    assert.equal(o.body.createdBy.email, 'admin@test.in');
    assert.equal(o.body.satisfaction, 'neutral');
  });

  test('who sees which visits; edit rules; delete is owner-only', async () => {
    assert.equal((await as(vic, '/api/visits')).body.length, 3); // all three are Vic's
    const other = await as(owner, '/api/visits', { method: 'POST', body: { customerName: 'Owner Shown', phone: '9555000005', rating: 4 } });
    assert.equal((await as(vic, '/api/visits')).body.some((v) => v.id === other.body.id), false);
    assert.equal((await as(owner, '/api/visits')).body.length, 4);
    // filters
    assert.equal((await as(owner, '/api/visits?guide=vic@test.in')).body.length, 3);
    assert.equal((await as(owner, `/api/visits?leadId=${visit1.leadId}`)).body.length, 1);
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    assert.equal((await as(owner, `/api/visits?from=${encodeURIComponent(since)}`)).body.length, 3);
    // edit own visit: rating change updates satisfaction + history
    const e = await as(vic, `/api/visits/${visit1.id}`, { method: 'PATCH', body: { rating: 3, note: 'Customer called back, less sure' } });
    assert.equal(e.body.satisfaction, 'neutral');
    assert.match(e.body.history[0].text, /rating/);
    assert.equal(e.body.history[0].changes.rating.from, 5);
    // Vic cannot touch the owner's visit, and cannot delete
    assert.equal((await as(vic, `/api/visits/${other.body.id}`, { method: 'PATCH', body: { rating: 1 } })).status, 404);
    assert.equal((await as(vic, `/api/visits/${visit1.id}`, { method: 'DELETE', body: {} })).status, 403);
    assert.equal((await as(owner, `/api/visits/${other.body.id}`, { method: 'DELETE', body: {} })).status, 200);
    // the guides list
    assert.deepEqual((await as(vic, '/api/visits/guides')).body.map((g) => g.email), ['vic@test.in']);
    assert.ok((await as(owner, '/api/visits/guides')).body.some((g) => g.email === 'vic@test.in'));
  });

  /* ---------------- Phase 5: reports ---------------- */
  test('reports: leads per sales person, won/lost in the period, visits per executive', async () => {
    assert.equal((await as(sales, '/api/reports')).status, 403); // no reports.view
    // Sam: one lead of his own + one assigned earlier; win one in this period
    const samLead = (await as(owner, '/api/leads')).body.find((l) => l.name === 'Sam Lead');
    await as(owner, `/api/leads/${samLead.id}/commit`, { method: 'POST', body: { result: 'won', value: 5000000, unit: 'A-1', note: '' } });
    const rep = await as(owner, `/api/reports?from=${encodeURIComponent(new Date(Date.now() - 7 * 864e5).toISOString())}`);
    assert.equal(rep.status, 200);
    const sam = rep.body.sales.find((s) => s.email === 'sam@test.in');
    assert.ok(sam.newLeads >= 2);
    assert.equal(sam.won, 1);
    assert.equal(sam.wonValue, 5000000);
    assert.equal(sam.conversion, 100);
    const vicRow = rep.body.visits.find((v) => v.email === 'vic@test.in');
    assert.equal(vicRow.visits, 2); // the 40-day-old visit is outside "last 7 days"
    assert.equal(vicRow.people, 4);
    assert.equal(vicRow.satisfied, 0);
    assert.equal(vicRow.neutral, 1);
    assert.equal(vicRow.notSatisfied, 1);
    assert.equal(vicRow.avgRating, 2.5);
    assert.equal(vicRow.latestFeedback.length, 2);
    // a longer period includes the older visit
    const all = (await as(owner, `/api/reports?from=${encodeURIComponent(new Date(Date.now() - 90 * 864e5).toISOString())}`)).body;
    assert.equal(all.visits.find((v) => v.email === 'vic@test.in').visits, 3);
    // Fidelsya never appears in the client's report
    assert.ok(!JSON.stringify(rep.body).includes('fid@fidelsya.test'));
    // a staff member given "See team reports" can open it
    await as(owner, `/api/users/${salesId}`, { method: 'PATCH', body: { permissions: ['reports.view'] } });
    assert.equal((await as(sales, '/api/reports')).status, 200);
    assert.equal((await as(owner, '/api/reports?from=2026-12-31T00:00:00.000Z&to=2026-01-01T00:00:00.000Z')).status, 400);
  });

  test('whatever Fidelsya does inside the CRM leaves no trace the client can see; Fidelsya sees it all', async () => {
    // Fidelsya creates a lead, logs a call, changes status, assigns it, records visits, closes the deal
    const l = (await as(fid, '/api/leads', { method: 'POST', body: { name: 'Support Made', phone: '9555000009' } })).body;
    await as(fid, `/api/leads/${l.id}/attempts`, { method: 'POST', body: { type: 'Call', outcome: 'connected', note: 'checked data' } });
    await as(fid, '/api/leads/status', { method: 'POST', body: { ids: [l.id], status: 'negotiation' } });
    await as(fid, '/api/leads/assign', { method: 'POST', body: { ids: [l.id], to: 'sam@test.in' } });
    await as(fid, `/api/leads/${l.id}/commit`, { method: 'POST', body: { result: 'won', value: 6500000, unit: '', note: '' } });
    const own = await as(fid, '/api/visits', { method: 'POST', body: { customerName: 'Fid Shown', phone: '9555000010', rating: 4 } });
    const forVic = await as(fid, '/api/visits', { method: 'POST', body: { customerName: 'For Vic', phone: '9555000009', rating: 5, guideEmail: 'vic@test.in' } });
    // the client sees the business data, but no "who" and no history from Fidelsya
    const ownerLead = (await as(owner, '/api/leads')).body.find((x) => x.id === l.id);
    assert.ok(ownerLead, 'the lead itself is the client’s data');
    assert.equal(ownerLead.createdBy, null);
    assert.equal(ownerLead.attempts.length, 0);
    assert.equal(ownerLead.history.length, 0);
    assert.equal(ownerLead.assignedTo.email, 'sam@test.in');
    assert.equal(ownerLead.assignedTo.by, null);
    assert.equal(ownerLead.closed.by, undefined);
    const ownerVisits = (await as(owner, '/api/visits')).body;
    assert.ok(!ownerVisits.some((v) => v.id === own.body.id)); // Fidelsya showed this one itself: hidden
    const v2 = ownerVisits.find((v) => v.id === forVic.body.id);
    assert.equal(v2.createdBy, null);
    assert.equal(v2.history.length, 0);
    const everything = JSON.stringify([(await as(owner, '/api/leads')).body, ownerVisits, (await as(owner, '/api/reports')).body, (await as(owner, '/api/users')).body, (await as(owner, '/api/activity?limit=2000')).body]);
    assert.ok(!/fidelsya|support team|"support"/i.test(everything), 'no trace of Fidelsya for the client');
    // staff can't see it either
    assert.ok(!/fidelsya|support team/i.test(JSON.stringify((await as(vic, '/api/visits')).body)));
    // Fidelsya still sees every detail
    const fidLead = (await as(fid, '/api/leads')).body.find((x) => x.id === l.id);
    assert.equal(fidLead.createdBy.name, 'Support team');
    assert.equal(fidLead.attempts.length, 1);
    assert.ok(fidLead.history.length >= 4);
    assert.ok((await as(fid, '/api/visits')).body.some((v) => v.id === own.body.id));
    assert.ok((await as(fid, '/api/activity?limit=2000')).body.some((a) => a.email === 'fid@fidelsya.test'));
  });

  test('co-owner (partner / family): same powers as the owner, every action recorded under their name', async () => {
    const c = await as(owner, '/api/users', { method: 'POST', body: { name: 'Owner Son', email: 'son@test.in', role: 'owner', password: 'OwnerSon123' } });
    assert.equal(c.status, 201);
    assert.equal(c.body.role, 'owner');
    assert.deepEqual(c.body.permissions, []); // owners don't need ticks: they can do everything
    const son = (await login('son@test.in', 'OwnerSon123')).ck;
    // while the owner is away, the son runs the team
    const staff = await as(son, '/api/users', { method: 'POST', body: { name: 'New Sales', email: 'new.sales@test.in', role: 'sales', password: 'NewSales123' } });
    assert.equal(staff.status, 201);
    assert.equal(staff.body.createdBy.name, 'Owner Son');
    assert.equal((await as(son, `/api/users/${staff.body.id}/status`, { method: 'PATCH', body: { active: false, note: 'Trial over' } })).status, 200);
    assert.equal((await as(son, `/api/users/${staff.body.id}/password`, { method: 'POST', body: { password: 'Another123x' } })).status, 200);
    assert.equal((await as(son, '/api/leads')).status, 200);
    assert.equal((await as(son, '/api/visits')).status, 200);
    const rep = (await as(son, '/api/reports')).body;
    assert.ok(rep.sales && rep.visits && rep.totals.status);
    assert.equal(rep.totals.status.won + rep.totals.status.lost + rep.totals.status.open, rep.totals.newLeads);
    // owners can't remove each other (only Fidelsya can) — nobody gets locked out
    const list = (await as(son, '/api/users')).body;
    const mainOwner = list.find((u) => u.email === 'admin@test.in');
    assert.equal((await as(son, `/api/users/${mainOwner.id}/status`, { method: 'PATCH', body: { active: false } })).status, 403);
    assert.equal((await as(son, `/api/users/${mainOwner.id}/password`, { method: 'POST', body: { password: 'Hijack12345' } })).status, 403);
    // the owner sees exactly what the son did, with time
    const log = (await as(owner, '/api/activity?email=son@test.in')).body;
    const did = log.filter((a) => a.email === 'son@test.in').map((a) => a.type);
    assert.ok(['admin_created', 'user_deactivated', 'password_reset', 'login'].every((t) => did.includes(t)));
    assert.ok(log.every((a) => !Number.isNaN(Date.parse(a.at))));
    // and staff still can't see reports or the team
    assert.equal((await as(vic, '/api/reports')).status, 403);
    assert.equal((await as(vic, '/api/users')).status, 403);
  });

  /* ---------------- projects ---------------- */
  test('projects: the two website projects are built in and locked', async () => {
    const list = (await as(owner, '/api/projects')).body;
    assert.deepEqual(list.filter((p) => p.builtIn).map((p) => p.name).sort(), ['Panchawati Residency', 'Sai Krishna Residency']);
    const pw = list.find((p) => p.name === 'Panchawati Residency');
    assert.equal(typeof pw.leads, 'number'); // owners see usage counts
    assert.equal((await as(owner, `/api/projects/${pw.id}`, { method: 'PATCH', body: { name: 'Hacked' } })).status, 403);
    assert.equal((await as(owner, `/api/projects/${pw.id}`, { method: 'DELETE', body: {} })).status, 403);
    assert.equal((await as(fid, `/api/projects/${pw.id}`, { method: 'DELETE', body: {} })).status, 403); // locked for everyone
    // staff get the list (for dropdowns) but no counts and can't manage
    const staffList = (await as(vic, '/api/projects')).body;
    assert.equal(staffList.length >= 2, true);
    assert.equal(staffList[0].leads, undefined);
    assert.equal((await as(vic, '/api/projects', { method: 'POST', body: { name: 'Staff Project' } })).status, 403);
  });

  test('projects: add, fix a spelling (leads + visits follow), delete only when unused; all recorded', async () => {
    const add = await as(owner, '/api/projects', { method: 'POST', body: { name: '  Green   Vally ', location: 'Khandagiri', rera: 'RP/19/2026/00001' } });
    assert.equal(add.status, 201);
    assert.equal(add.body.name, 'Green Vally');
    assert.equal(add.body.createdBy.email, 'admin@test.in');
    assert.equal((await as(owner, '/api/projects', { method: 'POST', body: { name: 'green vally' } })).status, 409); // no duplicates
    assert.equal((await as(owner, '/api/projects', { method: 'POST', body: { name: 'G' } })).status, 400);
    // a lead and a visit use the misspelt name
    const lead = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'GV Buyer', phone: '9555000201', project: 'Green Vally' } })).body;
    await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'GV Buyer', phone: '9555000201', rating: 4, project: 'Green Vally' } });
    // delete is refused while in use
    const del = await as(owner, `/api/projects/${add.body.id}`, { method: 'DELETE', body: {} });
    assert.equal(del.status, 409);
    assert.equal(del.body.leads, 1);
    assert.equal(del.body.visits, 1);
    // fix the spelling → lead and visit move with it
    const fix = await as(owner, `/api/projects/${add.body.id}`, { method: 'PATCH', body: { name: 'Green Valley', note: 'Spelling' } });
    assert.equal(fix.status, 200);
    assert.deepEqual(fix.body.history[0].changes.name, { from: 'Green Vally', to: 'Green Valley' });
    assert.deepEqual(fix.body.history[0].moved, { leads: 1, visits: 1 });
    assert.equal((await as(owner, '/api/leads')).body.find((l) => l.id === lead.id).project, 'Green Valley');
    assert.ok((await as(owner, '/api/visits')).body.some((v) => v.project === 'Green Valley'));
    assert.equal((await as(owner, `/api/projects/${add.body.id}`, { method: 'PATCH', body: { name: 'Panchawati Residency' } })).status, 409);
    // the co-owner can manage projects too; an unused one can be deleted
    const son = (await login('son@test.in', 'OwnerSon123')).ck;
    const tmp = (await as(son, '/api/projects', { method: 'POST', body: { name: 'Typo Project' } })).body;
    assert.equal((await as(son, `/api/projects/${tmp.id}`, { method: 'DELETE', body: {} })).status, 200);
    assert.ok(!(await as(owner, '/api/projects')).body.some((p) => p.id === tmp.id));
    // everything is in the activity log with who and when
    const log = (await as(owner, '/api/activity?limit=2000')).body;
    assert.ok(log.some((a) => a.type === 'project_created' && a.target.name === 'Green Vally' && a.email === 'admin@test.in'));
    assert.ok(log.some((a) => a.type === 'project_updated' && /1 lead\(s\) and 1 visit\(s\) moved/.test(a.note)));
    assert.ok(log.some((a) => a.type === 'project_deleted' && a.target.name === 'Typo Project' && a.email === 'son@test.in'));
    // Fidelsya's project work stays invisible to the client
    const fp = (await as(fid, '/api/projects', { method: 'POST', body: { name: 'Fid Project' } })).body;
    const seen = (await as(owner, '/api/projects')).body.find((p) => p.id === fp.id);
    assert.equal(seen.createdBy, null);
    assert.equal(seen.history.length, 0);
  });
  /* ---------------- recycle bin + hand over ---------------- */
  test('delete moves leads to the recycle bin; owner restores; only Fidelsya removes for good', async () => {
    const a = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Bin Lead A', phone: '9555000301' } })).body;
    const b = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Bin Lead B', phone: '9555000302' } })).body;
    await as(owner, `/api/leads/${a.id}/attempts`, { method: 'POST', body: { type: 'Call', outcome: 'connected', note: 'keep me' } });
    assert.equal((await as(owner, '/api/leads/delete', { method: 'POST', body: { ids: [a.id, b.id] } })).body.deleted, 2);
    assert.ok(!(await as(owner, '/api/leads')).body.some((l) => [a.id, b.id].includes(l.id)));
    const db = await getDb();
    assert.equal(await db.collection('leads_trash').countDocuments({ id: { $in: [a.id, b.id] } }), 2); // still in the database
    const bin = (await as(owner, '/api/leads/trash')).body;
    const inBin = bin.find((l) => l.id === a.id);
    assert.equal(inBin.deleted.by.email, 'admin@test.in');
    assert.equal(inBin.attempts.length, 1); // nothing lost
    // staff can't see or use the bin
    assert.equal((await as(vic, '/api/leads/trash')).status, 403);
    assert.equal((await as(vic, '/api/leads/trash/restore', { method: 'POST', body: { ids: [a.id] } })).status, 403);
    // restore: back with its history + a line saying who restored it
    const back = await as(owner, '/api/leads/trash/restore', { method: 'POST', body: { ids: [a.id] } });
    assert.equal(back.status, 200);
    const lead = (await as(owner, '/api/leads')).body.find((l) => l.id === a.id);
    assert.ok(lead);
    assert.equal(lead.attempts[0].note, 'keep me');
    assert.match(lead.history[0].text, /Restored from the recycle bin by Test Admin/);
    // the owner must type DELETE; Fidelsya removes at once (no archive)
    assert.equal((await as(owner, '/api/leads/trash/purge', { method: 'POST', body: { ids: [b.id] } })).status, 400);
    assert.equal((await as(fid, '/api/leads/trash/purge', { method: 'POST', body: { ids: [b.id] } })).body.purged, 1);
    assert.equal(await db.collection('leads_trash').countDocuments({ id: b.id }), 0);
    // Fidelsya's deletes never show in the client's bin
    const c = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Bin Lead C', phone: '9555000303' } })).body;
    await as(fid, '/api/leads/delete', { method: 'POST', body: { ids: [c.id] } });
    assert.ok(!(await as(owner, '/api/leads/trash')).body.some((l) => l.id === c.id));
    assert.ok((await as(fid, '/api/leads/trash')).body.some((l) => l.id === c.id && l.deleted.support));
    // all recorded
    const log = (await as(owner, '/api/activity?limit=2000')).body;
    assert.ok(log.some((x) => x.type === 'leads_deleted' && x.note.includes(a.id)));
    assert.ok(log.some((x) => x.type === 'leads_restored' && x.note.includes(a.id)));
    assert.ok(!log.some((x) => x.type === 'leads_purged')); // Fidelsya's action: hidden from the client
    assert.ok((await as(fid, '/api/activity?limit=2000')).body.some((x) => x.type === 'leads_purged'));
  });

  test('hand over: all open leads of a leaving person go to another; closed deals stay', async () => {
    await as(owner, '/api/users', { method: 'POST', body: { name: 'Leaving Lal', email: 'lal@test.in', role: 'sales', password: 'LeavingLal123' } });
    await as(owner, '/api/users', { method: 'POST', body: { name: 'Taking Tara', email: 'tara@test.in', role: 'sales', password: 'TakingTara123' } });
    const lal = (await login('lal@test.in', 'LeavingLal123')).ck;
    const o1 = (await as(lal, '/api/leads', { method: 'POST', body: { name: 'Lal Open 1', phone: '9555000311' } })).body;
    const o2 = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Lal Open 2', phone: '9555000312' } })).body;
    await as(owner, '/api/leads/assign', { method: 'POST', body: { ids: [o2.id], to: 'lal@test.in' } });
    const w = (await as(lal, '/api/leads', { method: 'POST', body: { name: 'Lal Won', phone: '9555000313' } })).body;
    await as(lal, `/api/leads/${w.id}/commit`, { method: 'POST', body: { result: 'won', value: 6500000, unit: '', note: '' } });
    // only owners
    assert.equal((await as(lal, '/api/leads/handover', { method: 'POST', body: { from: 'lal@test.in', to: 'tara@test.in' } })).status, 403);
    assert.equal((await as(owner, '/api/leads/handover', { method: 'POST', body: { from: 'lal@test.in', to: 'vic@test.in' } })).status, 400); // site visit can't take leads
    const h = await as(owner, '/api/leads/handover', { method: 'POST', body: { from: 'lal@test.in', to: 'tara@test.in', note: 'Left the company' } });
    assert.equal(h.body.moved, 2);
    const all = (await as(owner, '/api/leads')).body;
    for (const id of [o1.id, o2.id]) {
      const l = all.find((x) => x.id === id);
      assert.equal(l.assignedTo.email, 'tara@test.in');
      assert.match(l.history[0].text, /Handed over from Leaving Lal to Taking Tara by Test Admin · Left the company/);
    }
    const won = all.find((x) => x.id === w.id);
    assert.equal(won.assignedTo, null); // the won deal stays credited to Lal
    const tara = (await login('tara@test.in', 'TakingTara123')).ck;
    const taraLeads = (await as(tara, '/api/leads')).body.map((l) => l.id);
    assert.ok(taraLeads.includes(o1.id) && taraLeads.includes(o2.id));
    assert.ok((await as(owner, '/api/activity?type=leads_handed_over')).body.some((x) => /2 open lead\(s\) from Leaving Lal to Taking Tara/.test(x.note)));
  });
  test('website enquiries: home finder answers saved; every new staff member sees them by default; only owners delete', async () => {
    const body = {
      form: 'Home finder · call me back',
      name: 'Finder Visitor',
      phone: '9555000401',
      interest: 'Panchawati Residency · 2 BHK',
      finder: { people: '3 – 4 (Small family)', budget: '₹60 L – ₹90 L', need: 'Schools', suggestion: '2 BHK · Panchawati Residency' },
    };
    assert.equal((await call('/api/enquiries', { method: 'POST', body, auth: false, headers: { 'X-Forwarded-For': '10.0.0.41' } })).status, 201);
    assert.equal((await call('/api/enquiries', { method: 'POST', body: { ...body, finder: { people: 'x', hack: 1 } }, auth: false, headers: { 'X-Forwarded-For': '10.0.0.42' } })).status, 400);
    const e = (await as(owner, '/api/enquiries')).body.find((x) => x.phone === '9555000401');
    assert.deepEqual(e.finder, body.finder);
    // in the owner's activity log too
    assert.ok((await as(owner, '/api/activity?type=enquiry_received')).body.some((a) => a.name === 'Finder Visitor' && a.note.includes('+91 9555000401')));
    // a brand-new sales and site-visit executive see enquiries without the owner ticking anything
    await as(owner, '/api/users', { method: 'POST', body: { name: 'New Seller', email: 'seller.new@test.in', role: 'sales', password: 'NewSeller123' } });
    const sv = await as(owner, '/api/users', { method: 'POST', body: { name: 'New Guide', email: 'guide.new@test.in', role: 'site_visit', password: 'NewGuide1234' } });
    assert.deepEqual(sv.body.permissions, ['visits.log', 'enquiries.view']);
    for (const [email, pw] of [['seller.new@test.in', 'NewSeller123'], ['guide.new@test.in', 'NewGuide1234']]) {
      const ck = (await login(email, pw)).ck;
      assert.ok((await as(ck, '/api/enquiries')).body.some((x) => x.id === e.id), email + ' sees the enquiry');
      assert.equal((await as(ck, `/api/enquiries/${e.id}`, { method: 'DELETE', body: {} })).status, 403); // staff can't delete
    }
    // the owner can take it away from one person
    await as(owner, `/api/users/${sv.body.id}`, { method: 'PATCH', body: { permissions: ['visits.log'] } });
    assert.equal((await as((await login('guide.new@test.in', 'NewGuide1234')).ck, '/api/enquiries')).status, 403);
    // Fidelsya sees it; the owner deletes it and that is recorded
    assert.ok((await as(fid, '/api/enquiries')).body.some((x) => x.id === e.id));
    assert.equal((await as(owner, `/api/enquiries/${e.id}`, { method: 'DELETE', body: {} })).status, 200);
    assert.ok((await as(owner, '/api/activity?type=enquiry_deleted')).body.some((a) => a.target.name === 'Finder Visitor'));
  });
  test('project on the website: details + photos, shown only when the owner switches it on; all recorded', async () => {
    const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const p = (await as(owner, '/api/projects', { method: 'POST', body: { name: 'Sai Krishna Green Heights', location: 'Khandagiri, Bhubaneswar', rera: 'RP/19/2026/00123' } })).body;
    assert.equal(p.slug, 'sai-krishna-green-heights');
    assert.equal(p.web.published, false);
    // not on the website yet
    assert.ok(!(await call('/api/public/projects', { auth: false })).body.some((x) => x.id === p.id));
    assert.equal((await call(`/api/public/projects/${p.slug}`, { auth: false })).status, 404);
    // can't publish while details are missing
    const early = await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { web: { published: true } } });
    assert.equal(early.status, 400);
    assert.ok(early.body.missing.includes('at least one photo'));
    // fill in the details
    const web = {
      status: 'ongoing',
      tagline: 'Green living near Khandagiri',
      about: 'Sai Krishna Green Heights brings 2 and 3 BHK homes with open green spaces, close to schools and the ring road.',
      configs: ['2 BHK', '3 BHK'],
      startingPrice: 5500000,
      possession: 'Dec 2028',
      highlights: ['RERA approved', 'Near Khandagiri square'],
      amenities: ['Gym', 'Swimming pool'],
      mapUrl: 'https://maps.google.com/?q=Khandagiri',
    };
    assert.equal((await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { web: { ...web, mapUrl: 'javascript:alert(1)' } } })).status, 400); // only https links
    assert.equal((await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { web } })).status, 200);
    // photos: staff can't, owner can; junk is refused
    assert.equal((await as(vic, `/api/projects/${p.id}/photos`, { method: 'POST', body: { data: PNG } })).status, 403);
    assert.equal((await as(owner, `/api/projects/${p.id}/photos`, { method: 'POST', body: { data: 'data:text/html;base64,PGgxPg==' } })).status, 400);
    const ph1 = await as(owner, `/api/projects/${p.id}/photos`, { method: 'POST', body: { data: PNG, alt: 'Front view' } });
    assert.equal(ph1.status, 201);
    const ph2 = await as(owner, `/api/projects/${p.id}/photos`, { method: 'POST', body: { data: PNG, alt: 'Garden' } });
    const [a, b] = ph2.body.web.photos;
    // reorder: the garden becomes the cover
    const re = await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { web: { photos: [{ id: b.id, alt: 'Garden' }, { id: a.id, alt: 'Front view' }] } } });
    assert.equal(re.body.web.photos[0].id, b.id);
    // the owner can preview before publishing; the public can't
    const prev = await as(owner, `/api/public/projects/${p.slug}?preview=1`);
    assert.equal(prev.status, 200);
    assert.equal(prev.body.preview, true);
    assert.equal((await as(vic, `/api/public/projects/${p.slug}?preview=1`)).status, 404);
    // publish
    const pub = await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { web: { published: true } } });
    assert.equal(pub.status, 200);
    const pubList = (await call('/api/public/projects', { auth: false })).body;
    const shown = pubList.find((x) => x.id === p.id);
    assert.ok(shown);
    assert.equal(shown.name, 'Sai Krishna Green Heights');
    assert.equal(shown.startingPrice, 5500000);
    assert.equal(shown.photos[0].url, `/api/public/photos/${b.id}`);
    assert.equal(shown.history, undefined); // nothing internal on the website
    assert.equal(shown.createdBy, undefined);
    assert.ok(!pubList.some((x) => x.builtIn !== undefined || x.leads !== undefined));
    // the photo itself is served as an image, cached
    const img = await fetch(base + shown.photos[0].url);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get('content-type'), 'image/png');
    assert.match(img.headers.get('cache-control'), /immutable/);
    // rename: new web address, the old one still works
    const ren = await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { name: 'Sai Krishna Green Hills' } });
    assert.equal(ren.body.slug, 'sai-krishna-green-hills');
    assert.equal((await call('/api/public/projects/sai-krishna-green-heights', { auth: false })).body.slug, 'sai-krishna-green-hills');
    // can't remove the last photo or delete while it is on the website
    await as(owner, `/api/projects/${p.id}/photos/${a.id}`, { method: 'DELETE', body: {} });
    assert.equal((await as(owner, `/api/projects/${p.id}/photos/${b.id}`, { method: 'DELETE', body: {} })).status, 400);
    assert.equal((await as(owner, `/api/projects/${p.id}`, { method: 'DELETE', body: {} })).status, 409);
    // hide it, then delete: photos go too
    assert.equal((await as(owner, `/api/projects/${p.id}`, { method: 'PATCH', body: { web: { published: false } } })).status, 200);
    assert.ok(!(await call('/api/public/projects', { auth: false })).body.some((x) => x.id === p.id));
    assert.equal((await as(owner, `/api/projects/${p.id}`, { method: 'DELETE', body: {} })).status, 200);
    const db = await getDb();
    assert.equal(await db.collection('project_photos').countDocuments({ projectId: p.id }), 0);
    // all in the activity log
    const log = (await as(owner, '/api/activity?limit=2000')).body.filter((x) => x.target?.name?.startsWith('Sai Krishna Green'));
    const types = log.map((x) => x.type);
    assert.ok(['project_created', 'project_updated', 'project_published', 'project_unpublished', 'project_deleted'].every((t) => types.includes(t)));
    assert.ok(log.some((x) => /Website photo added/.test(x.note || '')));
    // the built-in projects are still locked for website edits too
    assert.equal((await as(owner, '/api/projects/PRJ-PANCHAWATI', { method: 'PATCH', body: { web: { published: true } } })).status, 403);
  });
  test('title (Mr. / Mrs. / Ms. / Dr.): chosen, never guessed; owner sets staff, everyone sets their own; recorded', async () => {
    const t = await as(owner, '/api/users', { method: 'POST', body: { name: 'Priya Nayak', email: 'priya.t@test.in', role: 'sales', password: 'PriyaTitle123', title: 'Ms.' } });
    assert.equal(t.body.title, 'Ms.');
    assert.equal((await as(owner, '/api/users', { method: 'POST', body: { name: 'Bad Title', email: 'bad.t@test.in', role: 'sales', password: 'BadTitle1234', title: 'Sir' } })).status, 400);
    const u = await as(owner, `/api/users/${t.body.id}`, { method: 'PATCH', body: { title: 'Mrs.' } });
    assert.equal(u.body.title, 'Mrs.');
    assert.deepEqual(u.body.history[0].changes.title, { from: 'Ms.', to: 'Mrs.' });
    // the person sees it on login and can change their own
    const ck = (await login('priya.t@test.in', 'PriyaTitle123')).ck;
    assert.equal((await as(ck, '/api/auth/me')).body.title, 'Mrs.');
    assert.equal((await as(ck, '/api/auth/me', { method: 'PATCH', body: { title: 'Dr.' } })).body.title, 'Dr.');
    assert.equal((await as(ck, '/api/auth/me')).body.title, 'Dr.');
    assert.equal((await as(ck, '/api/auth/me', { method: 'PATCH', body: { title: 'Lord' } })).status, 400);
    // the owner sets their own too
    assert.equal((await as(owner, '/api/auth/me', { method: 'PATCH', body: { title: 'Mr.' } })).body.title, 'Mr.');
    assert.equal((await as(owner, '/api/auth/me', { method: 'PATCH', body: { title: '' } })).body.title, '');
    const log = (await as(owner, '/api/activity?type=user_updated')).body;
    assert.ok(log.some((a) => a.email === 'priya.t@test.in' && a.changes?.title?.to === 'Dr.'));
  });
  test('activity log: every piece of work on a lead or visit is recorded, linked to the lead; Fidelsya stays hidden', async () => {
    const l = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Log Lead', phone: '9555000501', project: 'Panchawati Residency' } })).body;
    await as(owner, `/api/leads/${l.id}`, { method: 'PATCH', body: { config: '3 BHK', notes: 'Wants east facing' } });
    await as(owner, `/api/leads/${l.id}/attempts`, { method: 'POST', body: { type: 'Call', outcome: 'connected', note: 'Coming Sunday' } });
    await as(owner, '/api/leads/status', { method: 'POST', body: { ids: [l.id], status: 'negotiation' } });
    await as(owner, `/api/leads/${l.id}/commit`, { method: 'POST', body: { result: 'won', value: 6500000, unit: 'B-402', note: '' } });
    await as(owner, `/api/leads/${l.id}/reopen`, { method: 'POST', body: {} });
    const v = (await as(vic, '/api/visits', { method: 'POST', body: { customerName: 'Log Lead', phone: '9555000501', rating: 5, outcome: 'booking' } })).body;
    await as(owner, `/api/visits/${v.id}`, { method: 'PATCH', body: { rating: 4 } });
    await as(owner, `/api/visits/${v.id}`, { method: 'DELETE', body: {} });
    await as(owner, '/api/leads/import', { method: 'POST', body: { drafts: [{ name: 'Imp One', phone: '9555000502' }, { name: 'Imp Two', phone: '9555000503' }] } });
    const log = (await as(owner, '/api/activity?limit=2000')).body;
    const about = log.filter((a) => a.ref?.id === l.id);
    const types = about.map((a) => a.type);
    for (const t of ['lead_created', 'lead_updated', 'attempt_logged', 'lead_status_changed', 'deal_won', 'deal_reopened', 'visit_recorded', 'visit_updated'])
      assert.ok(types.includes(t), t + ' is logged');
    assert.deepEqual(about.find((a) => a.type === 'lead_updated').changes.config, { from: '', to: '3 BHK' });
    assert.match(about.find((a) => a.type === 'deal_won').note, /₹65,00,000 · B-402/);
    assert.match(about.find((a) => a.type === 'attempt_logged').note, /Call · connected · “Coming Sunday”/);
    assert.equal(about.find((a) => a.type === 'visit_recorded').email, 'vic@test.in'); // who did it
    assert.ok(log.some((a) => a.type === 'visit_deleted' && a.target.name === 'Log Lead'));
    assert.ok(log.some((a) => a.type === 'leads_imported' && /2 lead\(s\) from Excel/.test(a.note)));
    // Fidelsya's work on a lead: Fidelsya sees it, the owner does not
    await as(fid, `/api/leads/${l.id}/attempts`, { method: 'POST', body: { type: 'Call', outcome: 'connected', note: 'support check' } });
    assert.ok(!(await as(owner, '/api/activity?limit=2000')).body.some((a) => /support check/.test(a.note || '')));
    assert.ok((await as(fid, '/api/activity?limit=2000')).body.some((a) => /support check/.test(a.note || '')));
  });

  test('Management (CMO, GM): every owner power by default, but the owner holds the keys', async () => {
    const make = (ck, body) => as(ck, '/api/users', { method: 'POST', body });
    const c = await make(owner, { name: 'Ravi Kumar', email: 'cmo@test.in', title: 'Mr.', designation: 'CMO', role: 'management', password: 'CmoPass12345' });
    assert.equal(c.status, 201);
    assert.equal(c.body.designation, 'CMO');
    const all = (await as(owner, '/api/users/meta')).body.permissions.map((p) => p.id);
    assert.deepEqual([...c.body.permissions].sort(), [...all].sort()); // everything, like the owner
    const g = (await make(owner, { name: 'Gita Rao', email: 'gm@test.in', title: 'Mrs.', designation: 'GM', role: 'management', password: 'GmPass123456' })).body;

    const cmo = (await login('cmo@test.in', 'CmoPass12345')).ck;
    const me = (await as(cmo, '/api/auth/me')).body;
    assert.equal(me.role, 'management');
    assert.equal(me.designation, 'CMO');
    assert.equal(me.title, 'Mr.');
    for (const path of ['/api/users', '/api/activity', '/api/leads/trash', '/api/reports']) {
      const r = await as(cmo, path);
      assert.ok(r.status !== 403, path + ' is open for Management');
    }
    assert.deepEqual((await as(cmo, '/api/users/meta')).body.canCreate, ['sales', 'site_visit']);
    assert.ok(!(await as(cmo, '/api/users')).body.some((u) => u.email === 'fid@fidelsya.test')); // Fidelsya hidden

    // can run the sales team…
    const s = await make(cmo, { name: 'Neha Sales', email: 'neha@test.in', role: 'sales', password: 'NehaSales123', permissions: ['leads.create', 'team.manage'] });
    assert.equal(s.status, 201);
    assert.deepEqual(s.body.permissions, ['leads.create']); // owner-level powers never go to sales
    // …but never the owner, another Management account, or a new owner / Management
    assert.equal((await make(cmo, { name: 'Xavier One', email: 'x1@test.in', role: 'management', password: 'Xxxxxxxx123' })).status, 403);
    assert.equal((await make(cmo, { name: 'Xavier Two', email: 'x2@test.in', role: 'owner', password: 'Xxxxxxxx123' })).status, 403);
    assert.equal((await as(cmo, `/api/users/${ownerId}`, { method: 'PATCH', body: { name: 'Hacked' } })).status, 403);
    assert.equal((await as(cmo, `/api/users/${g.id}`, { method: 'PATCH', body: { name: 'Hacked' } })).status, 403);
    assert.equal((await as(cmo, `/api/users/${g.id}/password`, { method: 'POST', body: { password: 'NewPass12345' } })).status, 403);
    assert.equal((await as(cmo, `/api/users/${g.id}/status`, { method: 'PATCH', body: { active: false } })).status, 403);

    // the owner takes some powers away: they stop at once, and CMO can't hand them out either
    const cut = await as(owner, `/api/users/${c.body.id}`, { method: 'PATCH', body: { permissions: all.filter((p) => !['activity.view', 'leads.delete'].includes(p)), designation: 'Chief Marketing Officer' } });
    assert.equal(cut.status, 200);
    assert.deepEqual(cut.body.history[0].changes.permissions.removed.sort(), ['activity.view', 'leads.delete']);
    assert.equal(cut.body.designation, 'Chief Marketing Officer');
    assert.equal((await as(cmo, '/api/activity')).status, 403);
    const n = await as(cmo, `/api/users/${s.body.id}`, { method: 'PATCH', body: { permissions: ['leads.create', 'leads.delete'] } });
    assert.deepEqual(n.body.permissions, ['leads.create']);

    // everything CMO did is in the owner's activity log
    const log = (await as(owner, '/api/activity?limit=2000')).body;
    assert.ok(log.some((a) => a.type === 'admin_created' && a.email === 'cmo@test.in' && a.target.email === 'neha@test.in'));
    assert.ok(log.some((a) => a.type === 'user_updated' && a.email === 'admin@test.in' && a.target.email === 'cmo@test.in'));

    // owner resets the password (CMO logged out); Fidelsya can change Management too
    assert.equal((await as(owner, `/api/users/${c.body.id}/password`, { method: 'POST', body: { password: 'Fresh123456' } })).status, 200);
    assert.equal((await as(cmo, '/api/auth/me')).status, 401);
    assert.equal((await as(fid, `/api/users/${g.id}`, { method: 'PATCH', body: { phone: '9876512345' } })).status, 200);
    // made Sales: owner-level powers are dropped
    const moved = await as(owner, `/api/users/${g.id}`, { method: 'PATCH', body: { role: 'sales' } });
    assert.ok(!moved.body.permissions.some((p) => ['team.manage', 'activity.view', 'projects.manage'].includes(p)));
    assert.ok(moved.body.permissions.includes('leads.view_all'));
  });

  test('duplicate lead: warned with who has it; "add anyway" is kept on the lead and in the log', async () => {
    const neha = (await login('neha@test.in', 'NehaSales123')).ck; // sales, made by the CMO above (no "see all leads")
    const first = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Dup Customer', phone: '9555000701' } })).body;
    assert.equal(first.phoneKey, '9555000701');
    await as(owner, '/api/leads/assign', { method: 'POST', body: { ids: [first.id], to: 'sam@test.in' } });
    // the owner sees the lead itself
    const chk = (await as(owner, '/api/leads/check-phone?phone=%2B91%2095550%2000701')).body.duplicates;
    assert.equal(chk.length, 1);
    assert.equal(chk[0].id, first.id);
    assert.equal(chk[0].owner, 'Sam Sales');
    // sales without "see all" only learns who has it, not the customer
    const seen = (await as(neha, '/api/leads/check-phone?phone=9555000701')).body.duplicates[0];
    assert.equal(seen.owner, 'Sam Sales');
    assert.equal(seen.id, undefined);
    assert.equal(seen.name, undefined);
    // adding it again is stopped…
    const again = await as(neha, '/api/leads', { method: 'POST', body: { name: 'Dup Again', phone: '9555000701' } });
    assert.equal(again.status, 409);
    assert.equal(again.body.code, 'duplicate');
    // …unless they choose "add anyway": recorded on the lead and in the activity log
    const anyway = await as(neha, '/api/leads', { method: 'POST', body: { name: 'Dup Again', phone: '9555000701', allowDuplicate: true } });
    assert.equal(anyway.status, 201);
    assert.deepEqual(anyway.body.duplicateOf, []); // neha can't see the other lead's id
    assert.match(anyway.body.history[0].text, /already a lead: a lead \(with Sam Sales\)/);
    const ownerView = (await as(owner, '/api/leads')).body.find((l) => l.id === anyway.body.id);
    assert.ok(ownerView.duplicateNote);
    assert.ok((await as(owner, '/api/activity?type=lead_duplicate_added')).body.some((a) => a.ref?.id === anyway.body.id));
    // changing a lead's number to someone else's is checked too; its own number is not a duplicate
    const other = (await as(owner, '/api/leads', { method: 'POST', body: { name: 'Other One', phone: '9555000702' } })).body;
    assert.equal((await as(owner, `/api/leads/${other.id}`, { method: 'PATCH', body: { phone: '9555000701' } })).status, 409);
    assert.equal((await as(owner, `/api/leads/${other.id}`, { method: 'PATCH', body: { phone: '9555000702', notes: 'same number' } })).status, 200);
    // a deleted lead with the number is mentioned as "in the recycle bin"
    await as(owner, '/api/leads/delete', { method: 'POST', body: { ids: [other.id] } });
    const binned = (await as(owner, '/api/leads/check-phone?phone=9555000702')).body.duplicates;
    assert.equal(binned[0].inBin, true);
    // Excel import never stops, but marks possible duplicates
    const imp = (await as(owner, '/api/leads/import', { method: 'POST', body: { drafts: [{ name: 'Imp Dup', phone: '+91 95550 00701' }, { name: 'Imp New', phone: '9555000703' }] } })).body;
    assert.ok(imp.find((l) => l.name === 'Imp Dup').duplicateOf.includes(first.id));
    assert.equal(imp.find((l) => l.name === 'Imp New').duplicateOf, undefined);
  });

  test('deal value check: odd values need a "yes, correct"; impossible ones only the owner / Management can confirm', async () => {
    const mk = async (body) => (await as(owner, '/api/leads', { method: 'POST', body: { allowDuplicate: true, ...body } })).body;
    const commit = (ck, id, value, extra = {}) =>
      as(ck, `/api/leads/${id}/commit`, { method: 'POST', body: { result: 'won', value, unit: 'B-1', note: '', ...extra } });
    await as(owner, '/api/users', { method: 'POST', body: { name: 'Vee Sales', email: 'vee@test.in', role: 'sales', password: 'VeeSales1234' } });
    const vee = (await login('vee@test.in', 'VeeSales1234')).ck; // default sales permissions (can close deals)
    // a normal value just goes through
    const ok = await mk({ name: 'Value Ok', phone: '9555000801', budget: 6000000 });
    assert.equal((await commit(owner, ok.id, 6500000)).status, 200);
    // 10× the budget (₹6.5 crore for a ₹60 lakh budget): needs a confirmation
    const odd = await mk({ name: 'Value Odd', phone: '9555000802', budget: 6000000 });
    await as(owner, '/api/leads/assign', { method: 'POST', body: { ids: [odd.id], to: 'vee@test.in' } });
    const w = await commit(vee, odd.id, 65000000);
    assert.equal(w.status, 422);
    assert.equal(w.body.code, 'value_check');
    assert.equal(w.body.canConfirm, true);
    assert.match(w.body.check.reasons.join(' '), /budget/);
    const yes = await commit(vee, odd.id, 65000000, { confirmValue: true });
    assert.equal(yes.status, 200);
    assert.equal(yes.body.status, 'won');
    assert.equal(yes.body.valueCheck.value, 65000000);
    assert.equal(yes.body.valueCheck.confirmedBy.email, 'vee@test.in');
    assert.ok((await as(owner, '/api/activity?type=deal_value_confirmed')).body.some((a) => a.ref?.id === odd.id && a.email === 'vee@test.in'));
    // ₹650 crore: impossible → sales can't confirm, the owner can
    const typo = await mk({ name: 'Value Typo', phone: '9555000803' });
    await as(owner, '/api/leads/assign', { method: 'POST', body: { ids: [typo.id], to: 'vee@test.in' } });
    const blocked = await commit(vee, typo.id, 6500000000, { confirmValue: true });
    assert.equal(blocked.status, 422);
    assert.equal(blocked.body.canConfirm, false);
    assert.equal((await commit(owner, typo.id, 6500000000, { confirmValue: true })).status, 200);
    // editing the expected value is checked the same way
    const ed = await mk({ name: 'Value Edit', phone: '9555000804' });
    assert.equal((await as(owner, `/api/leads/${ed.id}`, { method: 'PATCH', body: { dealValue: 500 } })).status, 422);
    const fixed = await as(owner, `/api/leads/${ed.id}`, { method: 'PATCH', body: { dealValue: 500, confirmValue: true } });
    assert.equal(fixed.status, 200);
    assert.equal(fixed.body.valueCheck.level, 'block');
    assert.equal((await as(owner, `/api/leads/${ed.id}`, { method: 'PATCH', body: { dealValue: 4500000 } })).status, 200);
  });

  test('"Delete forever": owner only (typing DELETE); kept 120 days in an archive only Fidelsya sees', async () => {
    const db = await getDb();
    const mk = async (name, phone) => (await as(owner, '/api/leads', { method: 'POST', body: { name, phone, allowDuplicate: true } })).body;
    const x = await mk('Forever One', '9555000901');
    const y = await mk('Forever Two', '9555000902');
    const z = await mk('Fid Deleted', '9555000903');
    await as(owner, '/api/leads/delete', { method: 'POST', body: { ids: [x.id, y.id] } });
    await as(fid, '/api/leads/delete', { method: 'POST', body: { ids: [z.id] } });
    // nobody else: not Management, not sales
    const cmo = (await login('cmo@test.in', 'Fresh123456')).ck;
    assert.equal((await as(cmo, '/api/leads/trash/purge', { method: 'POST', body: { ids: [x.id], confirm: 'DELETE' } })).status, 403);
    assert.equal((await as(sales, '/api/leads/trash/purge', { method: 'POST', body: { ids: [x.id], confirm: 'DELETE' } })).status, 403);
    // the owner must type DELETE exactly
    assert.equal((await as(owner, '/api/leads/trash/purge', { method: 'POST', body: { ids: [x.id], confirm: 'delete' } })).status, 400);
    // a lead Fidelsya deleted can't be touched by the owner
    const zr = await as(owner, '/api/leads/trash/purge', { method: 'POST', body: { ids: [z.id], confirm: 'DELETE' } });
    assert.equal(zr.body.purged, 0, JSON.stringify(zr));
    assert.equal(await db.collection('leads_trash').countDocuments({ id: z.id }), 1);
    const gone = await as(owner, '/api/leads/trash/purge', { method: 'POST', body: { ids: [x.id, y.id], confirm: 'DELETE' } });
    assert.equal(gone.body.purged, 2);
    // gone for the client…
    assert.ok(!(await as(owner, '/api/leads/trash')).body.some((l) => [x.id, y.id].includes(l.id)));
    assert.ok(!(await as(owner, '/api/leads')).body.some((l) => [x.id, y.id].includes(l.id)));
    assert.equal((await as(owner, '/api/leads/archive')).status, 403);
    // …recorded with who, how many, the IDs and names (owner and Fidelsya both see it)
    const entry = (await as(owner, '/api/activity?type=leads_purged')).body.find((a) => a.note.includes(x.id));
    assert.equal(entry.email, 'admin@test.in');
    assert.match(entry.note, /2 lead\(s\) deleted forever: .*Forever One.*Forever Two/);
    assert.ok((await as(fid, '/api/activity?type=leads_purged')).body.some((a) => a.note.includes(x.id)));
    // …but Fidelsya still has them for 120 days
    const arc = (await as(fid, '/api/leads/archive')).body;
    const ax = arc.find((l) => l.id === x.id);
    assert.ok(ax);
    const days = (Date.parse(ax.archived.expireAt) - Date.parse(ax.archived.at)) / 864e5;
    assert.equal(Math.round(days), 120);
    assert.equal(ax.archived.by.email, 'admin@test.in');
    // Fidelsya brings one back (the client sees it again, without Fidelsya's name) and removes the other
    assert.equal((await as(fid, '/api/leads/archive/restore', { method: 'POST', body: { ids: [x.id] } })).status, 200);
    const back = (await as(owner, '/api/leads')).body.find((l) => l.id === x.id);
    assert.ok(back);
    assert.ok(!JSON.stringify(back.history).includes('Support'));
    assert.equal((await as(fid, '/api/leads/archive/purge', { method: 'POST', body: { ids: [y.id] } })).body.purged, 1);
    assert.equal(await db.collection('leads_archive').countDocuments({ id: { $in: [x.id, y.id] } }), 0);
    // MongoDB removes archive entries by itself when they expire
    const ttl = (await db.collection('leads_archive').indexes()).find((i) => i.key['archived.expireAt']);
    assert.equal(ttl.expireAfterSeconds, 0);
    // Fidelsya's archive work stays hidden from the client
    const ownerLog = (await as(owner, '/api/activity?limit=2000')).body;
    assert.ok(!ownerLog.some((a) => a.type === 'leads_archive_restored' || a.type === 'leads_archive_purged'));
  });

  test('notifications: a device is saved for the signed-in person, removed on turn-off / logout, all logged', async () => {
    const db = await getDb();
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-device-1', expirationTime: null, keys: { p256dh: 'BPx'.padEnd(87, 'a'), auth: 'authsecret12345' } };
    assert.equal((await as('', '/api/push/key')).status, 401); // login needed
    assert.equal(typeof (await as(owner, '/api/push/key')).body.publicKey, 'string');
    assert.equal((await as(owner, '/api/push/subscribe', { method: 'POST', body: { subscription: { endpoint: 'not a url' } } })).status, 400);
    assert.equal((await as(owner, '/api/push/subscribe', { method: 'POST', body: { subscription: sub }, headers: { 'X-Device-Id': 'abcdefabcdef' } })).status, 200);
    const saved = await db.collection('push_subscriptions').findOne({ endpoint: sub.endpoint });
    assert.equal(saved.email, 'admin@test.in');
    assert.equal(saved.deviceId, 'abcdefabcdef');
    // the same browser again: still one record
    await as(owner, '/api/push/subscribe', { method: 'POST', body: { subscription: sub } });
    assert.equal(await db.collection('push_subscriptions').countDocuments({ endpoint: sub.endpoint }), 1);
    // someone else can't remove my device
    await as(sales, '/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } });
    assert.equal(await db.collection('push_subscriptions').countDocuments({ endpoint: sub.endpoint }), 1);
    // logout on this device removes it
    assert.equal((await as(owner, '/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint, reason: 'logout' } })).status, 200);
    assert.equal(await db.collection('push_subscriptions').countDocuments({ endpoint: sub.endpoint }), 0);
    const log = (await as(owner, '/api/activity?email=admin@test.in&limit=50')).body;
    assert.ok(log.some((a) => a.type === 'push_enabled'));
    assert.ok(log.some((a) => a.type === 'push_disabled' && /Logged out/.test(a.note)));
    // a website enquiry still works when notifications are not set up on the server (tests have no keys)
    assert.equal((await call('/api/enquiries', { method: 'POST', body: enquiry({ name: 'Push Visitor', phone: '9876500999' }), auth: false, headers: { 'X-Forwarded-For': '10.0.0.91' } })).status, 201);
  });

  test('monthly report: by project and source, enquiries counted; PDF download is owner-level and logged', async () => {
    const mk = async (body) => (await as(owner, '/api/leads', { method: 'POST', body: { allowDuplicate: true, ...body } })).body;
    const a = await mk({ name: 'Rep A', phone: '9555001001', project: 'Report Test Residency', source: 'Facebook' });
    await mk({ name: 'Rep B', phone: '9555001002', project: 'Report Test Residency', source: 'Website' });
    await as(owner, `/api/leads/${a.id}/commit`, { method: 'POST', body: { result: 'won', value: 6500000, unit: 'A-1', note: '' } });
    const from = new Date(Date.now() - 3600e3).toISOString();
    const rep = (await as(owner, `/api/reports?from=${encodeURIComponent(from)}`)).body;
    const pw = rep.projects.find((x) => x.name === 'Report Test Residency');
    assert.equal(pw.newLeads, 2);
    assert.equal(pw.won, 1);
    assert.equal(pw.wonValue, 6500000);
    assert.equal(rep.sources.find((x) => x.name === 'Facebook').won, 1);
    assert.equal(typeof rep.totals.enquiries, 'number');
    // the PDF download: owner yes (logged), sales no
    const vee = (await login('vee@test.in', 'VeeSales1234')).ck;
    assert.equal((await as(vee, '/api/reports/downloaded', { method: 'POST', body: { month: '2026-11' } })).status, 403);
    assert.equal((await as(owner, '/api/reports/downloaded', { method: 'POST', body: { month: 'Nov' } })).status, 400);
    assert.equal((await as(owner, '/api/reports/downloaded', { method: 'POST', body: { month: '2026-11' } })).status, 200);
    const log = (await as(owner, '/api/activity?type=report_downloaded')).body;
    assert.match(log[0].note, /Monthly report 2026-11/);
    // Management has it by default (it is an owner-level power)
    assert.ok((await as(owner, '/api/users/meta')).body.roles.find((r) => r.id === 'management').defaultPermissions.includes('reports.download'));
  });
});
