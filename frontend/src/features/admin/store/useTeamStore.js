import { create } from 'zustand';
import { api } from '@/services/crmApi';
import { useUiStore } from '@/store/useUiStore';

/*
 * The CRM team (owner / Fidelsya only): accounts, roles, permissions, active/inactive, passwords.
 * Every action returns the server's saved copy, or null after showing the error.
 */
const fail = (e) => {
  useUiStore.getState().showToast(e.message || 'Something went wrong. Please try again.', 'error');
  return null;
};
const replace = (list, u) => list.map((x) => (x.id === u.id ? u : x));

export const useTeamStore = create((set, get) => ({
  users: [],
  meta: { roles: [], permissions: [] },
  loaded: false,
  loading: false,
  error: '',

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: '' });
    try {
      const [users, meta] = await Promise.all([api('/users'), api('/users/meta')]);
      set({ users, meta, loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, error: e.message });
    }
  },

  reset: () => set({ users: [], loaded: false, error: '' }),

  createUser: async (data) => {
    try {
      const u = await api('/users', { method: 'POST', body: data });
      set((s) => ({ users: [...s.users, u] }));
      return u;
    } catch (e) {
      return fail(e);
    }
  },

  updateUser: async (id, patch) => {
    try {
      const u = await api(`/users/${id}`, { method: 'PATCH', body: patch });
      set((s) => ({ users: replace(s.users, u) }));
      return u;
    } catch (e) {
      return fail(e);
    }
  },

  setActive: async (id, active, note = '') => {
    try {
      const u = await api(`/users/${id}/status`, { method: 'PATCH', body: { active, note } });
      set((s) => ({ users: replace(s.users, u) }));
      return u;
    } catch (e) {
      return fail(e);
    }
  },

  resetPassword: async (id, password, note = '') => {
    try {
      await api(`/users/${id}/password`, { method: 'POST', body: { password, note } });
      // refresh this account so its history shows the reset
      const u = await api(`/users/${id}`);
      set((s) => ({ users: replace(s.users, u) }));
      return true;
    } catch (e) {
      return fail(e);
    }
  },
}));

/** The activity log (owner / Fidelsya). params: { email, type, from, to, limit } */
export async function fetchActivity(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  return api(`/activity${q.toString() ? `?${q}` : ''}`);
}

/** A strong random password the owner can hand over (letters + digits, no look-alike characters). */
export function makePassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (s, n) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => s[x % s.length]).join('');
  return `${pick(letters, 6)}${pick(digits, 3)}${pick(letters, 3)}`;
}
