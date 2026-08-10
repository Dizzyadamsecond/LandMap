// LandMap Service Worker — PWA offline-first (network-first p/ navegação, SWR p/ assets)
const VERSION = 'lm-v3';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';

// Páginas e assets cacheados no install. Cada URL é cacheada individualmente
// (sem cache.addAll em bloco) para que um redirect/erro pontual não derrube o install.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
  '/pt-BR',
  '/en-US',
  '/es-ES',
  '/pt-BR/map',
  '/pt-BR/plans',
];

const NEVER_CACHE = /\/(api|trpc)\//;

function cacheOne(cache, url) {
  return fetch(url, { redirect: 'follow' })
    .then((res) => {
      // Só cacheamos respostas ok (2xx). Ignora redirects->erro silenciosamente.
      if (res && (res.ok || res.type === 'opaqueredirect')) {
        return cache.put(url, res.clone());
      }
    })
    .catch(() => {});
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(PRECACHE_URLS.map((u) => cacheOne(cache, u)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:css|js|png|jpg|jpeg|webp|gif|svg|avif|woff2?|ttf)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.test(url.pathname)) return; // nunca cachear API/dados

  // Navegação (HTML): network-first com cache por URL e fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(url.pathname, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(url.pathname);
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        })
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Resto (imagens de mapa, etc.): rede com fallback de cache.
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((c) => c || Response.error()))
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'LandMap', body: '', url: '/' };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch (e) {
    payload.body = event.data ? event.data.text() : '';
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
