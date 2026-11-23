import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, Globe, History, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { Btn, Card, Field, Modal, fieldCls } from '@/features/admin/components/ui';
import { fmtDateTime } from '@/features/admin/utils';
import { useUiStore } from '@/store/useUiStore';

const EMPTY = { name: '', location: '', rera: '', note: '' };

function ProjectForm({ open, onClose, project }) {
  const createProject = useCrmStore((s) => s.createProject);
  const updateProject = useCrmStore((s) => s.updateProject);
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setErr('');
    setF(
      project
        ? {
            name: project.name,
            location: project.location || '',
            rera: project.rera || '',
            note: '',
          }
        : EMPTY,
    );
  }, [open, project]);
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const renaming = project && f.name.trim() && f.name.trim() !== project.name;

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (f.name.trim().length < 2) return setErr('Enter the project name.');
    setErr('');
    setBusy(true);
    const body = { name: f.name.trim(), location: f.location.trim(), rera: f.rera.trim() };
    const res = project
      ? await updateProject(project.id, { ...body, note: f.note.trim() })
      : await createProject(body);
    setBusy(false);
    if (!res) return undefined;
    toast(
      project ? `${res.name} updated` : `${res.name} added. It now appears in every project list.`,
    );
    onClose();
    return undefined;
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? `Edit ${project.name}` : 'Add a project'}>
      <form onSubmit={save} noValidate className="space-y-4">
        <Field label="Project name" required>
          <input
            className={fieldCls}
            value={f.name}
            onChange={set('name')}
            autoFocus
            placeholder="e.g. Green Valley Residency"
          />
        </Field>
        {renaming && project.leads + project.visits > 0 && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {project.leads} lead(s) and {project.visits} site visit(s) use “{project.name}”. They
            will move to the new name automatically.
          </p>
        )}
        <Field label="Location">
          <input
            className={fieldCls}
            value={f.location}
            onChange={set('location')}
            placeholder="e.g. Khandagiri, Bhubaneswar"
          />
        </Field>
        <Field label="RERA number">
          <input
            className={fieldCls}
            value={f.rera}
            onChange={set('rera')}
            placeholder="e.g. RP/19/2026/00001"
          />
        </Field>
        {project && (
          <Field label="Reason for the change (optional, saved in the history)">
            <input
              className={fieldCls}
              value={f.note}
              onChange={set('note')}
              placeholder="e.g. Spelling mistake"
            />
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
            <Check className="h-4 w-4" />{' '}
            {busy ? 'Saving…' : project ? 'Save changes' : 'Add project'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

const ACTION = { created: 'Project added', updated: 'Changed' };

/** Owner / co-owner: the projects used across the CRM. The two website projects are locked. */
export default function ProjectsPage() {
  const projects = useCrmStore((s) => s.projects);
  const reloadProjects = useCrmStore((s) => s.reloadProjects);
  const deleteProject = useCrmStore((s) => s.deleteProject);
  const toast = useUiStore((s) => s.showToast);
  const [editing, setEditing] = useState(null); // project, or 'new'
  const [historyOf, setHistoryOf] = useState(null);

  useEffect(() => {
    document.title = 'Projects | Sai Krishna Homes';
    reloadProjects(); // fresh lead / visit counts
  }, [reloadProjects]);

  const remove = async (p) => {
    if (p.web?.published) {
      toast(`“${p.name}” is on the website. Open Website page → Hide from website first.`, 'error');
      return;
    }
    if (p.leads || p.visits) {
      toast(
        `“${p.name}” is used by ${p.leads} lead(s) and ${p.visits} site visit(s). Move them to another project first.`,
        'error',
      );
      return;
    }
    if (
      !window.confirm(`Delete the project “${p.name}”? It will disappear from every project list.`)
    )
      return;
    if (await deleteProject(p.id)) toast(`${p.name} deleted`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            The projects used across the CRM: leads, Excel import, site visits, dashboard and
            filters. Add a new one when you launch it.
          </p>
        </div>
        <Btn onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add project
        </Btn>
      </div>

      <div className="mt-6 space-y-3">
        {projects.map((p) => (
          <Card key={p.id} className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[16px] font-semibold">{p.name}</span>
                  {!p.builtIn &&
                    (p.web?.published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <Globe className="h-3 w-3" /> On website
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Not on website
                      </span>
                    ))}
                  {p.builtIn && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      <Lock className="h-3 w-3" /> Website project · locked
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-600">
                  {[p.location, p.rera && `RERA ${p.rera}`].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.leads ?? 0} lead(s) · {p.visits ?? 0} site visit(s)
                  {!p.builtIn && p.createdAt
                    ? ` · added ${fmtDateTime(p.createdAt)}${p.createdBy?.name ? ` by ${p.createdBy.name}` : ''}`
                    : ''}
                </p>
              </div>
              {!p.builtIn && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/projects/${p.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
                  >
                    <Globe className="h-4 w-4" /> Website page
                  </Link>
                  <Btn variant="outline" onClick={() => setHistoryOf(p)}>
                    <History className="h-4 w-4" /> History
                  </Btn>
                  <Btn variant="outline" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Btn>
                  <button
                    type="button"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => remove(p)}
                    className="rounded-xl p-2.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {projects.length === 0 && <Card className="p-10 text-center text-slate-500">Loading…</Card>}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Panchawati Residency and Sai Krishna Residency are the website’s projects, so they are
        locked. A project you add gets its own page on the website once you fill in its Website page
        and press Show on website. A project can be deleted only while no lead or site visit uses it
        and it is not on the website. Every change is saved in the Activity log.
      </p>

      <ProjectForm
        open={!!editing}
        project={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
      <Modal
        open={!!historyOf}
        onClose={() => setHistoryOf(null)}
        title={historyOf ? `${historyOf.name} · history` : ''}
      >
        {historyOf && (
          <ol className="space-y-2.5 border-l-2 border-slate-100 pl-4">
            {(projects.find((x) => x.id === historyOf.id)?.history || historyOf.history || []).map(
              (h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400" />
                  <span className="font-semibold text-navy-950">
                    {ACTION[h.action] || h.action}
                  </span>
                  {h.changes &&
                    Object.entries(h.changes).map(([k, c]) => (
                      <span key={k} className="text-slate-600">
                        {' '}
                        · {k}: “{c.from || '—'}” → “{c.to || '—'}”
                      </span>
                    ))}
                  {h.moved && (h.moved.leads || h.moved.visits) ? (
                    <span className="text-slate-600">
                      {' '}
                      · {h.moved.leads} lead(s), {h.moved.visits} visit(s) moved
                    </span>
                  ) : null}
                  {h.note && <span className="text-slate-600"> · “{h.note}”</span>}
                  <span className="block text-xs text-slate-400">
                    {fmtDateTime(h.at)}
                    {h.by?.name ? ` · by ${h.by.name}` : ''}
                  </span>
                </li>
              ),
            )}
          </ol>
        )}
      </Modal>
    </div>
  );
}
