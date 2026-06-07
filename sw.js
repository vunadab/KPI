// ── Service Worker KPI Banking NAB v5 — Production Safe ──
// NGUYÊN TẮC:
//   1. KHÔNG skipWaiting() — SW mới không tự kích hoạt, chờ user đóng tab
//   2. KHÔNG clients.claim() — không chiếm quyền kiểm soát tab đang mở
//   3. Network-First cho HTML — luôn lấy code mới nhất, fallback cache khi offline
//   4. Cache-First cho assets tĩnh (icon, manifest) — không thay đổi thường xuyên
//   5. Không bao giờ tự reload app

var CACHE_NAME = 'kpi-nab-v5';
var HTML_URLS = ['./KPI_Banking_KHCN_v5_fix.html', './index.html', './', '/'];
var STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

// ── INSTALL: chỉ cache static assets, không cache HTML ──
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Chỉ cache manifest và icon — không cache HTML
      // HTML luôn fetch mới từ network để tránh serve version cũ
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.log('SW install cache warning:', err);
      });
    })
  );
  // KHÔNG gọi self.skipWaiting() — SW mới chờ tự nhiên
});

// ── ACTIVATE: xóa cache cũ, KHÔNG claim clients ──
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) {
            return k.startsWith('kpi-nab-') && k !== CACHE_NAME;
          })
          .map(function(k) {
            console.log('SW deleting old cache:', k);
            return caches.delete(k);
          })
      );
    })
  );
  // KHÔNG gọi self.clients.claim() — không chiếm tab đang mở
});

// ── FETCH: Network-First cho HTML, Cache-First cho assets ──
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Bỏ qua các request không phải GET (Firebase PUT/DELETE/POST)
  if (e.request.method !== 'GET') return;

  // Bỏ qua Firebase REST API — không cache, không intercept
  if (url.includes('firebasedatabase.app') ||
      url.includes('firebaseapp.com') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com')) {
    return;
  }

  // HTML files — Network-First: luôn lấy mới, fallback cache khi offline
  var isHTML = url.endsWith('.html') ||
               url.endsWith('/') ||
               url.endsWith('/KPI') ||
               url.endsWith('/KPI/') ||
               e.request.headers.get('Accept').indexOf('text/html') >= 0;

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          // Lưu bản mới vào cache để dùng khi offline
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
          return res;
        })
        .catch(function() {
          // Offline: trả cache nếu có
          return caches.match(e.request).then(function(cached) {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Static assets (icon, manifest) — Cache-First
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      }).catch(function() {
        return new Response('', { status: 404 });
      });
    })
  );
});
