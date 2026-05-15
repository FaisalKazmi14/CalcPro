const CACHE_NAME = 'calcninja-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(ASSETS.map(async (url) => {
      try { await cache.add(url); } catch (_) {}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)));
  })());
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      const url = request.url || '';
      if (response && response.status === 200 && (
        url.includes('cdnjs.cloudflare.com') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com') ||
        url.startsWith(self.location.origin)
      )) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      if (request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw _;
    }
  })());
});
