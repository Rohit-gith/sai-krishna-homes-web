import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { STATUSES, ATTEMPT_TYPES, ATTEMPT_OUTCOMES } from '@/features/admin/constants';
import {
  Btn,
  Card,
  Field,
  OutcomeBadge,
  StatusBadge,
  fieldCls,
} from '@/features/admin/components/ui';
import LeadFormModal from '@/features/admin/components/LeadFormModal';
import CommitDealModal from '@/features/admin/components/CommitDealModal';
import { fmtDate, fmtDateTime, inr, inrShort } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';
import { useCan } from '@/features/admin/access';
import { api } from '@/services/crmApi';
import { OutcomeTag, SatisfactionBadge, Stars } from '@/features/admin/components/visitUi';

const OPEN = STATUSES.filter((s) => !['won', 'lost'].includes(s.id));

function Pipeline({ lead, editable }) {
  const setStatus = useCrmStore((s) => s.setStatus);
  const idx = OPEN.findIndex((s) => s.id === lead.status);
  const closed = !!lead.closed;
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {OPEN.map((s, i) => {
        const done = closed || i <= idx;
        return (
          <li key={s.id}>
            <button
              type="button"
              disabled={closed || !editable}
              onClick={() => setStatus([lead.id], s.id)}
              aria-current={lead.status === s.id ? 'step' : undefined}
              className="group block w-full text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  'block h-2 rounded-full transition-colors',
                  done ? s.bar : 'bg-slate-200 group-hover:bg-slate-300',
                )}
              />
              <span
                className={cn(
                  'mt-2 block truncate text-[11px] font-semibold sm:text-xs',
                  lead.status === s.id ? 'text-navy-950' : 'text-slate-500',
                )}
              >
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function AttemptForm({ lead }) {
  const addAttempt = useCrmStore((s) => s.addAttempt);
  const toast = useUiStore((s) => s.showToast);
  const [type, setType] = useState('Call');
  const [outcome, setOutcome] = useState('connected');
  const [note, setNote] = useState('');
  const [next, setNext] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await addAttempt(lead.id, {
      type,
      outcome,
      note: note.trim(),
      nextFollowUp: next ? new Date(`${next}T10:00:00`).toISOString() : null,
    });
    if (!ok) return;
    toast('Attempt logged');
    setNote('');
    setNext('');
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Type">
        <select className={fieldCls} value={type} onChange={(e) => setType(e.target.value)}>
          {ATTEMPT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Outcome">
        <select className={fieldCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          {ATTEMPT_OUTCOMES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note" className="sm:col-span-2">
        <input
          className={fieldCls}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was discussed?"
        />
      </Field>
      <Field label="Next follow-up">
        <input
          className={fieldCls}
          type="date"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <div className="flex items-end">
        <Btn type="submit" className="w-full">
          <Check className="h-4 w-4" /> Log attempt
        </Btn>
      </div>
    </form>
  );
}

/** Site visits linked to this lead (same mobile number). */
function LeadVisits({ lead }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    api(`/visits?leadId=${lead.id}`).then(setList, () => setList([]));
  }, [lead.id, lead.updatedAt]);
  if (!list || !list.length) return null;
  return (
    <Card className="mt-4 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">
        Site visits <span className="text-slate-400">({list.length})</span>
      </h2>
      <ul className="mt-4 space-y-3">
        {list.map((v) => (
          <li key={v.id} className="rounded-xl border border-slate-100 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Stars rating={v.rating} />
              <SatisfactionBadge rating={v.rating} />
              <OutcomeTag outcome={v.outcome} />
              <span className="ml-auto text-xs text-slate-400">{fmtDateTime(v.at)}</span>
            </div>
            {v.feedback && <p className="mt-1.5 text-slate-700">“{v.feedback}”</p>}
            <p className="mt-1 text-xs text-slate-400">
              {v.id} · shown by {v.guide?.name} · {v.people || 1}{' '}
              {v.people > 1 ? 'people' : 'person'}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Owner / anyone with "Assign leads": pick who this lead belongs to. */
function AssignControl({ lead }) {
  const assignees = useCrmStore((s) => s.assignees);
  const loadAssignees = useCrmStore((s) => s.loadAssignees);
  const assignLeads = useCrmStore((s) => s.assignLeads);
  const toast = useUiStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!assignees.length) loadAssignees();
  }, [assignees.length, loadAssignees]);
  const value = lead.assignedTo?.email || '';
  const options =
    assignees.some((a) => a.email === value) || !value
      ? assignees
      : [...assignees, lead.assignedTo];
  return (
    <select
      className={cn(fieldCls, 'py-1.5 text-sm')}
      value={value}
      disabled={busy}
      aria-label="Assigned to"
      onChange={async (e) => {
        setBusy(true);
        const n = await assignLeads([lead.id], e.target.value || null);
        setBusy(false);
        if (n != null)
          toast(
            e.target.value
              ? `Assigned to ${assignees.find((a) => a.email === e.target.value)?.name}`
              : 'Unassigned',
          );
      }}
    >
      <option value="">Not assigned</option>
      {options.map((a) => (
        <option key={a.email} value={a.email}>
          {a.name}
        </option>
      ))}
    </select>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const allowed = useCan();
  const lead = useCrmStore((s) => s.leads.find((l) => l.id === id));
  const reopen = useCrmStore((s) => s.reopenDeal);
  const deleteLeads = useCrmStore((s) => s.deleteLeads);
  const toast = useUiStore((s) => s.showToast);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(null);

  if (!lead) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-lg font-semibold">Lead {id} not found.</p>
        <Link
          to="/admin/leads"
          className="mt-4 inline-block font-semibold text-primary-700 hover:underline"
        >
          Back to leads
        </Link>
      </div>
    );
  }

  const wa = `https://wa.me/91${lead.phone}?text=${encodeURIComponent(`Hello ${lead.name.replace(/^Sample:\s*/, '')}, this is Sai Krishna Homes.`)}`;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-950"
      >
        <ArrowLeft className="h-4 w-4" /> All leads
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-200/70 px-2 py-0.5 font-mono text-xs font-semibold">
              {lead.id}
            </span>
            <StatusBadge status={lead.status} />
            {lead.demo && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                Sample
              </span>
            )}
            {lead.duplicateNote && (
              <span
                className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"
                title={`Same mobile number as ${lead.duplicateNote}`}
              >
                Possible duplicate
              </span>
            )}
            {lead.valueCheck && (
              <span
                className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200"
                title={(lead.valueCheck.reasons || []).join(' ')}
              >
                Value checked: {inrShort(lead.valueCheck.value)}
                {lead.valueCheck.confirmedBy?.name ? ` by ${lead.valueCheck.confirmedBy.name}` : ''}
              </span>
            )}
          </div>
          {lead.duplicateNote && (
            <p className="mt-2 text-xs text-amber-800">
              Same mobile number as {lead.duplicateNote}.{' '}
              {(lead.duplicateOf || []).map((id) => (
                <Link key={id} to={`/admin/leads/${id}`} className="mr-2 font-semibold underline">
                  Open {id}
                </Link>
              ))}
            </p>
          )}
          <h1 className="mt-2 break-words font-display text-3xl font-bold">{lead.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {lead.source} · created {fmtDate(lead.createdAt)} · updated{' '}
            {fmtDateTime(lead.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:+91${lead.phone}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:border-primary-500"
          >
            <Phone className="h-4 w-4" /> Call
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:border-primary-500"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
          </a>
          {allowed('leads.edit') && (
            <Btn variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Btn>
          )}
        </div>
      </div>

      {/* Pipeline + close */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="mb-3 text-sm font-semibold text-slate-500">
              Pipeline{' '}
              {lead.closed
                ? '(locked: deal committed)'
                : allowed('leads.edit')
                  ? '(tap a stage to move)'
                  : ''}
            </p>
            <Pipeline lead={lead} editable={allowed('leads.edit')} />
          </div>
          {!lead.closed ? (
            allowed('deals.close') && (
              <div className="grid grid-cols-2 gap-2 lg:w-72">
                <Btn variant="success" onClick={() => setClosing('won')}>
                  <Trophy className="h-4 w-4" /> Mark won
                </Btn>
                <Btn variant="danger" onClick={() => setClosing('lost')}>
                  <XCircle className="h-4 w-4" /> Mark lost
                </Btn>
              </div>
            )
          ) : (
            <div
              className={cn(
                'rounded-2xl p-4 lg:w-80',
                lead.closed.result === 'won'
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'bg-rose-50 text-rose-900',
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wide">
                {lead.closed.result === 'won' ? 'Won · committed' : 'Lost · committed'}{' '}
                {fmtDate(lead.closed.at)}
              </p>
              <p className="mt-1 text-xl font-bold">
                {lead.closed.result === 'won' ? inr(lead.closed.value) : lead.closed.reason}
              </p>
              {lead.closed.unit && <p className="text-sm">{lead.closed.unit}</p>}
              {lead.closed.note && <p className="mt-1 text-sm opacity-80">{lead.closed.note}</p>}
              {lead.closed.by && <p className="mt-1 text-xs opacity-70">by {lead.closed.by}</p>}
              {allowed('deals.close') && (
                <button
                  type="button"
                  onClick={() =>
                    window.confirm('Reopen this deal? It moves back to Negotiation.') &&
                    reopen(lead.id)
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reopen deal
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Details */}
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Details</h2>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            {[
              ['Phone', `+91 ${lead.phone}`],
              ['Email', lead.email || '—'],
              ['Project', lead.project || '—'],
              ['Configuration', lead.config || '—'],
              ['Budget', lead.budget ? inrShort(lead.budget) : '—'],
              ...(lead.priceMax
                ? [['Price range', `${inrShort(lead.priceMin)} – ${inrShort(lead.priceMax)}`]]
                : []),
              [
                'Deal value',
                lead.closed?.value || lead.dealValue
                  ? inr(lead.closed?.value || lead.dealValue)
                  : '—',
              ],
              ['Next follow-up', lead.closed ? '—' : fmtDate(lead.nextFollowUp)],
              [
                'Created by',
                lead.createdBy
                  ? `${lead.createdBy.name} · ${fmtDate(lead.createdBy.at || lead.createdAt)}`
                  : lead.source === 'Website'
                    ? 'Website form'
                    : '—',
              ],
              ...(allowed('leads.assign')
                ? []
                : [['Assigned to', lead.assignedTo?.name || 'Not assigned']]),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-all text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {allowed('leads.assign') && (
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">Assigned to</span>
              <span className="w-56">
                <AssignControl lead={lead} />
              </span>
            </div>
          )}
          {lead.notes && (
            <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {lead.notes}
            </p>
          )}
          {allowed('leads.delete') && (
            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    `Delete ${lead.id}? It goes to the recycle bin and the owner can restore it.`,
                  )
                )
                  return;
                if ((await deleteLeads([lead.id])) == null) return;
                toast(`${lead.id} moved to the recycle bin`);
                navigate('/admin/leads', { replace: true });
              }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
            >
              <Trash2 className="h-4 w-4" /> Delete lead
            </button>
          )}
        </Card>

        {/* Attempts */}
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">
            Attempts <span className="text-slate-400">({lead.attempts.length})</span>
          </h2>
          {!lead.closed && allowed('attempts.log') && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <AttemptForm lead={lead} />
            </div>
          )}
          <ol className="mt-5 space-y-3">
            {lead.attempts.map((a, i) => (
              <li key={a.id} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                  {lead.attempts.length - i}
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{a.type}</span>
                    <OutcomeBadge outcome={a.outcome} />
                    <span className="ml-auto text-xs text-slate-400">{fmtDateTime(a.at)}</span>
                  </div>
                  {a.note && <p className="mt-1.5 text-sm text-slate-600">{a.note}</p>}
                  {a.by && <p className="mt-1 text-xs text-slate-400">by {a.by}</p>}
                </div>
              </li>
            ))}
            {lead.attempts.length === 0 && (
              <p className="text-sm text-slate-500">No attempts yet. Log the first call above.</p>
            )}
          </ol>
        </Card>
      </div>

      {(allowed('visits.view_all') || allowed('visits.log')) && <LeadVisits lead={lead} />}

      {/* History */}
      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">History</h2>
        <ol className="mt-4 space-y-2.5 border-l-2 border-slate-100 pl-4">
          {lead.history.map((h) => (
            <li key={h.id} className="relative text-sm">
              <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400" />
              <span className="text-navy-950">{h.text}</span>
              <span className="ml-2 text-xs text-slate-400">{fmtDateTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </Card>

      <LeadFormModal open={editing} lead={lead} onClose={() => setEditing(false)} />
      <CommitDealModal
        open={!!closing}
        lead={lead}
        initialResult={closing || 'won'}
        onClose={() => setClosing(null)}
      />
    </div>
  );
}
