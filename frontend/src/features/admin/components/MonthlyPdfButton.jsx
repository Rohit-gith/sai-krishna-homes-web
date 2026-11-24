import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Btn, fieldCls } from './ui';
import { useAuthStore } from '../store/useAuthStore';
import { can, fullName } from '../access';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

/** Reports page: choose a month → a 2-page PDF summary downloads (owner, Fidelsya, Management). */
export default function MonthlyPdfButton() {
  const user = useAuthStore((s) => s.user);
  const toast = useUiStore((s) => s.showToast);
  const [months, setMonths] = useState(null);
  const [month, setMonth] = useState('');
  const [busy, setBusy] = useState(false);
  if (!can(user, 'reports.download')) return null;

  // the month list comes with the report code, so nothing loads until someone wants a PDF
  const ensure = async () => {
    const mod = await import('../monthlyReport');
    if (!months) {
      const list = mod.recentMonths();
      setMonths(list);
      if (!month) setMonth(list[0].id);
    }
    return mod;
  };

  const download = async () => {
    setBusy(true);
    try {
      const mod = await ensure();
      const m = month || mod.recentMonths()[0].id;
      const file = await mod.downloadMonthlyReport(m, fullName(user));
      toast(`${file} downloaded`);
    } catch (e) {
      toast(e.message || 'Could not make the PDF. Please try again.', 'error');
    }
    setBusy(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:pl-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <FileDown className="h-[18px] w-[18px]" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-navy-950">Monthly PDF report</span>
          <span className="block text-xs text-slate-500">
            A 2-page summary to keep or share: leads, visits, sales by project, team.
          </span>
        </span>
      </div>
      <div className="flex gap-2">
        <select
          className={cn(fieldCls, 'w-auto')}
          value={month}
          onFocus={ensure}
          onMouseDown={ensure}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month for the PDF report"
        >
          {months ? (
            months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))
          ) : (
            <option value="">This month</option>
          )}
        </select>
        <Btn onClick={download} disabled={busy}>
          <FileDown className="h-4 w-4" /> {busy ? 'Preparing…' : 'Download PDF'}
        </Btn>
      </div>
    </div>
  );
}
