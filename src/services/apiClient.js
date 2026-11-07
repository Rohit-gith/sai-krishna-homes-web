/**
 * Thin fetch wrapper for the real backend.
 * While VITE_USE_MOCK_API is "true" (default), feature APIs use mock data instead.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export async function apiClient(path, { method = 'GET', body, headers, ...rest } = {}) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...rest,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
}

/** Simulates network latency for mock responses. */
export const mockDelay = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));
