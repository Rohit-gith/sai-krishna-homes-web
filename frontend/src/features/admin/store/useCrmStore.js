import { create } from 'zustand';
import { api } from '@/services/crmApi';
import { useUiStore } from '@/store/useUiStore';

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

/** Replace the given leads (matched by id) with fresh copies from the server. */
const merge = (list, fresh) => {
  const byId = new Map(fresh.map((l) => [l.id, l]));
  return list.map((l) => byId.get(l.id) || l);
};

export const useCrmStore = create((set, get) => ({
  leads: [],
  enquiries: [],
  loaded: false,
  loading: false,
  loadError: '',

  /** Fetch everything (on opening the admin panel, and on "Refresh"). */
  load: async () => {
    if (get().loading) return;
    set({ loading: true, loadError: '' });
    try {
      const [leads, enquiries] = await Promise.all([api('/leads'), api('/enquiries')]);
      set({ leads, enquiries, loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, loadError: e.message });
    }
  },

  /** Clear on logout so the next person on this device never sees the previous data. */
  reset: () => set({ leads: [], enquiries: [], loaded: false, loadError: '' }),

  addLead: async (data) => {
    try {
      const lead = await api('/leads', { method: 'POST', body: data });
      set((s) => ({ leads: [lead, ...s.leads] }));
      return lead.id;
    } catch (e) {
      return fail(e);
    }
  },

  updateLead: async (id, patch) => {
    try {
      const lead = await api(`/leads/${id}`, { method: 'PATCH', body: patch });
      set((s) => ({ leads: merge(s.leads, [lead]) }));
      return lead;
    } catch (e) {
      return fail(e);
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
      return fail(e);
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

  /** Excel import. Resolves to the number of leads created. */
  importLeads: async (drafts) => {
    try {
      const created = await api('/leads/import', { method: 'POST', body: { drafts } });
      set((s) => ({ leads: [...created, ...s.leads] }));
      return created.length;
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
