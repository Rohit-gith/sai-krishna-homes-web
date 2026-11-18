/**
 * Tiny localStorage "database" used only while the backend is not ready.
 * Delete this file once the real API is connected.
 */
const KEY = 'skh_mock_applications';

const DEMO_APPLICATIONS = [
  {
    registrationNo: 'SKH2026-1001',
    applicantName: 'Demo Applicant',
    mobile: '9876543210',
    service: 'rooftop-solar',
    stage: 'review',
    submittedAt: '2026-10-20T10:30:00.000Z',
    updatedAt: '2026-11-02T15:10:00.000Z',
  },
  {
    registrationNo: 'SKH2026-1002',
    applicantName: 'Demo Applicant 2',
    mobile: '9123456780',
    service: 'detailed-project-report',
    stage: 'approved',
    submittedAt: '2026-09-12T09:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
  },
];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: ignore in mock mode */
  }
}

export const mockDb = {
  all: () => [...DEMO_APPLICATIONS, ...read()],
  insert: (record) => write([...read(), record]),
  nextNumber: () => `SKH${new Date().getFullYear()}-${String(2000 + read().length + 1)}`,
};
