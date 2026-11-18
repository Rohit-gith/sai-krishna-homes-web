import { create } from 'zustand';
import { api } from '@/services/crmApi';

/**
 * Admin session. The real session is an httpOnly cookie set by the backend (8 hours); this store only
 * mirrors who is logged in. `checked` is false until the server has been asked once.
 */
export const useAuthStore = create((set) => ({
  user: null,
  checked: false,

  /** Ask the server whether the cookie is still valid (on opening /admin or /login). */
  check: async () => {
    try {
      const user = await api('/auth/me');
      set({ user, checked: true });
    } catch {
      set({ user: null, checked: true });
    }
  },

  /** Returns '' on success, or the message to show. */
  login: async (email, password) => {
    try {
      const user = await api('/auth/login', { method: 'POST', body: { email, password } });
      set({ user, checked: true });
      return '';
    } catch (e) {
      return e.message;
    }
  },

  logout: async () => {
    set({ user: null });
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
  },
}));

// any API call that finds the session expired logs the admin out
if (typeof window !== 'undefined') {
  window.addEventListener('skh:session-expired', () => useAuthStore.setState({ user: null, checked: true }));
}
