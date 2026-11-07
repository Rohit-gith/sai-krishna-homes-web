import { create } from 'zustand';
import { fetchApplicationStatus } from '@/services/statusApi';

export const useStatusStore = create((set) => ({
  query: '',
  application: null,
  status: 'idle', // idle | loading | found | not-found | error
  error: '',

  search: async (query) => {
    set({ query, status: 'loading', error: '', application: null });
    try {
      const application = await fetchApplicationStatus(query);
      set({ application, status: application ? 'found' : 'not-found' });
    } catch (err) {
      set({ status: 'error', error: err.message || 'Unable to fetch status' });
    }
  },

  clear: () => set({ query: '', application: null, status: 'idle', error: '' }),
}));
