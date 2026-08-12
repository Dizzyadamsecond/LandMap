const CACHE = 'landmap-v2';
const PRECACHE = [
  '/',
  '/pt-BR',
  '/en-US',
  '/es-ES',
  '/offline.html',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Nunca cachear APIs — sempre rede, fallback silencioso em erro.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Navegações: network-first, com fallback para offline.html quando sem rede.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // Assets estáticos: cache-first com revalidação.
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});

self.addEventListener('push', (e) => {
  if (!e.data) return;
  let d = {};
  try {
    d = e.data.json();
  } catch {
    d = { title: 'LandMap', body: e.data.text() };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || 'LandMap', {
      body: d.body,
      icon: '/icons/icon-512.png',
      badge: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((cls) => {
      const url = (e.notification.data && e.notification.data.url) || '/pt-BR';
      for (const c of cls) if ('focus' in c) return c.focus();
      return self.clients.openWindow(url);
    })
  );
});
