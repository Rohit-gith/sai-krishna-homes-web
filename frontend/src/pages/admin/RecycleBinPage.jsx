import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, RotateCcw, Search, Trash2 } from 'lucide-react';
import { api } from '@/services/crmApi';
import { useAuthStore } from '@/features/admin/store/useAuthStore';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { Btn, Card, Modal, StatusBadge, fieldCls } from '@/features/admin/components/ui';
import { fmtDate, fmtDateTime, inr } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';
import { useLiveRefresh } from '@/features/admin/useLiveRefresh';

/*
 * Deleted leads. Nothing is lost: restore puts a lead back with all its history.
 * "Delete forever": the owner only (and Fidelsya). The owner has to type DELETE. For the client the
 * leads are gone; Fidelsya keeps them 120 days in an archive (its own tab here) to undo a mistake.
 */

const daysLeft = (iso) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 864e5));

/** "Delete forever" confirmation: says exactly what goes, and needs DELETE typed. */
function DeleteForeverModal({ leads, onClose, onConfirm, busy }) {
  const [typed, setTyped] = useState('');
  useEffect(() => setTyped(''), [leads]);
  if (!leads) return null;
  const ok = typed === 'DELETE';
  return (
    <Modal open onClose={onClose} title={`Delete ${leads.length} lead(s) forever?`}>
      <div className="space-y-4 text-sm">
        <p className="rounded-xl bg-rose-50 p-3 font-medium text-rose-800">
          {leads.length === 1 ? 'This lead' : `These ${leads.length} leads`} will be removed from
          the CRM for everyone, with all calls and history. They cannot be restored from the recycle
          bin.
        </p>
        <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3 text-slate-700">
          {leads.map((l) => (
            <li key={l.id}>
              <span className="font-mono text-xs font-semibold">{l.id}</span> · {l.name} · {l.phone}
            </li>
          ))}
        </ul>
        <label className="block">
          <span className="text-[13px] font-semibold text-navy-900">
            Type <b className="font-mono text-rose-700">DELETE</b> to confirm
          </span>
          <input
            className={cn(fieldCls, 'mt-1.5 font-mono')}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            autoComplete="off"
            aria-label="Type DELETE to confirm"
          />
        </label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="danger" disabled={!ok || busy} onClick={() => onConfirm(typed)}>
            <Trash2 className="h-4 w-4" /> Delete {leads.length} forever
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function RecycleBinPage() {
  const me = useAuthStore((s) => s.user);
  const reloadLeads = useCrmStore((s) => s.load);
  const toast = useUiStore((s) => s.showToast);
  const fidelsya = me?.role === 'superowner';
  const canDeleteForever = fidelsya || me?.role === 'owner'; // not Management, not staff
  const [tab, setTab] = useState('bin'); // 'archive' = Fidelsya only
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [forever, setForever] = useState(null); // leads waiting for the DELETE confirmation

  // quiet = the automatic refresh: no "Loading…", ticks kept, a network hiccup changes nothing
  const load = useCallback(
    (quiet = false) => {
      if (!quiet) {
        setError('');
        setList(null);
        setSelected([]);
      }
      api(tab === 'archive' ? '/leads/archive' : '/leads/trash').then(
        (l) => {
          setList(l);
          if (quiet) setSelected((s) => s.filter((id) => l.some((x) => x.id === id)));
        },
        (e) => {
          if (quiet) return;
          setList([]);
          setError(e.message || 'Could not load the recycle bin.');
        },
      );
    },
    [tab],
  );
  // what others delete, restore or "delete forever" shows up by itself
  useLiveRefresh(() => load(true), ['bin', 'leads']);
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
  const leadsOf = (ids) => (list || []).filter((l) => ids.includes(l.id));

  const restore = async (ids) => {
    setBusy(true);
    try {
      const path = tab === 'archive' ? '/leads/archive/restore' : '/leads/trash/restore';
      const back = await api(path, { method: 'POST', body: { ids } });
      toast(`${back.length} lead(s) restored to Leads`);
      load();
      reloadLeads();
    } catch (e) {
      toast(e.message || 'Could not restore.', 'error');
    }
    setBusy(false);
  };
  const deleteForever = async (confirm) => {
    const ids = forever.map((l) => l.id);
    setBusy(true);
    try {
      const r = await api('/leads/trash/purge', { method: 'POST', body: { ids, confirm } });
      toast(`${r.purged} lead(s) deleted forever`);
      setForever(null);
      load();
    } catch (e) {
      toast(e.message || 'Could not delete.', 'error');
    }
    setBusy(false);
  };
  const removeFromArchive = async (ids) => {
    if (!window.confirm(`Remove ${ids.length} lead(s) from the archive now? This is final.`))
      return;
    setBusy(true);
    try {
      const r = await api('/leads/archive/purge', { method: 'POST', body: { ids } });
      toast(`${r.purged} lead(s) removed from the archive`);
      load();
    } catch (e) {
      toast(e.message || 'Could not remove.', 'error');
    }
    setBusy(false);
  };

  const archive = tab === 'archive';
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
            {archive
              ? 'Fidelsya only: leads the owner deleted forever. Kept 120 days, then removed by themselves.'
              : 'Deleted leads stay here with their calls, history and deal. Restore one to put it back exactly as it was.'}
          </p>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => restore(selected)} disabled={busy}>
              <RotateCcw className="h-4 w-4" /> Restore {selected.length}
            </Btn>
            {archive ? (
              <Btn variant="danger" onClick={() => removeFromArchive(selected)} disabled={busy}>
                <Trash2 className="h-4 w-4" /> Remove now
              </Btn>
            ) : (
              canDeleteForever && (
                <Btn variant="danger" onClick={() => setForever(leadsOf(selected))} disabled={busy}>
                  <Trash2 className="h-4 w-4" /> Delete {selected.length} forever
                </Btn>
              )
            )}
          </div>
        )}
      </div>

      {fidelsya && (
        <div className="mt-5 flex gap-6 border-b border-slate-200" role="tablist">
          {[
            ['bin', 'Recycle bin', Trash2],
            ['archive', 'Deleted forever (archive)', Archive],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 py-2.5 text-sm font-semibold',
                tab === id
                  ? 'border-navy-900 text-navy-950'
                  : 'border-transparent text-slate-500 hover:text-navy-900',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      )}

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
            {list.length
              ? 'Nothing matches this search.'
              : archive
                ? 'The archive is empty.'
                : 'The recycle bin is empty.'}
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
                {archive ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Deleted forever {fmtDateTime(l.archived?.at)}
                    {l.archived?.by?.name ? ` by ${l.archived.by.name}` : ''} ·{' '}
                    <b className="text-rose-700">
                      removed by itself on {fmtDate(l.archived?.expireAt)} (
                      {daysLeft(l.archived?.expireAt)} days left)
                    </b>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    Deleted {fmtDateTime(l.deleted?.at)}
                    {l.deleted?.by?.name ? ` by ${l.deleted.by.name}` : ''} ·{' '}
                    {l.attempts?.length || 0} call(s) · {l.history?.length || 0} history line(s)
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn variant="outline" onClick={() => restore([l.id])} disabled={busy}>
                  <RotateCcw className="h-4 w-4" /> Restore
                </Btn>
                {(archive || canDeleteForever) && (
                  <button
                    type="button"
                    aria-label={archive ? `Remove ${l.id} now` : `Delete ${l.id} forever`}
                    title={archive ? 'Remove from the archive now' : 'Delete forever'}
                    onClick={() => (archive ? removeFromArchive([l.id]) : setForever([l]))}
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
        Deleted leads are kept safely until someone restores them
        {canDeleteForever ? ' or the owner deletes them forever' : ''}. Every delete, restore and
        “delete forever” is saved in the Activity log with who did it and when.
      </p>

      <DeleteForeverModal
        leads={forever}
        busy={busy}
        onClose={() => setForever(null)}
        onConfirm={deleteForever}
      />
    </div>
  );
}
