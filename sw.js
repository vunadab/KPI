// KPI Banking NAB - Service Worker v5
// KHÔNG cache index.html - luôn lấy từ mạng để update code
const CACHE = 'kpi-v5';

self.addEventListener('install', e => {
  // skipWaiting: kích hoạt SW mới NGAY, không chờ tab cũ đóng
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./icon-192.png','./icon-512.png']))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Xóa TẤT CẢ cache cũ
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        // Báo tất cả tab reload để lấy code mới
        return self.clients.matchAll({type:'window'});
      })
      .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Firebase và index.html: LUÔN lấy từ mạng
  if (url.includes('firebasedatabase.app') ||
      url.includes('index.html') ||
      url.includes('github.io/KPI') ||
      url.endsWith('/KPI') ||
      url.endsWith('/KPI/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Icons: cache
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
