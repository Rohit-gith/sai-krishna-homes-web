import { apiClient, mockDelay, USE_MOCK_API } from './apiClient';

export async function sendContactMessage(payload) {
  if (!USE_MOCK_API) {
    return apiClient('/contact', { method: 'POST', body: payload });
  }
  await mockDelay(900);
  return { ok: true };
}
