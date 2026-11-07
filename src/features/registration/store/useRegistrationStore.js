import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialData = {
  service: { previousRegNo: '', organizationType: '', service: '', query: '' },
  vendor: {
    fullName: '',
    organizationName: '',
    mobile: '',
    email: '',
    address: '',
    district: '',
    state: '',
    pincode: '',
  },
  documents: { idProofType: '', idProofNumber: '', panNumber: '', gstNumber: '' },
  uploads: { idProof: null, addressProof: null, photo: null, other: null },
};

/**
 * Registration wizard state.
 * Persisted to localStorage so a page refresh does not lose the draft.
 * Steps: 0 Service → 1 Vendor → 2 Documents → 3 Uploads → 4 Review
 */
export const useRegistrationStore = create(
  persist(
    (set) => ({
      currentStep: 0,
      data: initialData,
      result: null, // { registrationNo, submittedAt } after successful submit

      updateSection: (section, values) =>
        set((s) => ({ data: { ...s.data, [section]: { ...s.data[section], ...values } } })),

      setUpload: (key, fileMeta) =>
        set((s) => ({ data: { ...s.data, uploads: { ...s.data.uploads, [key]: fileMeta } } })),

      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
      goToStep: (step) => set({ currentStep: step }),

      setResult: (result) => set({ result }),
      reset: () => set({ currentStep: 0, data: initialData, result: null }),
    }),
    {
      name: 'skh_registration_draft',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
