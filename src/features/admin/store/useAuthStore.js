import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEMO_ADMIN } from '../constants';

/** Session lasts until the browser tab/window is closed (sessionStorage). Front-end only: see DEMO_ADMIN. */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        const ok = email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
        if (ok) set({ user: { email: DEMO_ADMIN.email, name: 'Admin', at: new Date().toISOString() } });
        return ok;
      },
      logout: () => set({ user: null }),
    }),
    { name: 'skh_admin_session', storage: createJSONStorage(() => sessionStorage) },
  ),
);
