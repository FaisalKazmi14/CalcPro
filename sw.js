const CACHE_NAME = 'numeron-ultra-v5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[Service Worker] Caching static assets (best-effort)');
      await Promise.all(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[Service Worker] Skip asset:', url, err && err.message);
            return null;
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        if (networkResponse.status === 200 && (
          event.request.url.includes('cdnjs.cloudflare.com') ||
          event.request.url.includes('fonts.googleapis.com') ||
          event.request.url.includes('fonts.gstatic.com')
        )) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
