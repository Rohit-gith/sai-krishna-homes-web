import { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { Btn, Field, Modal, fieldCls } from './ui';
import { CONFIGS } from '../constants';
import { useProjectNames } from '../store/useCrmStore';
import { SATISFACTION, VISIT_OUTCOME, VISIT_OUTCOMES, satisfactionOf } from '../visits';
import { useCrmStore } from '../store/useCrmStore';
import { api } from '@/services/crmApi';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

/** ★★★★☆ (read-only) */
export function Stars({ rating, className }) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-4 w-4',
            n <= rating ? 'fill-primary-400 text-primary-500' : 'text-slate-300',
          )}
        />
      ))}
    </span>
  );
}

/** Tap a star to rate 1-5. */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ['', 'Very unhappy', 'Unhappy', 'Okay', 'Happy', 'Very happy'];
  return (
    <div>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Customer rating"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="rounded-lg p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-8 w-8',
                n <= shown ? 'fill-primary-400 text-primary-500' : 'text-slate-300',
              )}
            />
          </button>
        ))}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {shown ? (
          <>
            {words[shown]} · <SatisfactionBadge rating={shown} />
          </>
        ) : (
          'Tap a star'
        )}
      </p>
    </div>
  );
}

export function SatisfactionBadge({ rating }) {
  const s = SATISFACTION[satisfactionOf(rating)];
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        s.tone,
      )}
    >
      {s.label}
    </span>
  );
}

export function OutcomeTag({ outcome }) {
  const o = VISIT_OUTCOME[outcome];
  if (!o) return null;
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        o.tone,
      )}
    >
      {o.label}
    </span>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const localInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const EMPTY = {
  at: '',
  customerName: '',
  phone: '',
  project: '',
  config: '',
  people: '1',
  rating: 0,
  feedback: '',
  outcome: 'thinking',
  guideEmail: '',
  note: '',
};

/** Record a new visit, or edit one (visit given). guides = who it can be recorded for (owner only). */
export function VisitFormModal({ open, onClose, visit, guides = [], me, onSaved }) {
  const projectNames = useProjectNames();
  const leads = useCrmStore((s) => s.leads);
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr('');
    setF(
      visit
        ? {
            ...EMPTY,
            ...visit,
            at: localInput(new Date(visit.at)),
            people: String(visit.people || 1),
            guideEmail: visit.guide?.email || '',
          }
        : { ...EMPTY, at: localInput(new Date()), guideEmail: me?.email || '' },
    );
  }, [open, visit, me]);

  // typing the full mobile of an existing lead fills in the name and project (asked from the server,
  // so it works for site-visit executives who can't see the lead list)
  const [found, setFound] = useState(null); // { lead, previousVisits } for the typed number
  useEffect(() => {
    setFound(null);
    if (visit || !/^[6-9]\d{9}$/.test(f.phone)) return undefined;
    let live = true;
    const local = leads.find((l) => l.phone === f.phone);
    const apply = (res) => {
      if (!live) return;
      setFound(res);
      const lead = res.lead;
      if (lead)
        setF((v) => ({
          ...v,
          customerName: v.customerName || lead.name,
          project: v.project || lead.project || '',
          config: v.config || (CONFIGS.includes(lead.config) ? lead.config : ''),
        }));
    };
    api(`/visits/lookup?phone=${f.phone}`).then(
      apply,
      () => local && apply({ lead: local, previousVisits: 0 }),
    );
    return () => {
      live = false;
    };
  }, [f.phone, visit, leads]);
  const lead = found?.lead;

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (f.customerName.trim().length < 2) return setErr('Enter the customer’s name.');
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setErr('Enter a valid 10-digit mobile number.');
    if (!f.rating) return setErr('Give a rating: how happy was the customer?');
    if (new Date(f.at) > new Date()) return setErr('The visit time cannot be in the future.');
    setErr('');
    setBusy(true);
    const body = {
      at: new Date(f.at).toISOString(),
      customerName: f.customerName.trim(),
      phone: f.phone,
      project: f.project,
      config: f.config,
      people: Number(f.people) || 1,
      rating: f.rating,
      feedback: f.feedback.trim(),
      outcome: f.outcome,
    };
    try {
      const saved = visit
        ? await api(`/visits/${visit.id}`, {
            method: 'PATCH',
            body: { ...body, note: f.note.trim() },
          })
        : await api('/visits', {
            method: 'POST',
            body: {
              ...body,
              ...(f.guideEmail && f.guideEmail !== me?.email ? { guideEmail: f.guideEmail } : {}),
            },
          });
      toast(
        visit
          ? `${saved.id} updated`
          : `Visit ${saved.id} recorded${saved.leadId ? ` · linked to ${saved.leadId}` : ''}`,
      );
      onSaved?.(saved);
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={visit ? `Edit visit ${visit.id}` : 'Record a site visit'}
      wide
    >
      <form onSubmit={save} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer mobile" required>
            <input
              className={fieldCls}
              value={f.phone}
              inputMode="numeric"
              autoFocus={!visit}
              onChange={(e) =>
                setF((v) => ({ ...v, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
              }
              placeholder="10-digit mobile"
            />
            {lead && (
              <span className="mt-1 block text-xs font-semibold text-emerald-700">
                Already a lead: {lead.id} · {lead.name}
              </span>
            )}
            {found?.previousVisits > 0 && (
              <span className="mt-0.5 block text-xs font-semibold text-amber-700">
                Visited before ({found.previousVisits} time{found.previousVisits > 1 ? 's' : ''})
              </span>
            )}
          </Field>
          <Field label="Customer name" required>
            <input className={fieldCls} value={f.customerName} onChange={set('customerName')} />
          </Field>
          <Field label="Project">
            <select className={fieldCls} value={f.project} onChange={set('project')}>
              <option value="">—</option>
              {projectNames.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Looking for">
              <select className={fieldCls} value={f.config} onChange={set('config')}>
                <option value="">—</option>
                {CONFIGS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="People came">
              <input
                className={fieldCls}
                type="number"
                min="1"
                max="50"
                value={f.people}
                onChange={set('people')}
              />
            </Field>
          </div>
          <Field label="Visit date & time" required>
            <input
              className={fieldCls}
              type="datetime-local"
              value={f.at}
              max={localInput(new Date())}
              onChange={set('at')}
            />
          </Field>
          {!visit && guides.length > 1 ? (
            <Field label="Shown around by">
              <select className={fieldCls} value={f.guideEmail} onChange={set('guideEmail')}>
                {guides.map((g) => (
                  <option key={g.email} value={g.email}>
                    {g.name}
                    {g.email === me?.email ? ' (me)' : ''}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Shown around by">
              <input
                className={cn(fieldCls, 'bg-slate-50 text-slate-500')}
                value={visit?.guide?.name || me?.name || ''}
                disabled
              />
            </Field>
          )}
        </div>

        <Field label="How happy was the customer?" required>
          <StarInput value={f.rating} onChange={(rating) => setF((v) => ({ ...v, rating }))} />
        </Field>

        <Field label="Customer feedback">
          <textarea
            className={fieldCls}
            rows={3}
            value={f.feedback}
            onChange={set('feedback')}
            placeholder="What did they like or not like? Any questions?"
          />
        </Field>

        <Field label="Outcome">
          <div className="flex flex-wrap gap-2">
            {VISIT_OUTCOMES.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setF((v) => ({ ...v, outcome: o.id }))}
                aria-pressed={f.outcome === o.id}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm font-semibold',
                  f.outcome === o.id
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-slate-200 hover:border-primary-400',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        {visit && (
          <Field label="Reason for the change (optional, saved in the history)">
            <input className={fieldCls} value={f.note} onChange={set('note')} />
          </Field>
        )}

        {err && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {err}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit" disabled={busy}>
            <Check className="h-4 w-4" /> {busy ? 'Saving…' : visit ? 'Save changes' : 'Save visit'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
