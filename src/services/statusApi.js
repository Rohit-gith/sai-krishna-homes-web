import { apiClient, mockDelay, USE_MOCK_API } from './apiClient';
import { mockDb } from './mockDb';

/**
 * Look up an application by registration number or mobile number.
 * @returns {Promise<object|null>} application or null when not found
 */
export async function fetchApplicationStatus(query) {
  const q = query.trim().toUpperCase();

  if (!USE_MOCK_API) {
    return apiClient(`/applications/status?q=${encodeURIComponent(q)}`);
  }

  await mockDelay(800);
  return mockDb.all().find((a) => a.registrationNo.toUpperCase() === q || a.mobile === q) || null;
}
