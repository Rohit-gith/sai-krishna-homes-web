import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, FileSpreadsheet, Plus, Search, Trash2, X } from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { STATUSES, STATUS, OPEN_STATUSES, PROJECTS, SOURCES } from '@/features/admin/constants';
import { Btn, Card, StatusBadge, fieldCls } from '@/features/admin/components/ui';
import LeadFormModal from '@/features/admin/components/LeadFormModal';
import CommitDealModal from '@/features/admin/components/CommitDealModal';
import ImportLeadsModal from '@/features/admin/components/ImportLeadsModal';
import { downloadCsv, fmtDate, inrShort, isOverdue } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

const PAGE = 100;

/** Deal value if known, else the price range from an Excel import, else the budget. */
const valueLabel = (l) =>
  l.closed?.value || l.dealValue
    ? inrShort(l.closed?.value || l.dealValue)
    : l.priceMax
      ? `${inrShort(l.priceMin)}–${inrShort(l.priceMax).replace('₹', '')}`
      : l.budget
        ? inrShort(l.budget)
        : '—';

/** Status picker used on each row: open stages change instantly, Won/Lost open the commit dialog. */
function StatusSelect({ lead, onClose }) {
  const setStatus = useCrmStore((s) => s.setStatus);
  if (lead.closed) return <StatusBadge status={lead.status} />;
  return (
    <select
      aria-label={`Status of ${lead.id}`}
      value={lead.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const v = e.target.value;
        if (v === 'won' || v === 'lost') onClose(lead, v);
        else setStatus([lead.id], v);
      }}
      className={cn('cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-semibold ring-1 ring-inset focus:ring-2', STATUS[lead.status].badge)}
    >
      {STATUSES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.id === 'won' || s.id === 'lost' ? `${s.label} (commit…)` : s.label}
        </option>
      ))}
    </select>
  );
}

export default function LeadsPage() {
  const leads = useCrmStore((s) => s.leads);
  const setStatus = useCrmStore((s) => s.setStatus);
  const deleteLeads = useCrmStore((s) => s.deleteLeads);
  const toast = useUiStore((s) => s.showToast);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState('');
  const [project, setProject] = useState('');
  const [source, setSource] = useState('');
  const status = params.get('status') || '';
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(null); // { lead, result }
  const [importing, setImporting] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (!status || l.status === status) &&
        (!project || l.project === project) &&
        (!source || l.source === source) &&
        (!t || [l.id, l.name, l.phone, l.email].some((v) => v?.toLowerCase().includes(t))),
    );
  }, [leads, q, status, project, source]);

  useEffect(() => setLimit(PAGE), [q, status, project, source]);
  const visible = rows.slice(0, limit);

  const allSelected = visible.length > 0 && visible.every((r) => selected.includes(r.id));
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(allSelected ? [] : visible.map((r) => r.id));
  const setStatusFilter = (v) => {
    setSelected([]);
    setParams(v ? { status: v } : {});
  };

  const bulkStatus = (v) => {
    const open = selected.filter((id) => !leads.find((l) => l.id === id)?.closed);
    setStatus(open, v);
    const skipped = selected.length - open.length;
    toast(`${open.length} lead(s) moved to ${STATUS[v].label}${skipped ? ` · ${skipped} closed deal(s) skipped` : ''}`);
    setSelected([]);
  };
  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selected.length} lead(s)? This cannot be undone.`)) return;
    deleteLeads(selected);
    toast(`${selected.length} lead(s) deleted`);
    setSelected([]);
  };
  const exportCsv = () => {
    const list = selected.length ? leads.filter((l) => selected.includes(l.id)) : rows;
    downloadCsv(`sai-krishna-leads-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['ID', 'Name', 'Phone', 'Email', 'Project', 'Config', 'Source', 'Status', 'Budget', 'Deal value', 'Price range', 'Attempts', 'Next follow-up', 'Created', 'Notes'],
      ...list.map((l) => [l.id, l.name, l.phone, l.email, l.project, l.config, l.source, STATUS[l.status].label, l.budget, l.closed?.value || l.dealValue, l.priceMax ? `${l.priceMin}-${l.priceMax}` : '', l.attempts.length, fmtDate(l.nextFollowUp), fmtDate(l.createdAt), l.notes]),
    ]);
  };

  const counts = Object.fromEntries(STATUSES.map((s) => [s.id, leads.filter((l) => l.status === s.id).length]));

  return (
    <div className="mx-auto max-w-7xl pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Leads & deals</h1>
          <p className="mt-1 text-sm text-slate-500">{leads.length} leads · track, follow up and close.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" onClick={() => setImporting(true)}>
            <FileSpreadsheet className="h-4 w-4" /> Import
          </Btn>
          <Btn variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export
          </Btn>
          <Btn onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add new lead
          </Btn>
        </div>
      </div>

      {/* Status tabs */}
      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold', !status ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 ring-1 ring-slate-200')}
        >
          All <span className="opacity-60">{leads.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatusFilter(s.id)}
            className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset', status === s.id ? s.badge : 'bg-white text-navy-900 ring-slate-200')}
          >
            <span className={cn('h-2 w-2 rounded-full', s.dot)} />
            {s.label} <span className="opacity-60">{counts[s.id]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem_12rem]">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={fieldCls + ' pl-10'} placeholder="Search ID, name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className={fieldCls} value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project">
          <option value="">All projects</option>
          {PROJECTS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className={fieldCls} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          <option value="">All sources</option>
          {SOURCES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Desktop table */}
      <Card className="mt-4 hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-emerald-700" />
              </th>
              <th className="px-3 py-3">Lead</th>
              <th className="px-3 py-3">Interest</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Value</th>
              <th className="px-3 py-3 text-center">Attempts</th>
              <th className="px-3 py-3">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((l) => (
              <tr
                key={l.id}
                onClick={() => navigate(`/admin/leads/${l.id}`)}
                className={cn('cursor-pointer transition-colors hover:bg-slate-50', selected.includes(l.id) && 'bg-primary-50/60')}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${l.id}`} checked={selected.includes(l.id)} onChange={() => toggle(l.id)} className="h-4 w-4 accent-emerald-700" />
                </td>
                <td className="px-3 py-3">
                  <span className="block font-semibold text-navy-950">{l.name}</span>
                  <span className="text-xs text-slate-500">{l.id} · {l.phone} · {l.source}</span>
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {l.project || '—'}
                  <span className="block text-xs text-slate-400">{l.config}</span>
                </td>
                <td className="px-3 py-3"><StatusSelect lead={l} onClose={(lead, result) => setClosing({ lead, result })} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">{valueLabel(l)}</td>
                <td className="px-3 py-3 text-center">{l.attempts.length}</td>
                <td className={cn('px-3 py-3 text-xs', OPEN_STATUSES.includes(l.status) && isOverdue(l.nextFollowUp) ? 'font-semibold text-rose-600' : 'text-slate-500')}>
                  {OPEN_STATUSES.includes(l.status) ? fmtDate(l.nextFollowUp) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-10 text-center text-slate-500">No leads match these filters.</p>}
      </Card>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {rows.length > 0 && (
          <label className="flex items-center gap-2 px-1 text-sm text-slate-600">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-emerald-700" /> Select all ({visible.length})
          </label>
        )}
        {visible.map((l) => (
          <Card key={l.id} className={cn('p-4', selected.includes(l.id) && 'ring-2 ring-primary-400')}>
            <div className="flex items-start gap-3">
              <input type="checkbox" aria-label={`Select ${l.id}`} checked={selected.includes(l.id)} onChange={() => toggle(l.id)} className="mt-1 h-5 w-5 accent-emerald-700" />
              <Link to={`/admin/leads/${l.id}`} className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{l.name}</span>
                <span className="block text-xs text-slate-500">{l.id} · {l.phone}</span>
                <span className="mt-1 block text-xs text-slate-500">{[l.project, l.config].filter(Boolean).join(' · ') || '—'}</span>
              </Link>
              <span className="shrink-0 text-right text-sm font-bold">{valueLabel(l)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <StatusSelect lead={l} onClose={(lead, result) => setClosing({ lead, result })} />
              <span className="text-xs text-slate-500">{l.attempts.length} attempts</span>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="p-10 text-center text-slate-500">No leads match these filters.</p>}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-40 rounded-2xl bg-navy-950 p-3 text-white shadow-2xl lg:left-[calc(16rem+1.5rem)] lg:right-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 text-sm font-semibold">{selected.length} selected</span>
            <select
              aria-label="Bulk change status"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) bulkStatus(e.target.value);
                e.target.value = '';
              }}
              className="rounded-xl border-0 bg-white/10 px-3 py-2 text-sm font-semibold text-white focus:ring-2 focus:ring-primary-400 [&>option]:text-navy-950"
            >
              <option value="">Change status…</option>
              {STATUSES.filter((s) => OPEN_STATUSES.includes(s.id)).map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button type="button" onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={bulkDelete} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold hover:bg-rose-700">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button type="button" onClick={() => setSelected([])} aria-label="Clear selection" className="ml-auto rounded-xl p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 px-2 text-[11px] text-white/50">Won / Lost are closed one by one with the commit dialog.</p>
        </div>
      )}

      {rows.length > limit && (
        <div className="mt-4 flex justify-center">
          <Btn variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
            Show more ({rows.length - limit} remaining)
          </Btn>
        </div>
      )}

      <LeadFormModal open={adding} onClose={() => setAdding(false)} />
      <ImportLeadsModal open={importing} onClose={() => setImporting(false)} />
      <CommitDealModal open={!!closing} lead={closing?.lead} initialResult={closing?.result} onClose={() => setClosing(null)} />
    </div>
  );
}
