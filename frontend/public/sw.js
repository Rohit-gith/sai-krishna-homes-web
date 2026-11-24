/*
 * Service worker of the installed CRM app. It only shows notifications (e.g. "New website
 * enquiry") and opens the right page when one is tapped. It does not cache or change any page, so
 * the website and the CRM always load fresh from the server.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sai Krishna Homes CRM', {
      body: data.body || '',
      icon: '/app/icon-192.png',
      badge: '/app/icon-192.png',
      tag: data.tag || undefined,
      data: { url: data.url || '/admin' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/admin', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // an open CRM window: bring it forward and go to the page; otherwise open one
      const win = list.find((c) => new URL(c.url).pathname.startsWith('/admin'));
      if (win) return win.focus().then(() => win.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
