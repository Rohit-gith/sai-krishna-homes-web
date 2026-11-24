import { useEffect, useState } from 'react';
import { Modal, Field, Btn, fieldCls } from './ui';
import { CONFIGS, SOURCES } from '../constants';
import { useProjectNames } from '../store/useCrmStore';
import { useCrmStore } from '../store/useCrmStore';
import { useUiStore } from '@/store/useUiStore';
import { api } from '@/services/crmApi';
import { lakhCrore } from '../utils';
import { DuplicateNotice, ValueNotice } from './leadChecks';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  project: '',
  config: '',
  source: 'Walk-in',
  budget: '',
  dealValue: '',
  nextFollowUp: '',
  notes: '',
};

/** "₹65 lakh" under a money field, so a missing or extra zero is easy to see. */
const Size = ({ value }) =>
  Number(value) > 0 ? (
    <span className="mt-1 block text-xs font-medium text-slate-500">{lakhCrore(value)}</span>
  ) : null;

/** Add a new lead, or edit an existing one (pass `lead`). */
export default function LeadFormModal({ open, onClose, lead, initial, onSaved }) {
  const projectNames = useProjectNames();
  const addLead = useCrmStore((s) => s.addLead);
  const updateLead = useCrmStore((s) => s.updateLead);
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [dups, setDups] = useState([]); // other leads with this mobile number
  const [anyway, setAnyway] = useState(false); // "add it anyway"
  const [valueProblem, setValueProblem] = useState(null);
  const [valueOk, setValueOk] = useState(false); // "yes, this value is correct"

  useEffect(() => {
    if (!open) return;
    setErr({});
    setDups([]);
    setAnyway(false);
    setValueProblem(null);
    setValueOk(false);
    setF(
      lead
        ? {
            ...EMPTY,
            ...lead,
            budget: lead.budget || '',
            dealValue: lead.dealValue || '',
            nextFollowUp: lead.nextFollowUp?.slice(0, 10) || '',
          }
        : { ...EMPTY, ...initial },
    );
  }, [open, lead, initial]);

  // as soon as a full mobile number is typed: is it already a lead? (its own number never counts)
  useEffect(() => {
    if (!open) return undefined;
    const phone = f.phone.trim();
    if (
      !/^[6-9]\d{9}$/.test(phone) ||
      (lead && phone === String(lead.phone).replace(/\D/g, '').slice(-10))
    ) {
      setDups([]);
      return undefined;
    }
    let live = true;
    const t = setTimeout(() => {
      const q = `phone=${phone}${lead ? `&exclude=${lead.id}` : ''}`;
      api(`/leads/check-phone?${q}`)
        .then((r) => live && (setDups(r.duplicates || []), setAnyway(false)))
        .catch(() => {}); // the server checks again on save
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [open, f.phone, lead]);

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const setMoney = (k) => (e) => {
    setF((v) => ({ ...v, [k]: e.target.value.replace(/\D/g, '') }));
    if (k === 'dealValue') {
      setValueProblem(null); // a new value is checked again on save
      setValueOk(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter the customer name';
    if (!/^[6-9]\d{9}$/.test(f.phone.trim())) er.phone = 'Enter a valid 10-digit mobile number';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (dups.length && !anyway)
      er.phone = 'Already a lead. Tick “Add it anyway” below, or change the number.';
    if (valueProblem && !(valueProblem.canConfirm && valueOk))
      er.value = 'Check the deal value below.';
    setErr(er);
    if (Object.keys(er).length) return;

    const data = {
      ...f,
      nextFollowUp: f.nextFollowUp ? new Date(`${f.nextFollowUp}T10:00:00`).toISOString() : null,
    };
    const flags = {
      ...(dups.length && anyway ? { allowDuplicate: true } : {}),
      ...(valueProblem && valueOk ? { confirmValue: true } : {}),
    };
    setBusy(true);
    let res;
    if (lead) {
      res = await updateLead(lead.id, {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        project: data.project,
        config: data.config,
        source: data.source,
        budget: Number(data.budget) || 0,
        dealValue: Number(data.dealValue) || 0,
        nextFollowUp: data.nextFollowUp,
        notes: data.notes,
        ...flags,
      });
    } else {
      res = await addLead({ ...data, ...flags });
    }
    setBusy(false);
    if (!res) return;
    if (res.problem) {
      // the server found something the form didn't show yet: show it and let them decide
      if (res.problem.code === 'duplicate') {
        setDups(res.problem.duplicates || []);
        setAnyway(false);
      } else {
        setValueProblem(res.problem);
        setValueOk(false);
      }
      return;
    }
    const id = lead ? lead.id : res;
    toast(lead ? `${id} updated` : `Lead ${id} created`);
    onSaved?.(id);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={lead ? `Edit ${lead.id}` : 'Add new lead'} wide>
      <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name" required error={err.name}>
          <input className={fieldCls} value={f.name} onChange={set('name')} autoComplete="off" />
        </Field>
        <Field label="Mobile number" required error={err.phone}>
          <input
            className={fieldCls}
            value={f.phone}
            onChange={(e) =>
              setF((v) => ({ ...v, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
            }
            inputMode="numeric"
          />
        </Field>
        {dups.length > 0 && (
          <div className="sm:col-span-2">
            <DuplicateNotice duplicates={dups} anyway={anyway} onAnyway={setAnyway} />
          </div>
        )}
        <Field label="Email" error={err.email}>
          <input className={fieldCls} value={f.email} onChange={set('email')} type="email" />
        </Field>
        <Field label="Source">
          <select className={fieldCls} value={f.source} onChange={set('source')}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Project">
          <select className={fieldCls} value={f.project} onChange={set('project')}>
            <option value="">Not decided</option>
            {projectNames.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Configuration">
          <select className={fieldCls} value={f.config} onChange={set('config')}>
            <option value="">Not decided</option>
            {CONFIGS.map((s) => (
              <option key={s}>{s}</option>
            ))}
            {f.config && !CONFIGS.includes(f.config) && <option>{f.config}</option>}
          </select>
        </Field>
        <Field label="Customer budget (₹)">
          <input
            className={fieldCls}
            value={f.budget}
            onChange={setMoney('budget')}
            inputMode="numeric"
            placeholder="e.g. 4500000"
          />
          <Size value={f.budget} />
        </Field>
        <Field label="Expected deal value (₹)" error={err.value}>
          <input
            className={fieldCls}
            value={f.dealValue}
            onChange={setMoney('dealValue')}
            inputMode="numeric"
            placeholder="e.g. 4350000"
          />
          <Size value={f.dealValue} />
        </Field>
        {valueProblem && (
          <div className="sm:col-span-2">
            <ValueNotice problem={valueProblem} ok={valueOk} onOk={setValueOk} />
          </div>
        )}
        <Field label="Next follow-up">
          <input
            className={fieldCls}
            value={f.nextFollowUp}
            onChange={set('nextFollowUp')}
            type="date"
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea className={fieldCls} rows={3} value={f.notes} onChange={set('notes')} />
        </Field>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit" disabled={busy}>
            {busy ? 'Saving…' : lead ? 'Save changes' : 'Create lead'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
