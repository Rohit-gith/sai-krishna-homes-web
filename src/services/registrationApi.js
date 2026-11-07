import { apiClient, mockDelay, USE_MOCK_API } from './apiClient';
import { mockDb } from './mockDb';

/**
 * Submit a completed registration.
 * @returns {Promise<{ registrationNo: string, submittedAt: string }>}
 */
export async function submitRegistration(payload) {
  if (!USE_MOCK_API) {
    return apiClient('/registrations', { method: 'POST', body: payload });
  }

  await mockDelay(1200);
  const record = {
    registrationNo: mockDb.nextNumber(),
    applicantName: payload.vendor.fullName,
    mobile: payload.vendor.mobile,
    service: payload.service.service,
    stage: 'submitted',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockDb.insert(record);
  return { registrationNo: record.registrationNo, submittedAt: record.submittedAt };
}
