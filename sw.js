const CACHE_NAME = 'equipment-app-v1';
const assetsToCache = [
  '/equipment-app/',
  '/equipment-app/index.html',
  '/equipment-app/manifest.json',
  '/equipment-app/icon-192.png',
  '/equipment-app/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});