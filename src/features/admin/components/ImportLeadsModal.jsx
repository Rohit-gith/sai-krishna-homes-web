import { useMemo, useState } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { Modal, Btn, Field, fieldCls } from './ui';
import { PROJECTS } from '../constants';
import { useCrmStore } from '../store/useCrmStore';
import { parseLeadsWorkbook } from '../importLeads';
import { useUiStore } from '@/store/useUiStore';
import { fmtDate, inrShort } from '../utils';
import { cn } from '@/utils/cn';

/** Upload an .xlsx of leads → preview (valid / duplicate / invalid) → import into the CRM. */
export default function ImportLeadsModal({ open, onClose }) {
  const leads = useCrmStore((s) => s.leads);
  const importLeads = useCrmStore((s) => s.importLeads);
  const toast = useUiStore((s) => s.showToast);

  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [project, setProject] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setFileName('');
    setParsed(null);
    setChosen([]);
    setProject('');
    setError('');
  };
  const close = () => {
    reset();
    onClose();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    reset();
    if (!/\.xlsx$/i.test(file.name)) {
      setError('Please choose an Excel .xlsx file. (In Excel: File → Save As → Excel Workbook.)');
      return;
    }
    setBusy(true);
    try {
      const res = await parseLeadsWorkbook(file);
      setFileName(file.name);
      setParsed(res);
      setChosen(res.sheets.filter((s) => s.rows.length).map((s) => s.name));
      setProject(PROJECTS.find((p) => file.name.toLowerCase().includes(p.split(' ')[0].toLowerCase())) || '');
    } catch (err) {
      setError(`Could not read this file: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  /** Classify rows: invalid, duplicate (already in CRM / repeated in file), or ready. */
  const summary = useMemo(() => {
    if (!parsed) return null;
    const existing = new Set(leads.map((l) => l.phone));
    const seen = new Set();
    const ready = [];
    let invalid = 0;
    let inCrm = 0;
    let repeated = 0;
    for (const s of parsed.sheets) {
      if (!chosen.includes(s.name)) continue;
      for (const r of s.rows) {
        if (r.error) invalid++;
        else if (existing.has(r.phone)) inCrm++;
        else if (seen.has(r.phone)) repeated++;
        else {
          seen.add(r.phone);
          ready.push(r);
        }
      }
    }
    return { ready, invalid, inCrm, repeated };
  }, [parsed, chosen, leads]);

  const doImport = () => {
    const drafts = summary.ready.map((r) => ({
      name: r.name,
      phone: r.phone,
      project,
      config: r.config,
      priceMin: r.priceMin,
      priceMax: r.priceMax,
      createdAt: r.createdAt,
      sheet: r.sheet,
      // Rows with remarks have already been worked on by the sales team.
      status: r.remarks.length ? 'contacted' : 'new',
      notes: r.remarks.map((t, i) => `Remark ${i + 1}: ${t}`).join('\n'),
    }));
    const n = importLeads(drafts);
    toast(`${n} leads imported`);
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Import leads from Excel" wide>
      {!parsed ? (
        <div>
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-12 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/40',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
            <span className="mt-3 font-semibold text-navy-950">{busy ? 'Reading file…' : 'Choose an Excel file (.xlsx)'}</span>
            <span className="mt-1 text-sm text-slate-500">Columns like Date, Name, Phone, Configuration, Price, Remarks are detected automatically.</span>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} className="sr-only" />
          </label>
          {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
          <p className="mt-4 text-xs text-slate-500">The file is read inside this browser only; it is not uploaded anywhere.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> <span className="truncate font-semibold text-navy-950">{fileName}</span>
            <button type="button" onClick={reset} className="ml-auto shrink-0 font-semibold text-primary-700 hover:underline">Change file</button>
          </p>

          <Field label="Sheets to import">
            <div className="flex flex-wrap gap-2">
              {parsed.sheets.map((s) => (
                <label key={s.name} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-sm', chosen.includes(s.name) ? 'border-navy-900 bg-slate-50' : 'border-slate-200')}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-700"
                    checked={chosen.includes(s.name)}
                    disabled={!s.rows.length}
                    onChange={() => setChosen((c) => (c.includes(s.name) ? c.filter((x) => x !== s.name) : [...c, s.name]))}
                  />
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-slate-500">{s.rows.length} rows</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Project for these leads">
            <select className={fieldCls} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">Not set</option>
              {PROJECTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Ready to import', summary.ready.length, 'bg-emerald-50 text-emerald-800'],
              ['Already in CRM', summary.inCrm, 'bg-slate-100 text-slate-700'],
              ['Repeated in file', summary.repeated, 'bg-amber-50 text-amber-800'],
              ['Invalid rows', summary.invalid, 'bg-rose-50 text-rose-700'],
            ].map(([label, n, tone]) => (
              <div key={label} className={cn('rounded-xl p-3', tone)}>
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Duplicates are matched by mobile number and skipped. Rows that have remarks are imported as “Contacted”, the rest as “New”.
          </p>

          {summary.ready.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[34rem] text-left text-xs">
                <thead className="bg-slate-50 font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Mobile</th>
                    <th className="px-3 py-2">Config</th>
                    <th className="px-3 py-2">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.ready.slice(0, 6).map((r) => (
                    <tr key={r.phone}>
                      <td className="whitespace-nowrap px-3 py-2">{fmtDate(r.createdAt)}</td>
                      <td className="px-3 py-2 font-semibold">{r.name}</td>
                      <td className="px-3 py-2">{r.phone}</td>
                      <td className="px-3 py-2">{r.config}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.priceMax ? `${inrShort(r.priceMin)} – ${inrShort(r.priceMax)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {summary.ready.length > 6 && <p className="bg-slate-50 px-3 py-2 text-xs text-slate-500">…and {summary.ready.length - 6} more</p>}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Btn variant="outline" onClick={close}>Cancel</Btn>
            <Btn onClick={doImport} disabled={!summary.ready.length}>
              <Upload className="h-4 w-4" /> Import {summary.ready.length} leads
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
