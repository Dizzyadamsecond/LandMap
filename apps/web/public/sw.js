const CACHE = 'landmap-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(r => { if(r.status === 200) { caches.open(CACHE).then(c => c.put(e.request, r.clone())); } return r; }).catch(() => new Response('Offline', {status: 503}))));
});
self.addEventListener('push', e => { if(!e.data) return; const d = e.data.json(); e.waitUntil(self.registration.showNotification(d.title || 'LandMap', {body: d.body, icon: '/landmap-logo-transparent.png'})); });
