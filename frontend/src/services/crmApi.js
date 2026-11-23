/**
 * Calls to our own backend (../backend). Always same-origin "/api": Vite proxies it in
 * development and the website's vercel.json rewrites it to the API in production, so the
 * admin's httpOnly login cookie just works.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * This browser's own ID, made once and kept in this browser, so the activity log can tell two
 * devices apart even when they share one WiFi (and one internet IP). Clearing the browser's data
 * or a private window gives a new one.
 */
let deviceIdCache = '';
export function deviceId() {
  if (deviceIdCache) return deviceIdCache;
  const fresh = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
  try {
    deviceIdCache = localStorage.getItem('skh_device') || '';
    if (!/^[a-f0-9]{12}$/.test(deviceIdCache)) {
      deviceIdCache = fresh();
      localStorage.setItem('skh_device', deviceIdCache);
    }
  } catch {
    deviceIdCache = fresh(); // storage blocked: one ID for this visit
  }
  return deviceIdCache;
}

export async function api(path, { method = 'GET', body, keepalive = false } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      keepalive,
      headers: {
        'X-Device-Id': deviceId(),
        ...(method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
      },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection and try again.', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // an expired session sends the admin back to the login page
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
      window.dispatchEvent(new CustomEvent('skh:session-expired'));
    }
    // no JSON body on a 5xx = the API itself is down/unreachable (e.g. the dev proxy can't reach it)
    const fallback = res.status >= 500 ? 'The server is not responding. Please try again in a minute.' : `Request failed (${res.status})`;
    throw new ApiError(data?.error || fallback, res.status);
  }
  return data;
}

/**
 * Website forms. Fire-and-forget with keepalive, so it still reaches the server while the
 * visitor's browser opens WhatsApp or downloads the brochure. The page's own flow never waits on it.
 */
export function submitEnquiry(data) {
  const body = { ...data, page: window.location.pathname };
  return api('/enquiries', { method: 'POST', body, keepalive: true }).catch((e) => {
    console.warn('Enquiry not saved:', e.message);
    return null;
  });
}
