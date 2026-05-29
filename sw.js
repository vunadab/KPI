const CACHE_NAME = 'kpi-nab-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Luôn lấy mạng thật cho Firebase để data không bị cũ
  if (event.request.url.includes('firebasedatabase.app')) return;
  // Các file giao diện: ưu tiên cache, load nhanh hơn
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});