const CACHE_NAME = 'sajin-daeji-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch((err) => console.error('SW install cache failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Same-origin GET requests: stale-while-revalidate (serve cache instantly,
// refresh in background). Cross-origin requests (Firebase, CDN libraries)
// are left untouched and go straight to the network, since they need live
// auth/data anyway and caching them adds complexity without real benefit.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResp) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResp.clone()));
          return networkResp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
