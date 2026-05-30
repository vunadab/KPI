const CACHE_NAME = 'kpi-nab-v4';

// CHỈ cache icon và manifest — KHÔNG cache index.html
// index.html luôn được fetch từ mạng để đảm bảo cập nhật
const STATIC_CACHE = [
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE))
  );
  self.skipWaiting(); // Kích hoạt SW mới ngay, không chờ tab đóng
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : null))
    ).then(() => self.clients.claim()) // Kiểm soát tất cả tab ngay lập tức
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase: luôn lấy mạng thật, không cache
  if (url.includes('firebasedatabase.app')) return;

  // index.html và fonts: luôn lấy mạng thật để cập nhật code mới
  if (url.includes('index.html') || url.endsWith('/') || url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Icons/manifest: cache first
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
