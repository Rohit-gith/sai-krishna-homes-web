import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { Binary } from 'mongodb';
import { z } from 'zod';
import { ACTIVITY, logActivity } from '../audit.js';
import { getDb } from '../db.js';
import { can } from '../permissions.js';
import { readSession, requireAdmin } from '../security.js';
import { hideFidelsya, mark } from '../clientView.js';

/*
 * The CRM's project list (used by leads, Excel import, site visits, dashboard, reports).
 * - The two website projects are built in and locked: nobody can rename or delete them.
 * - Owners / co-owners add new projects, fix a name (the leads and visits using it are renamed too),
 *   and delete a project nobody uses yet. Everything is kept in the project's history and the
 *   activity log, with time and who did it.
 * - A new project can also get a page on the website: the owner fills in its website details and
 *   photos, then switches "Show on website" on. Photos are stored in MongoDB (project_photos).
 */
export const BUILT_IN = [
  { id: 'PRJ-PANCHAWATI', name: 'Panchawati Residency', location: 'Patia, Bhubaneswar', rera: 'RP/19/2023/00993' },
  { id: 'PRJ-SAIKRISHNA', name: 'Sai Krishna Residency', location: 'South Bhubaneswar', rera: 'MP/19/2024/01126' },
];
const RESERVED_SLUGS = ['panchawati-residency', 'sai-krishna-residency'];

export const WEB_STATUS = ['upcoming', 'ongoing', 'ready', 'completed'];
const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024; // the CRM shrinks photos before upload; this is a safety cap
const PHOTO_TYPES = { 'image/webp': 1, 'image/jpeg': 1, 'image/png': 1 };

const r = Router();
const support = (x) => !!x && (x.email === 'support' || x.email === 'script' || x.role === 'superowner');
const cleanProject = (p) => {
  if (!p || typeof p !== 'object' || !('builtIn' in p)) return p;
  return { ...p, createdBy: support(p.createdBy) ? null : p.createdBy, history: (p.history || []).filter((h) => !h.support && !support(h.by)) };
};
r.use(requireAdmin, hideFidelsya(cleanProject));
const ownersOnly = (req, res, next) => (can(req.admin, 'projects.manage') ? next() : res.status(403).json({ error: 'Only the owner can manage projects.' }));

const now = () => new Date().toISOString();
const uid = () => randomUUID().slice(0, 8);
const strip = ({ _id, ...p }) => p;
const nameKey = (s) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project';

/** Make sure the two built-in projects exist (first run on a new database). */
let seeded = null;
async function col() {
  const db = await getDb();
  const c = db.collection('projects');
  seeded ??= (async () => {
    await c.createIndex({ id: 1 }, { unique: true });
    await c.createIndex({ nameKey: 1 }, { unique: true });
    await c.createIndex({ slug: 1 }, { sparse: true });
    await db.collection('project_photos').createIndex({ id: 1 }, { unique: true });
    await db.collection('project_photos').createIndex({ projectId: 1 });
    for (const p of BUILT_IN) {
      await c.updateOne(
        { id: p.id },
        { $setOnInsert: { ...p, nameKey: nameKey(p.name), builtIn: true, createdAt: now(), createdBy: null, history: [] } },
        { upsert: true },
      );
    }
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  await seeded;
  return { db, c };
}

/** A web address for the project page that no other project uses. */
async function freeSlug(c, name, selfId = null) {
  const base = slugify(name);
  for (let i = 1; i < 50; i++) {
    const s = i === 1 ? base : `${base}-${i}`;
    if (RESERVED_SLUGS.includes(s)) continue;
    const taken = await c.findOne({ $or: [{ slug: s }, { oldSlugs: s }], id: { $ne: selfId } });
    if (!taken) return s;
  }
  return `${base}-${uid()}`;
}

const Fields = z
  .object({
    name: z.string().trim().min(2, 'Enter the project name').max(80),
    location: z.string().trim().max(120).default(''),
    rera: z.string().trim().max(60).default(''),
    note: z.string().trim().max(300).default(''),
  })
  .strict();

const httpsUrl = z.union([z.literal(''), z.string().trim().max(600).url().startsWith('https://', 'Links must start with https://')]);
const list = (max, each) => z.array(z.string().trim().min(1).max(each)).max(max);
/** What the website shows for a project (all optional until it is published). */
const Web = z
  .object({
    status: z.enum(WEB_STATUS),
    tagline: z.string().trim().max(140),
    about: z.string().trim().max(4000),
    configs: list(10, 30),
    startingPrice: z.number().min(0).max(1e10).nullable(), // rupees
    possession: z.string().trim().max(40),
    units: z.string().trim().max(30),
    land: z.string().trim().max(40),
    highlights: list(15, 240),
    amenities: list(30, 60),
    address: z.string().trim().max(240),
    mapUrl: httpsUrl,
    reraUrl: httpsUrl,
    contact: z.enum(['cmo', 'gm']),
    photos: z.array(z.object({ id: z.string().max(20), alt: z.string().trim().max(120).default('') }).strict()).max(MAX_PHOTOS), // order + captions
    published: z.boolean(),
  })
  .partial()
  .strict();

const WEB_DEFAULTS = {
  published: false,
  status: 'upcoming',
  tagline: '',
  about: '',
  configs: [],
  startingPrice: null,
  possession: '',
  units: '',
  land: '',
  highlights: [],
  amenities: [],
  address: '',
  mapUrl: '',
  reraUrl: '',
  contact: 'cmo',
  photos: [],
};
const webOf = (p) => ({ ...WEB_DEFAULTS, ...(p.web || {}) });

/** What is still missing before a project can go on the website. */
function missingForWebsite(p) {
  const w = webOf(p);
  return [
    !p.location && 'location',
    !w.photos.length && 'at least one photo',
    w.about.length < 40 && 'a description (at least 40 characters)',
    !w.configs.length && 'the home types (e.g. 2 BHK)',
  ].filter(Boolean);
}

const LABEL = {
  status: 'Status',
  tagline: 'Tagline',
  about: 'Description',
  configs: 'Home types',
  startingPrice: 'Starting price',
  possession: 'Possession',
  units: 'Total homes',
  land: 'Land area',
  highlights: 'Highlights',
  amenities: 'Amenities',
  address: 'Address',
  mapUrl: 'Map link',
  reraUrl: 'RERA link',
  contact: 'Contact person',
  photos: 'Photos',
  published: 'Shown on website',
};
const shortVal = (v) => {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' ? x.alt || 'photo' : x)).join(', ').slice(0, 160);
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v).slice(0, 160);
};

/** Everyone signed in gets the list (for the dropdowns); owners also get how many leads / visits use each. */
r.get('/', async (req, res) => {
  const { db, c } = await col();
  const items = (await c.find({}).toArray()).map(strip);
  items.sort((a, b) => Number(b.builtIn) - Number(a.builtIn) || a.name.localeCompare(b.name));
  if (can(req.admin, 'projects.manage')) {
    const [l, v] = await Promise.all([
      db.collection('leads').aggregate([{ $group: { _id: '$project', n: { $sum: 1 } } }]).toArray(),
      db.collection('visits').aggregate([{ $group: { _id: '$project', n: { $sum: 1 } } }]).toArray(),
    ]);
    const lc = Object.fromEntries(l.map((x) => [x._id, x.n]));
    const vc = Object.fromEntries(v.map((x) => [x._id, x.n]));
    for (const p of items) Object.assign(p, { leads: lc[p.name] || 0, visits: vc[p.name] || 0 });
    for (const p of items) if (!p.builtIn) Object.assign(p, { web: webOf(p), missing: missingForWebsite(p) });
  } else {
    for (const p of items) delete p.web;
  }
  res.json(items);
});

r.post('/', ownersOnly, async (req, res) => {
  const p = Fields.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Please check the details.' });
  const { c } = await col();
  const { note, ...d } = p.data;
  const name = d.name.replace(/\s+/g, ' ');
  if (await c.findOne({ nameKey: nameKey(name) })) return res.status(409).json({ error: 'A project with this name already exists.' });
  const at = now();
  const by = req.actor;
  const doc = {
    id: `PRJ-${uid().toUpperCase()}`,
    ...d,
    name,
    nameKey: nameKey(name),
    slug: await freeSlug(c, name),
    builtIn: false,
    web: { ...WEB_DEFAULTS },
    createdAt: at,
    createdBy: by,
    updatedAt: at,
    history: [{ id: uid(), at, by, action: 'created', note, ...mark(req) }],
  };
  await c.insertOne({ ...doc });
  await logActivity(ACTIVITY.PROJECT_CREATED, { email: req.admin.email, name: req.admin.name, req, target: { name, email: '' }, note: [d.location, d.rera && `RERA ${d.rera}`].filter(Boolean).join(' · ') });
  return res.status(201).json({ ...doc, missing: missingForWebsite(doc) });
});

r.patch('/:id', ownersOnly, async (req, res) => {
  const { web: webIn, ...rest } = req.body || {};
  const p = Fields.partial().safeParse(rest);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Please check the details.' });
  const w = webIn === undefined ? { success: true, data: {} } : Web.safeParse(webIn);
  if (!w.success) {
    const i = w.error.issues[0];
    return res.status(400).json({ error: `${LABEL[i?.path?.[0]] || 'Website details'}: ${i?.message || 'please check'}` });
  }
  const { db, c } = await col();
  const cur = await c.findOne({ id: req.params.id });
  if (!cur) return res.status(404).json({ error: 'Project not found.' });
  if (cur.builtIn) return res.status(403).json({ error: 'This website project is locked and cannot be changed.' });
  const { note = '', ...d } = p.data;
  if (d.name) d.name = d.name.replace(/\s+/g, ' ');
  const changes = {};
  for (const [k, v] of Object.entries(d)) if (v !== undefined && v !== (cur[k] || '')) changes[k] = { from: cur[k] || '', to: v };

  // website details: only what really changed
  const curWeb = webOf(cur);
  const nextWeb = { ...curWeb };
  for (const [k, v] of Object.entries(w.data)) {
    if (k === 'photos') {
      // reorder / captions only: photos are added and removed through their own routes
      const known = new Map(curWeb.photos.map((x) => [x.id, x]));
      if (v.length !== known.size || v.some((x) => !known.has(x.id))) return res.status(400).json({ error: 'Photos: the list does not match. Refresh and try again.' });
      nextWeb.photos = v.map((x) => ({ ...known.get(x.id), alt: x.alt }));
    } else nextWeb[k] = v;
    if (JSON.stringify(nextWeb[k]) !== JSON.stringify(curWeb[k])) changes[`web.${k}`] = { from: shortVal(curWeb[k]), to: shortVal(nextWeb[k]) };
  }
  if (!Object.keys(changes).length) return res.json({ ...strip(cur), web: curWeb, missing: missingForWebsite(cur) });
  if (changes.name && (await c.findOne({ nameKey: nameKey(d.name), id: { $ne: cur.id } }))) {
    return res.status(409).json({ error: 'A project with this name already exists.' });
  }
  const after = { ...cur, ...d, web: nextWeb };
  if (nextWeb.published) {
    const missing = missingForWebsite(after);
    if (missing.length) return res.status(400).json({ error: `Before it can go on the website, add: ${missing.join(', ')}.`, missing });
  }
  const at = now();
  const set = Object.fromEntries(Object.entries(changes).filter(([k]) => !k.startsWith('web.')).map(([k, v]) => [k, v.to]));
  set.web = nextWeb;
  if (!cur.slug) set.slug = await freeSlug(c, d.name || cur.name, cur.id); // projects added before website pages existed
  if (changes.name) {
    set.nameKey = nameKey(d.name);
    // a new web address; the old one keeps working
    set.slug = await freeSlug(c, d.name, cur.id);
    set.oldSlugs = [...new Set([...(cur.oldSlugs || []), cur.slug].filter(Boolean))];
  }
  // fixing a name: carry the leads and visits over to the new spelling
  let moved = { leads: 0, visits: 0 };
  if (changes.name) {
    const [l, v] = await Promise.all([
      db.collection('leads').updateMany({ project: cur.name }, { $set: { project: d.name, updatedAt: at } }),
      db.collection('visits').updateMany({ project: cur.name }, { $set: { project: d.name, updatedAt: at } }),
    ]);
    moved = { leads: l.modifiedCount, visits: v.modifiedCount };
  }
  const updated = await c.findOneAndUpdate(
    { id: cur.id },
    { $set: { ...set, updatedAt: at }, $push: { history: { $each: [{ id: uid(), at, by: req.actor, action: 'updated', changes, note, moved, ...mark(req) }], $position: 0 } } },
    { returnDocument: 'after' },
  );
  const publishedNow = !!nextWeb.published !== !!curWeb.published;
  await logActivity(publishedNow ? (nextWeb.published ? ACTIVITY.PROJECT_PUBLISHED : ACTIVITY.PROJECT_UNPUBLISHED) : ACTIVITY.PROJECT_UPDATED, {
    email: req.admin.email,
    name: req.admin.name,
    req,
    target: { name: updated.name, email: '' },
    changes,
    note: [
      note,
      changes.name && `${moved.leads} lead(s) and ${moved.visits} visit(s) moved to the new name`,
      Object.keys(changes).some((k) => k.startsWith('web.')) &&
        `Website: ${Object.keys(changes)
          .filter((k) => k.startsWith('web.'))
          .map((k) => LABEL[k.slice(4)])
          .join(', ')}`,
    ]
      .filter(Boolean)
      .join(' · '),
  });
  return res.json({ ...strip(updated), missing: missingForWebsite(updated) });
});

/** Add a photo (already shrunk in the browser): { data: "data:image/webp;base64,…", alt }. */
r.post('/:id/photos', ownersOnly, async (req, res) => {
  const p = z.object({ data: z.string().max(2.2e6), alt: z.string().trim().max(120).default('') }).strict().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'The photo is too large. Please choose a smaller one.' });
  const m = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(p.data.data);
  if (!m || !PHOTO_TYPES[m[1]]) return res.status(400).json({ error: 'Please upload a JPG, PNG or WebP photo.' });
  const bytes = Buffer.from(m[2], 'base64');
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) return res.status(400).json({ error: 'The photo is too large. Please choose a smaller one.' });
  const { db, c } = await col();
  const cur = await c.findOne({ id: req.params.id });
  if (!cur) return res.status(404).json({ error: 'Project not found.' });
  if (cur.builtIn) return res.status(403).json({ error: 'This website project is locked and cannot be changed.' });
  const web = webOf(cur);
  if (web.photos.length >= MAX_PHOTOS) return res.status(400).json({ error: `Up to ${MAX_PHOTOS} photos per project.` });
  const at = now();
  const photo = { id: `PH-${uid()}`, alt: p.data.alt };
  await db.collection('project_photos').insertOne({ id: photo.id, projectId: cur.id, mime: m[1], size: bytes.length, data: new Binary(bytes), createdAt: at, by: req.actor });
  const updated = await c.findOneAndUpdate(
    { id: cur.id },
    {
      $set: { web: { ...web, photos: [...web.photos, photo] }, updatedAt: at },
      $push: { history: { $each: [{ id: uid(), at, by: req.actor, action: 'updated', note: `Photo added${photo.alt ? `: ${photo.alt}` : ''}`, ...mark(req) }], $position: 0 } },
    },
    { returnDocument: 'after' },
  );
  await logActivity(ACTIVITY.PROJECT_UPDATED, { email: req.admin.email, name: req.admin.name, req, target: { name: cur.name, email: '' }, note: `Website photo added (${Math.round(bytes.length / 1024)} KB)` });
  return res.status(201).json({ ...strip(updated), missing: missingForWebsite(updated) });
});

r.delete('/:id/photos/:photoId', ownersOnly, async (req, res) => {
  const { db, c } = await col();
  const cur = await c.findOne({ id: req.params.id });
  if (!cur) return res.status(404).json({ error: 'Project not found.' });
  if (cur.builtIn) return res.status(403).json({ error: 'This website project is locked and cannot be changed.' });
  const web = webOf(cur);
  const photo = web.photos.find((x) => x.id === req.params.photoId);
  if (!photo) return res.status(404).json({ error: 'Photo not found.' });
  const photos = web.photos.filter((x) => x.id !== photo.id);
  if (web.published && !photos.length) return res.status(400).json({ error: 'A project on the website needs at least one photo. Add another first, or hide it from the website.' });
  const at = now();
  await db.collection('project_photos').deleteOne({ id: photo.id, projectId: cur.id });
  const updated = await c.findOneAndUpdate(
    { id: cur.id },
    {
      $set: { 'web.photos': photos, updatedAt: at },
      $push: { history: { $each: [{ id: uid(), at, by: req.actor, action: 'updated', note: `Photo removed${photo.alt ? `: ${photo.alt}` : ''}`, ...mark(req) }], $position: 0 } },
    },
    { returnDocument: 'after' },
  );
  await logActivity(ACTIVITY.PROJECT_UPDATED, { email: req.admin.email, name: req.admin.name, req, target: { name: cur.name, email: '' }, note: 'Website photo removed' });
  return res.json({ ...strip(updated), missing: missingForWebsite(updated) });
});

r.delete('/:id', ownersOnly, async (req, res) => {
  const { db, c } = await col();
  const cur = await c.findOne({ id: req.params.id });
  if (!cur) return res.status(404).json({ error: 'Project not found.' });
  if (cur.builtIn) return res.status(403).json({ error: 'This website project is locked and cannot be deleted.' });
  const [leads, visits] = await Promise.all([db.collection('leads').countDocuments({ project: cur.name }), db.collection('visits').countDocuments({ project: cur.name })]);
  if (leads || visits) {
    return res.status(409).json({
      error: `“${cur.name}” is used by ${leads} lead(s) and ${visits} site visit(s). Move them to another project first, then delete it.`,
      leads,
      visits,
    });
  }
  if (webOf(cur).published) return res.status(409).json({ error: `“${cur.name}” is on the website. Hide it from the website first, then delete it.` });
  await c.deleteOne({ id: cur.id });
  await db.collection('project_photos').deleteMany({ projectId: cur.id });
  // the deleted project stays on record in the activity log
  await logActivity(ACTIVITY.PROJECT_DELETED, {
    email: req.admin.email,
    name: req.admin.name,
    req,
    target: { name: cur.name, email: '' },
    note: [cur.location, cur.rera && `RERA ${cur.rera}`, `added ${cur.createdAt?.slice(0, 10)}`].filter(Boolean).join(' · '),
  });
  return res.json({ ok: true });
});

export default r;

/* ------------------------------------------------------------------------------------------------
 * Public (no login): what the website shows. Only projects switched on by the owner, and only
 * the website fields — never history, counts or who did what.
 * ---------------------------------------------------------------------------------------------- */
export const publicProjects = Router();

const publicView = (p) => {
  const w = webOf(p);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    location: p.location || '',
    rera: p.rera || '',
    ...Object.fromEntries(Object.keys(WEB_DEFAULTS).filter((k) => k !== 'photos').map((k) => [k, w[k]])),
    photos: w.photos.map((x) => ({ id: x.id, alt: x.alt || p.name, url: `/api/public/photos/${x.id}` })),
    updatedAt: p.updatedAt,
  };
};

/** Is this request from a signed-in owner (for previewing a project before it goes live)? */
async function ownerPreview(req, db) {
  const s = readSession(req);
  if (!s?.email) return false;
  const a = await db.collection('admins').findOne({ email: s.email, active: { $ne: false } });
  return !!a && (a.sessionVersion || 0) === (s.v || 0) && can({ role: a.role || 'owner', permissions: a.permissions || [] }, 'projects.manage');
}

publicProjects.get('/projects', async (_req, res) => {
  const { c } = await col();
  const items = await c.find({ builtIn: false, 'web.published': true }).sort({ createdAt: 1 }).toArray();
  // not cached: when the owner hides or renames a project, the website shows it at once
  res.json(items.map(publicView));
});

publicProjects.get('/projects/:slug', async (req, res) => {
  const { db, c } = await col();
  const slug = String(req.params.slug).slice(0, 80);
  const p = await c.findOne({ builtIn: false, $or: [{ slug }, { oldSlugs: slug }] });
  const preview = req.query.preview === '1' && p && !webOf(p).published && (await ownerPreview(req, db));
  if (!p || (!webOf(p).published && !preview)) return res.status(404).json({ error: 'Project not found.' });
  return res.json({ ...publicView(p), preview: !!preview });
});

publicProjects.get('/photos/:id', async (req, res) => {
  const db = await getDb();
  const ph = await db.collection('project_photos').findOne({ id: String(req.params.id).slice(0, 20) });
  if (!ph) return res.status(404).json({ error: 'Not found.' });
  res.set('Content-Type', ph.mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable'); // a photo never changes: a new one gets a new id
  return res.send(Buffer.from(ph.data.buffer));
});
