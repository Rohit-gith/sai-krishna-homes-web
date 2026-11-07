import { useEffect, useState } from 'react';
import { Modal, Field, Btn, fieldCls } from './ui';
import { CONFIGS, PROJECTS, SOURCES } from '../constants';
import { useCrmStore } from '../store/useCrmStore';
import { useUiStore } from '@/store/useUiStore';

const EMPTY = { name: '', phone: '', email: '', project: '', config: '', source: 'Walk-in', budget: '', dealValue: '', nextFollowUp: '', notes: '' };

/** Add a new lead, or edit an existing one (pass `lead`). */
export default function LeadFormModal({ open, onClose, lead, initial, onSaved }) {
  const addLead = useCrmStore((s) => s.addLead);
  const updateLead = useCrmStore((s) => s.updateLead);
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});

  useEffect(() => {
    if (!open) return;
    setErr({});
    setF(
      lead
        ? { ...EMPTY, ...lead, budget: lead.budget || '', dealValue: lead.dealValue || '', nextFollowUp: lead.nextFollowUp?.slice(0, 10) || '' }
        : { ...EMPTY, ...initial },
    );
  }, [open, lead, initial]);

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter the customer name';
    if (!/^[6-9]\d{9}$/.test(f.phone.trim())) er.phone = 'Enter a valid 10-digit mobile number';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    setErr(er);
    if (Object.keys(er).length) return;

    const data = { ...f, nextFollowUp: f.nextFollowUp ? new Date(`${f.nextFollowUp}T10:00:00`).toISOString() : null };
    if (lead) {
      updateLead(lead.id, {
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
      });
      toast(`${lead.id} updated`);
      onSaved?.(lead.id);
    } else {
      const id = addLead(data);
      toast(`Lead ${id} created`);
      onSaved?.(id);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={lead ? `Edit ${lead.id}` : 'Add new lead'} wide>
      <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name" required error={err.name}>
          <input className={fieldCls} value={f.name} onChange={set('name')} autoComplete="off" />
        </Field>
        <Field label="Mobile number" required error={err.phone}>
          <input className={fieldCls} value={f.phone} onChange={(e) => setF((v) => ({ ...v, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} inputMode="numeric" />
        </Field>
        <Field label="Email" error={err.email}>
          <input className={fieldCls} value={f.email} onChange={set('email')} type="email" />
        </Field>
        <Field label="Source">
          <select className={fieldCls} value={f.source} onChange={set('source')}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Project">
          <select className={fieldCls} value={f.project} onChange={set('project')}>
            <option value="">Not decided</option>
            {PROJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Configuration">
          <select className={fieldCls} value={f.config} onChange={set('config')}>
            <option value="">Not decided</option>
            {CONFIGS.map((s) => <option key={s}>{s}</option>)}
            {f.config && !CONFIGS.includes(f.config) && <option>{f.config}</option>}
          </select>
        </Field>
        <Field label="Customer budget (₹)">
          <input className={fieldCls} value={f.budget} onChange={set('budget')} inputMode="numeric" placeholder="e.g. 4500000" />
        </Field>
        <Field label="Expected deal value (₹)">
          <input className={fieldCls} value={f.dealValue} onChange={set('dealValue')} inputMode="numeric" placeholder="e.g. 4350000" />
        </Field>
        <Field label="Next follow-up">
          <input className={fieldCls} value={f.nextFollowUp} onChange={set('nextFollowUp')} type="date" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea className={fieldCls} rows={3} value={f.notes} onChange={set('notes')} />
        </Field>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit">{lead ? 'Save changes' : 'Create lead'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
