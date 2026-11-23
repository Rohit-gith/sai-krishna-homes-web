import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Search, Trash2 } from 'lucide-react';
import { api } from '@/services/crmApi';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { Btn, Card, StatusBadge, fieldCls } from '@/features/admin/components/ui';
import { fmtDateTime, inr } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

/** Owner / co-owner: deleted leads. Nothing is lost: restore puts a lead back with all its history. */
export default function RecycleBinPage() {
  const me = useAuthStore((s) => s.user);
  const reloadLeads = useCrmStore((s) => s.load);
  const toast = useUiStore((s) => s.showToast);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const fidelsya = me?.role === 'superowner';

  const load = useCallback(() => {
    setError('');
    api('/leads/trash').then(setList, (e) => {
      setList([]);
      setError(e.message || 'Could not load the recycle bin.');
    });
  }, []);
  useEffect(() => {
    document.title = 'Recycle bin | Sai Krishna Homes';
    load();
  }, [load]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/\s+/g, '');
    if (!t) return list || [];
    return (list || []).filter((l) =>
      [l.name, l.id, l.phone, l.project].some((v) =>
        String(v || '')
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(t),
      ),
    );
  }, [list, q]);
  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const restore = async (ids) => {
    setBusy(true);
    try {
      const back = await api('/leads/trash/restore', { method: 'POST', body: { ids } });
      toast(`${back.length} lead(s) restored to Leads`);
      setSelected([]);
      load();
      reloadLeads();
    } catch (e) {
      toast(e.message || 'Could not restore.', 'error');
    }
    setBusy(false);
  };
  const purge = async (ids) => {
    if (!window.confirm(`Remove ${ids.length} lead(s) for good? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const r = await api('/leads/trash/purge', { method: 'POST', body: { ids } });
      toast(`${r.purged} lead(s) removed for good`);
      setSelected([]);
      load();
    } catch (e) {
      toast(e.message || 'Could not remove.', 'error');
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" /> Leads
      </Link>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Recycle bin</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deleted leads stay here with their calls, history and deal. Restore one to put it back
            exactly as it was.
          </p>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => restore(selected)} disabled={busy}>
              <RotateCcw className="h-4 w-4" /> Restore {selected.length}
            </Btn>
            {fidelsya && (
              <Btn variant="danger" onClick={() => purge(selected)} disabled={busy}>
                <Trash2 className="h-4 w-4" /> Remove for good
              </Btn>
            )}
          </div>
        )}
      </div>

      <label className="relative mt-5 block">
        <span className="sr-only">Search deleted leads</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className={cn(fieldCls, 'pl-10')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, lead ID or project"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        {list === null && <Card className="p-10 text-center text-slate-500">Loading…</Card>}
        {list !== null && rows.length === 0 && !error && (
          <Card className="p-10 text-center text-slate-500">
            {list.length ? 'Nothing matches this search.' : 'The recycle bin is empty.'}
          </Card>
        )}
        {rows.map((l) => (
          <Card key={l.id} className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-navy-900"
                checked={selected.includes(l.id)}
                onChange={() => toggle(l.id)}
                aria-label={`Select ${l.id}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[16px] font-semibold">{l.name}</span>
                  <StatusBadge status={l.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-600">
                  {l.id} · {l.phone}
                  {l.project ? ` · ${l.project}` : ''}
                  {l.closed?.result === 'won' ? ` · Won ${inr(l.closed.value || l.dealValue)}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Deleted {fmtDateTime(l.deleted?.at)}
                  {l.deleted?.by?.name ? ` by ${l.deleted.by.name}` : ''} ·{' '}
                  {l.attempts?.length || 0} call(s) · {l.history?.length || 0} history line(s)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn variant="outline" onClick={() => restore([l.id])} disabled={busy}>
                  <RotateCcw className="h-4 w-4" /> Restore
                </Btn>
                {fidelsya && (
                  <button
                    type="button"
                    aria-label={`Remove ${l.id} for good`}
                    onClick={() => purge([l.id])}
                    disabled={busy}
                    className="rounded-xl p-2.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Deleted leads are kept safely. Every delete and restore is saved in the Activity log with
        who did it and when.
      </p>
    </div>
  );
}
