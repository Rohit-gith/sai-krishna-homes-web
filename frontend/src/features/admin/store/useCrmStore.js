import { useMemo } from 'react';
import { create } from 'zustand';
import { PROJECTS } from '../constants';
import { api } from '@/services/crmApi';
import { useUiStore } from '@/store/useUiStore';
import { can } from '../access';
import { useAuthStore } from './useAuthStore';

/*
 * Admin CRM data, loaded from the backend (MongoDB) and shared by every admin on every device.
 * Each action calls the API and then puts the server's saved copy into the store, so the screen
 * always shows what is really stored. On failure an error toast is shown and the action resolves
 * to null (callers only show their success message when they get a result back).
 */

const fail = (e) => {
  useUiStore.getState().showToast(e.message || 'Something went wrong. Please try again.', 'error');
  return null;
};

/**
 * A duplicate mobile number or a deal value that looks wrong is not an error: the form shows it and
 * asks the person ("add anyway" / "the value is correct"). Resolves to { problem } for those.
 */
const checked = (e) =>
  e.data?.code === 'duplicate' || e.data?.code === 'value_check' ? { problem: e.data } : fail(e);

/** Replace the given leads (matched by id) with fresh copies from the server. */
const merge = (list, fresh) => {
  const byId = new Map(fresh.map((l) => [l.id, l]));
  return list.map((l) => byId.get(l.id) || l);
};

export const useCrmStore = create((set, get) => ({
  leads: [],
  enquiries: [],
  projects: [], // from the database: the 2 built-in website projects + any the owner added
  loaded: false,
  loading: false,
  loadError: '',

  /** Fetch everything (on opening the admin panel, and on "Refresh"). */
  load: async () => {
    if (get().loading) return;
    set({ loading: true, loadError: '' });
    try {
      // fresh role + permissions first, so a change the owner just made shows at once
      const user = await api('/auth/me');
      useAuthStore.setState({ user });
      // staff without "See website enquiries" don't ask for them (the server would say no)
      const [leads, enquiries, projects] = await Promise.all([
        api('/leads'),
        can(user, 'enquiries.view') ? api('/enquiries') : Promise.resolve([]),
        api('/projects').catch(() => []),
      ]);
      set({ leads, enquiries, projects, loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, loadError: e.message });
      // deactivated / password reset / session over: back to the login page
      if (e.status === 401) useAuthStore.setState({ user: null, checked: true });
    }
  },

  /**
   * Fetch website enquiries again (every 30 s while the CRM is open, and when the tab comes back),
   * so a visitor's form shows up without anyone pressing Refresh. Returns the ones that are new.
   */
  pollEnquiries: async () => {
    const user = useAuthStore.getState().user;
    if (!get().loaded || !can(user, 'enquiries.view')) return [];
    const list = await api('/enquiries').catch(() => null);
    if (!Array.isArray(list)) return [];
    const known = new Set(get().enquiries.map((e) => e.id));
    const fresh = list.filter((e) => !known.has(e.id));
    set({ enquiries: list });
    return fresh;
  },

  /** Clear on logout so the next person on this device never sees the previous data. */
  reset: () => set({ leads: [], enquiries: [], projects: [], loaded: false, loadError: '' }),

  /* ---------- projects (owner / co-owner) ---------- */
  reloadProjects: async () => {
    const projects = await api('/projects').catch(() => null);
    if (projects) set({ projects });
    return projects;
  },
  createProject: async (data) => {
    try {
      const p = await api('/projects', { method: 'POST', body: data });
      await get().reloadProjects();
      return p;
    } catch (e) {
      return fail(e);
    }
  },
  updateProject: async (id, patch) => {
    try {
      const p = await api(`/projects/${id}`, { method: 'PATCH', body: patch });
      // a renamed project also renames its leads: refresh everything
      await get().load();
      return p;
    } catch (e) {
      return fail(e);
    }
  },
  /** Website details of one project: { web } (status, photos order, published…). Returns the project. */
  saveProjectWeb: async (id, web) => {
    try {
      const p = await api(`/projects/${id}`, { method: 'PATCH', body: { web } });
      set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
      return p;
    } catch (e) {
      return fail(e);
    }
  },
  addProjectPhoto: async (id, data, alt = '') => {
    const p = await api(`/projects/${id}/photos`, { method: 'POST', body: { data, alt } });
    set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
    return p;
  },
  removeProjectPhoto: async (id, photoId) => {
    try {
      const p = await api(`/projects/${id}/photos/${photoId}`, { method: 'DELETE' });
      set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
      return p;
    } catch (e) {
      return fail(e);
    }
  },
  deleteProject: async (id) => {
    try {
      await api(`/projects/${id}`, { method: 'DELETE' });
      await get().reloadProjects();
      return true;
    } catch (e) {
      return fail(e);
    }
  },

  addLead: async (data) => {
    try {
      const lead = await api('/leads', { method: 'POST', body: data });
      set((s) => ({ leads: [lead, ...s.leads] }));
      return lead.id;
    } catch (e) {
      return checked(e);
    }
  },

  updateLead: async (id, patch) => {
    try {
      const lead = await api(`/leads/${id}`, { method: 'PATCH', body: patch });
      set((s) => ({ leads: merge(s.leads, [lead]) }));
      return lead;
    } catch (e) {
      return checked(e);
    }
  },

  /** Move OPEN leads along the pipeline (won/lost only through commitDeal). Resolves to how many moved. */
  setStatus: async (ids, status) => {
    if (!ids.length) return 0;
    try {
      const updated = await api('/leads/status', { method: 'POST', body: { ids, status } });
      set((s) => ({ leads: merge(s.leads, updated) }));
      return updated.length;
    } catch (e) {
      return fail(e);
    }
  },

  commitDeal: async (id, closed) => {
    try {
      const lead = await api(`/leads/${id}/commit`, { method: 'POST', body: closed });
      set((s) => ({ leads: merge(s.leads, [lead]) }));
      return lead;
    } catch (e) {
      return checked(e);
    }
  },

  reopenDeal: async (id) => {
    try {
      const lead = await api(`/leads/${id}/reopen`, { method: 'POST' });
      set((s) => ({ leads: merge(s.leads, [lead]) }));
      return lead;
    } catch (e) {
      return fail(e);
    }
  },

  addAttempt: async (id, a) => {
    try {
      const lead = await api(`/leads/${id}/attempts`, { method: 'POST', body: a });
      set((s) => ({ leads: merge(s.leads, [lead]) }));
      return lead;
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Excel import, sent in batches of 500 rows so a file of any size works (each request stays small and
   * quick). onProgress(done, total) is called after every batch. Resolves to { done, total, error }:
   * if a batch fails, the earlier batches are already saved; importing the same file again is safe
   * because rows already in the CRM (same phone) are skipped.
   */
  importLeads: async (drafts, onProgress) => {
    const BATCH = 500;
    let done = 0;
    for (let i = 0; i < drafts.length; i += BATCH) {
      try {
        const created = await api('/leads/import', {
          method: 'POST',
          body: { drafts: drafts.slice(i, i + BATCH) },
        });
        set((s) => ({ leads: [...created, ...s.leads] }));
        done += created.length;
        onProgress?.(done, drafts.length);
      } catch (e) {
        return { done, total: drafts.length, error: e.message || 'Import failed.' };
      }
    }
    // newest first, as everywhere else in the CRM
    set((s) => ({ leads: [...s.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));
    return { done, total: drafts.length, error: '' };
  },

  /** Give leads to a team member (email) or unassign them (null). Resolves to how many changed. */
  assignLeads: async (ids, to) => {
    if (!ids.length) return 0;
    try {
      const updated = await api('/leads/assign', { method: 'POST', body: { ids, to } });
      set((s) => ({ leads: merge(s.leads, updated) }));
      return updated.length;
    } catch (e) {
      return fail(e);
    }
  },

  /** People leads can be assigned to (needs "Assign leads"). */
  loadAssignees: async () => {
    try {
      const list = await api('/leads/assignees');
      set({ assignees: list });
      return list;
    } catch {
      set({ assignees: [] });
      return [];
    }
  },
  assignees: [],

  /** Record that a CSV was downloaded (who, when, how many). Never blocks the download. */
  logExport: (count, filters = '') =>
    api('/leads/exported', { method: 'POST', body: { count, filters } }).catch(() => null),

  /** Every open lead of one person goes to another. Returns how many moved (null on error). */
  handoverLeads: async (from, to, note = '') => {
    try {
      const r = await api('/leads/handover', { method: 'POST', body: { from, to, note } });
      if (r.moved) await get().load();
      return r.moved;
    } catch (e) {
      return fail(e);
    }
  },

  deleteLeads: async (ids) => {
    try {
      const r = await api('/leads/delete', { method: 'POST', body: { ids } });
      set((s) => ({ leads: s.leads.filter((l) => !ids.includes(l.id)) }));
      return r.deleted;
    } catch (e) {
      return fail(e);
    }
  },

  markEnquiry: async (id, patch) => {
    // optimistic: the NEW badge clears at once
    set((s) => ({ enquiries: s.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    try {
      const e = await api(`/enquiries/${id}`, { method: 'PATCH', body: patch });
      set((s) => ({ enquiries: s.enquiries.map((x) => (x.id === id ? e : x)) }));
      return e;
    } catch (e) {
      get().load();
      return fail(e);
    }
  },

  deleteEnquiry: async (id) => {
    try {
      await api(`/enquiries/${id}`, { method: 'DELETE' });
      set((s) => ({ enquiries: s.enquiries.filter((e) => e.id !== id) }));
      return true;
    } catch (e) {
      return fail(e);
    }
  },
}));

/** Project names for every CRM dropdown (falls back to the two built-in ones before the first load). */
export function useProjectNames() {
  const projects = useCrmStore((st) => st.projects);
  return useMemo(() => (projects.length ? projects.map((p) => p.name) : PROJECTS), [projects]);
}
