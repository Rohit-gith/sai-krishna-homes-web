import { useEffect, useState } from 'react';
import { Trophy, XCircle } from 'lucide-react';
import { Modal, Field, Btn, fieldCls } from './ui';
import { LOST_REASONS } from '../constants';
import { useCrmStore } from '../store/useCrmStore';
import { useUiStore } from '@/store/useUiStore';
import { inr } from '../utils';
import { cn } from '@/utils/cn';

/** Close a deal as Won (final value + unit) or Lost (reason). Confirming "commits" and locks it. */
export default function CommitDealModal({ open, onClose, lead, initialResult = 'won' }) {
  const commit = useCrmStore((s) => s.commitDeal);
  const toast = useUiStore((s) => s.showToast);
  const [result, setResult] = useState(initialResult);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || !lead) return;
    setResult(initialResult);
    setValue(lead.dealValue || lead.budget || '');
    setUnit('');
    setReason(LOST_REASONS[0]);
    setNote('');
    setConfirm(false);
    setErr('');
  }, [open, lead, initialResult]);

  if (!lead) return null;

  const submit = (e) => {
    e.preventDefault();
    if (result === 'won' && !(Number(value) > 0)) return setErr('Enter the final deal value');
    if (!confirm) return setErr('Tick the box to confirm. A committed deal is locked.');
    commit(lead.id, result === 'won' ? { result, value: Number(value), unit, note } : { result, reason, note });
    toast(result === 'won' ? `${lead.id} committed as WON · ${inr(value)}` : `${lead.id} committed as LOST`);
    onClose();
    return undefined;
  };

  return (
    <Modal open={open} onClose={onClose} title={`Close deal · ${lead.id}`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            ['won', 'Won', Trophy, 'border-emerald-500 bg-emerald-50 text-emerald-800'],
            ['lost', 'Lost', XCircle, 'border-rose-500 bg-rose-50 text-rose-800'],
          ].map(([id, label, Icon, on]) => (
            <button
              key={id}
              type="button"
              onClick={() => setResult(id)}
              aria-pressed={result === id}
              className={cn('flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold', result === id ? on : 'border-slate-200 text-slate-600')}
            >
              <Icon className="h-5 w-5" /> {label}
            </button>
          ))}
        </div>

        {result === 'won' ? (
          <>
            <Field label="Final deal value (₹)" required>
              <input className={fieldCls} value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
              {Number(value) > 0 && <span className="mt-1 block text-xs text-slate-500">{inr(value)}</span>}
            </Field>
            <Field label="Unit / flat">
              <input className={fieldCls} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Tower B · 304" />
            </Field>
          </>
        ) : (
          <Field label="Reason lost" required>
            <select className={fieldCls} value={reason} onChange={(e) => setReason(e.target.value)}>
              {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
        )}
        <Field label="Note">
          <textarea className={fieldCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-navy-900">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
          I confirm this deal is {result === 'won' ? 'won' : 'lost'}. Committing locks the lead (it can be reopened later).
        </label>
        {err && <p className="text-sm font-medium text-rose-600">{err}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant={result === 'won' ? 'success' : 'danger'}>Commit as {result === 'won' ? 'Won' : 'Lost'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
