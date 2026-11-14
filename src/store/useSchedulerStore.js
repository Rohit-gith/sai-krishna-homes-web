import { create } from 'zustand';

/**
 * Site-visit scheduler (Calendly-style pop-up). Any element can open it:
 *   useSchedulerStore.getState().openScheduler({ project, name, phone, config })
 * Links to "#book-visit" open it too (see SchedulerModal's click handler).
 */
export const useSchedulerStore = create((set) => ({
  open: false,
  prefill: {},
  openScheduler: (prefill = {}) => set({ open: true, prefill }),
  closeScheduler: () => set({ open: false }),
}));
