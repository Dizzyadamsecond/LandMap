const CACHE = 'landmap-v4';
const PRECACHE = [
  '/',
  '/pt-BR',
  '/en-US',
  '/es-ES',
  '/offline.html',
  '/manifest.json',
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

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Background sync (skill pwa-expert) ─────────────────────────────────────
// Ações enfileiradas offline (favoritos/alertas) são reenviadas quando a
// conexão volta (evento 'sync') — Chrome/Edge; em navegadores sem suporte a
// sync o SW tenta flush na ativação (online de novo).
const SYNC_STORE = 'pending-actions';

function openSyncDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('landmap-offline', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(SYNC_STORE)) {
        req.result.createObjectStore(SYNC_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function flushPendingActions() {
  const db = await openSyncDb();
  const all = await new Promise((resolve, reject) => {
    const t = db.transaction(SYNC_STORE, 'readonly');
    const r = t.objectStore(SYNC_STORE).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const actions = all || [];
  for (const action of actions) {
    try {
      const res = await fetch(action.url, {
        method: action.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok || res.status === 404) {
        // sucesso (ou rota inexistente) → remove da fila
        const t = db.transaction(SYNC_STORE, 'readwrite');
        t.objectStore(SYNC_STORE).delete(action.id);
      }
    } catch {
      /* mantém na fila — tenta de novo no próximo sync/online */
    }
  }
  db.close();
}

self.addEventListener('sync', (e) => {
  if (e.tag === 'landmap-sync') {
    e.waitUntil(flushPendingActions());
  }
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => {
      // Navegador sem Background Sync: flush na ativação (voltou online)
      if (!('sync' in self.registration)) {
        return flushPendingActions().catch(() => {});
      }
    })
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cross-origin (fonts.googleapis.com, tiles, APIs externas) passa direto:
  // sem interceptar, sem mascarar erro real com o fallback 503 'Offline'.
  if (url.origin !== self.location.origin) return;

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
