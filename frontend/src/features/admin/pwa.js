import { api } from '@/services/crmApi';

/*
 * The CRM as an installable app (Android / iPhone / laptop) with notifications.
 *  - The app files (manifest, icons) are added to the page only inside the CRM and its login page,
 *    so website visitors are never offered to "install" the CRM.
 *  - /sw.js only shows notifications; it never caches pages.
 */

let installEvent = null; // Chrome / Edge / Android: the browser's own "Install" prompt, kept for our button
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // not prevented: Android Chrome still shows its own "Install" bar; we also keep it for our button
    installEvent = e;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    listeners.forEach((fn) => fn());
  });
}
export const onInstallChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const canPromptInstall = () => !!installEvent;
export async function promptInstall() {
  if (!installEvent) return false;
  installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  listeners.forEach((fn) => fn());
  return outcome === 'accepted';
}

/** Is it running as the installed app (not in a browser tab)? */
export const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const platform = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
    return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
};

const addHead = (tag, attrs) => {
  const sel = `${tag}[data-crm-app="${attrs.rel || attrs.name}"]`;
  if (document.head.querySelector(sel)) return;
  const el = document.createElement(tag);
  Object.entries({ ...attrs, 'data-crm-app': attrs.rel || attrs.name }).forEach(([k, v]) =>
    el.setAttribute(k, v),
  );
  document.head.appendChild(el);
};

/** Call on CRM pages: makes the page installable and starts the notification helper. */
export function setupCrmApp() {
  addHead('link', { rel: 'manifest', href: '/app/manifest.webmanifest' });
  addHead('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  addHead('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }); // older iPhones
  addHead('meta', { name: 'apple-mobile-web-app-title', content: 'SKH CRM' });
  addHead('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
  // iPhone home-screen icon: a square one for the app (the website keeps its own)
  const apple = document.head.querySelector('link[rel="apple-touch-icon"]');
  if (apple && !apple.dataset.site) {
    apple.dataset.site = apple.getAttribute('href');
    apple.setAttribute('href', '/app/apple-touch-180.png');
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

/* ---------- notifications ---------- */

const keyBytes = (base64) => {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

/**
 * 'unsupported' (this browser can't; on iPhone: install the app first) · 'blocked' (the person
 * said no in the browser) · 'on' · 'off'
 */
export async function pushState() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const sub = await currentSubscription();
  return sub ? 'on' : 'off';
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('This browser cannot show notifications.');
  const { publicKey } = await api('/push/key');
  if (!publicKey) throw new Error('Notifications are not set up on the server yet.');
  // only ask when the browser hasn't been told yet (asking again can hang on some browsers)
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications were not allowed in the browser.');
  const reg =
    (await navigator.serviceWorker.getRegistration('/')) ||
    (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    // the browser asks its push service (Google / Apple / Mozilla); never leave the button spinning
    const late = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('The notification service did not answer. Please try again.')),
        20000,
      ),
    );
    sub = await Promise.race([
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(publicKey),
      }),
      late,
    ]);
  }
  await api('/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON() } });
  return true;
}

/** Turn off on this device (reason 'logout' when signing out, so the next person gets nothing). */
export async function disablePush(reason = '') {
  const sub = await currentSubscription().catch(() => null);
  if (!sub) return;
  await api('/push/unsubscribe', {
    method: 'POST',
    body: { endpoint: sub.endpoint, reason },
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export const sendTestPush = () => api('/push/test', { method: 'POST' });
