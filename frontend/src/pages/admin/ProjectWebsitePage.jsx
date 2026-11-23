import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  EyeOff,
  Globe,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { Btn, Card, Field, fieldCls } from '@/features/admin/components/ui';
import { fmtDateTime } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';
import { COMPANY, LEADERSHIP } from '@/data/companyInfo';
import { cn } from '@/utils/cn';

const STATUS = [
  ['upcoming', 'Upcoming (launching soon)'],
  ['ongoing', 'Ongoing (under construction)'],
  ['ready', 'Ready to move'],
  ['completed', 'Completed'],
];
const HOME_TYPES = [
  'Studio',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK',
  'Duplex',
  'Villa',
  'Plot',
  'Commercial',
];
const lines = (t) =>
  String(t || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const toForm = (w) => ({
  status: w.status,
  tagline: w.tagline,
  about: w.about,
  configs: w.configs,
  priceLakh: w.startingPrice ? String(+(w.startingPrice / 1e5).toFixed(2)) : '',
  possession: w.possession,
  units: w.units,
  land: w.land,
  highlights: (w.highlights || []).join('\n'),
  amenities: (w.amenities || []).join('\n'),
  address: w.address,
  mapUrl: w.mapUrl,
  reraUrl: w.reraUrl,
  contact: w.contact,
});
const fromForm = (f) => ({
  status: f.status,
  tagline: f.tagline.trim(),
  about: f.about.trim(),
  configs: f.configs,
  startingPrice: f.priceLakh.trim() ? Math.round(Number(f.priceLakh) * 1e5) : null,
  possession: f.possession.trim(),
  units: f.units.trim(),
  land: f.land.trim(),
  highlights: lines(f.highlights),
  amenities: lines(f.amenities),
  address: f.address.trim(),
  mapUrl: f.mapUrl.trim(),
  reraUrl: f.reraUrl.trim(),
  contact: f.contact,
});

/** Shrink a photo in the browser (max 1920 px, WebP) so the database stays small and pages load fast. */
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  for (const [max, q] of [
    [1920, 0.82],
    [1600, 0.72],
    [1280, 0.65],
  ]) {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/webp', q);
    const type = url.startsWith('data:image/webp') ? url : c.toDataURL('image/jpeg', q); // older Safari: no WebP
    if (type.length * 0.75 < 1.3 * 1024 * 1024) return type;
  }
  throw new Error('This photo is too large even after shrinking. Please choose a smaller one.');
}

function Section({ title, hint, children }) {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

/** Owner / co-owner: everything the website shows for one project the owner added. */
export default function ProjectWebsitePage() {
  const { id } = useParams();
  const projects = useCrmStore((s) => s.projects);
  const reloadProjects = useCrmStore((s) => s.reloadProjects);
  const saveWeb = useCrmStore((s) => s.saveProjectWeb);
  const addPhoto = useCrmStore((s) => s.addProjectPhoto);
  const removePhoto = useCrmStore((s) => s.removeProjectPhoto);
  const toast = useUiStore((s) => s.showToast);
  const p = projects.find((x) => x.id === id);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState('');
  const [undo, setUndo] = useState(null); // true = just shown on the website, false = just hidden
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    reloadProjects();
  }, [reloadProjects]);
  useEffect(() => {
    if (p?.web && !f) setF(toForm(p.web));
  }, [p, f]);
  useEffect(() => {
    if (p) document.title = `${p.name} · website | Sai Krishna Homes`;
  }, [p]);

  const dirty = useMemo(
    () => p?.web && f && JSON.stringify(fromForm(f)) !== JSON.stringify(fromForm(toForm(p.web))),
    [p, f],
  );
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!p || !f)
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="p-10 text-center text-slate-500">
          {projects.length && !p ? 'Project not found.' : 'Loading…'}
        </Card>
      </div>
    );
  if (p.builtIn)
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="p-10 text-center text-slate-600">
          {p.name} is one of the website’s own projects and is locked.
        </Card>
      </div>
    );

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const toggleType = (t) =>
    setF((v) => ({
      ...v,
      configs: v.configs.includes(t)
        ? v.configs.filter((x) => x !== t)
        : HOME_TYPES.filter((x) => x === t || v.configs.includes(x)),
    }));
  const web = p.web;
  const live = web.published;
  const priceOk = !f.priceLakh.trim() || (Number(f.priceLakh) > 0 && Number(f.priceLakh) < 100000);

  const save = async (extra = {}) => {
    if (!priceOk) return toast('Starting price: enter it in lakh, e.g. 55 for ₹55 L.', 'error');
    setBusy(extra.published === undefined ? 'save' : 'publish');
    const res = await saveWeb(p.id, { ...fromForm(f), ...extra });
    setBusy('');
    if (!res) return undefined;
    setF(toForm(res.web));
    if (extra.published === undefined) toast('Saved');
    else setUndo(extra.published); // shows the "Undo" bar
    return undefined;
  };
  /** Pressed Show / Hide by mistake: switch it straight back (only the on/off, nothing else). */
  const undoLast = async () => {
    const back = !undo;
    setBusy('publish');
    const res = await saveWeb(p.id, { published: back });
    setBusy('');
    if (!res) return;
    setUndo(null);
    toast(
      back
        ? `Undone: ${p.name} is back on the website`
        : `Undone: ${p.name} is off the website again`,
    );
  };

  const upload = async (files) => {
    const list = [...files].slice(0, 12 - web.photos.length);
    if (!list.length) return toast('Up to 12 photos per project.', 'error');
    setUploading(list.length);
    for (const file of list) {
      try {
        const data = await shrink(file);
        await addPhoto(
          p.id,
          data,
          file.name
            .replace(/\.[a-z0-9]+$/i, '')
            .replace(/[-_]+/g, ' ')
            .slice(0, 80),
        );
      } catch (e) {
        toast(e.message || 'Could not add this photo.', 'error');
      }
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = '';
    return undefined;
  };
  const movePhoto = async (i, d) => {
    const ph = [...web.photos];
    [ph[i], ph[i + d]] = [ph[i + d], ph[i]];
    await saveWeb(p.id, { photos: ph.map(({ id: pid, alt }) => ({ id: pid, alt })) });
  };
  const captionPhoto = async (i, alt) => {
    if (alt === (web.photos[i].alt || '')) return;
    const ph = web.photos.map((x, j) => ({
      id: x.id,
      alt: j === i ? alt.slice(0, 120) : x.alt || '',
    }));
    await saveWeb(p.id, { photos: ph });
  };

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold">{p.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            What the website shows for this project.{' '}
            {live ? (
              <span className="font-semibold text-emerald-700">● On the website</span>
            ) : (
              <span className="font-semibold text-slate-600">○ Not on the website yet</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/projects/${p.slug}${live ? '' : '?preview=1'}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:border-navy-900"
          >
            <ExternalLink className="h-4 w-4" /> {live ? 'View on website' : 'Preview'}
          </a>
          {live ? (
            <Btn variant="outline" onClick={() => save({ published: false })} disabled={!!busy}>
              <EyeOff className="h-4 w-4" /> Hide from website
            </Btn>
          ) : (
            <Btn variant="success" onClick={() => save({ published: true })} disabled={!!busy}>
              <Globe className="h-4 w-4" /> {busy === 'publish' ? 'Publishing…' : 'Show on website'}
            </Btn>
          )}
        </div>
      </div>

      {undo !== null && (
        <div
          role="status"
          className={cn(
            'mt-4 flex flex-col gap-2 rounded-xl p-3 text-sm sm:flex-row sm:items-center sm:justify-between',
            undo ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-800',
          )}
        >
          <span className="flex items-center gap-2 font-semibold">
            {undo ? <Globe className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {undo
              ? `${p.name} is now on the website.`
              : `${p.name} is now hidden from the website.`}
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={undoLast}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-navy-900 ring-1 ring-inset ring-slate-300 hover:ring-navy-900 disabled:opacity-60"
            >
              <Undo2 className="h-4 w-4" /> Undo
            </button>
            <button
              type="button"
              onClick={() => setUndo(null)}
              aria-label="Close"
              className="rounded-lg px-2 text-slate-500 hover:text-navy-900"
            >
              ✕
            </button>
          </span>
        </div>
      )}
      {!live && p.missing?.length > 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <b>Before it can go on the website, add:</b> {p.missing.join(', ')}. Fill them in, then
          press Show on website.
        </p>
      )}

      <div className="mt-6 space-y-4">
        <Section
          title="Photos"
          hint={`The first photo is the cover (top of the page, project cards and menu). Up to 12. ${web.photos.length} added.`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {web.photos.map((ph, i) => (
              <div
                key={ph.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <img
                    src={`/api/public/photos/${ph.id}`}
                    alt={ph.alt}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary-400 px-2 py-0.5 text-[11px] font-bold text-navy-950">
                      <Star className="h-3 w-3" /> Cover
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-2">
                  <input
                    className={cn(fieldCls, 'py-1.5 text-sm')}
                    defaultValue={ph.alt}
                    placeholder="Caption, e.g. Front view"
                    aria-label="Photo caption"
                    onBlur={(e) => captionPhoto(i, e.target.value.trim())}
                  />
                  <div className="flex items-center justify-between">
                    <span className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => movePhoto(i, -1)}
                        aria-label="Move left"
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={i === web.photos.length - 1}
                        onClick={() => movePhoto(i, 1)}
                        aria-label="Move right"
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        window.confirm('Remove this photo?') && removePhoto(p.id, ph.id)
                      }
                      aria-label="Remove photo"
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {web.photos.length < 12 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading > 0}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-600 hover:border-navy-900 hover:text-navy-900"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" /> Adding {uploading}…
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" /> Add photos
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => upload(e.target.files)}
          />
        </Section>

        <Section title="About the project">
          <Field label="Status">
            <select className={fieldCls} value={f.status} onChange={set('status')}>
              {STATUS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tagline (one line under the name)">
            <input
              className={fieldCls}
              value={f.tagline}
              onChange={set('tagline')}
              maxLength={140}
              placeholder="e.g. Green living near Khandagiri"
            />
          </Field>
          <Field label="Description (leave an empty line between paragraphs)" required>
            <textarea
              className={cn(fieldCls, 'min-h-[10rem]')}
              value={f.about}
              onChange={set('about')}
              maxLength={4000}
              placeholder="What makes this project special: location, homes, lifestyle…"
            />
          </Field>
          <Field label="Highlights (one per line)">
            <textarea
              className={cn(fieldCls, 'min-h-[7rem]')}
              value={f.highlights}
              onChange={set('highlights')}
              placeholder={
                'RERA approved\nApproved by all major banks\n5 minutes from the ring road'
              }
            />
          </Field>
        </Section>

        <Section title="Homes & price">
          <Field label="Home types" required>
            <div className="flex flex-wrap gap-2">
              {HOME_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  aria-pressed={f.configs.includes(t)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset',
                    f.configs.includes(t)
                      ? 'bg-navy-900 text-white ring-navy-900'
                      : 'bg-white text-navy-900 ring-slate-200 hover:ring-navy-900',
                  )}
                >
                  {f.configs.includes(t) && <Check className="mr-1 inline h-3.5 w-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starting price, in lakh (optional)">
              <input
                className={cn(fieldCls, !priceOk && 'border-rose-400')}
                value={f.priceLakh}
                onChange={(e) =>
                  setF((v) => ({ ...v, priceLakh: e.target.value.replace(/[^\d.]/g, '') }))
                }
                inputMode="decimal"
                placeholder="e.g. 55 for ₹55 L"
              />
            </Field>
            <Field label="Possession (optional)">
              <input
                className={fieldCls}
                value={f.possession}
                onChange={set('possession')}
                maxLength={40}
                placeholder="e.g. Dec 2028"
              />
            </Field>
            <Field label="Total homes (optional)">
              <input
                className={fieldCls}
                value={f.units}
                onChange={set('units')}
                maxLength={30}
                placeholder="e.g. 240"
              />
            </Field>
            <Field label="Land area (optional)">
              <input
                className={fieldCls}
                value={f.land}
                onChange={set('land')}
                maxLength={40}
                placeholder="e.g. 3 acres"
              />
            </Field>
          </div>
        </Section>

        <Section title="Amenities" hint="One per line. Shown as a grid on the project page.">
          <textarea
            className={cn(fieldCls, 'min-h-[8rem]')}
            value={f.amenities}
            onChange={set('amenities')}
            aria-label="Amenities"
            placeholder={'Gym\nSwimming pool\nChildren’s play area\n24×7 security'}
          />
        </Section>

        <Section title="Location & links">
          <Field label="Full address (optional)">
            <input
              className={fieldCls}
              value={f.address}
              onChange={set('address')}
              maxLength={240}
              placeholder={`${p.location || 'Area'}, Bhubaneswar, Odisha`}
            />
          </Field>
          <Field label="Google Maps link (optional)">
            <input
              className={fieldCls}
              value={f.mapUrl}
              onChange={set('mapUrl')}
              placeholder="https://maps.app.goo.gl/…"
            />
          </Field>
          <Field label="RERA page link (optional)">
            <input
              className={fieldCls}
              value={f.reraUrl}
              onChange={set('reraUrl')}
              placeholder={COMPANY.reraVerifyUrl}
            />
          </Field>
          <Field label="Contact person on the page">
            <select className={fieldCls} value={f.contact} onChange={set('contact')}>
              {LEADERSHIP.contacts.map((c, i) => (
                <option key={c.name} value={i === 0 ? 'cmo' : 'gm'}>
                  {c.name} · {c.role}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-slate-500">
            Name, location and RERA number are changed from the Projects list (Edit).
          </p>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-xs text-slate-500">
            {dirty ? 'You have unsaved changes.' : `Last change ${fmtDateTime(p.updatedAt)}`}
          </span>
          <Btn onClick={() => save()} disabled={!dirty || !!busy}>
            <Check className="h-4 w-4" /> {busy === 'save' ? 'Saving…' : 'Save'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
