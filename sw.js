const CACHE_NAME = 'equipment-quotation-v8';
const ASSETS_TO_CACHE = [
  'index.html',
  'quotation.html',
  'company.html',
  'design.html',
  'reports.html',
  'activation.html',
  'manifest.json',
  'css/main.css',
  'css/index.css',
  'css/quotation.css',
  'css/company.css',
  'css/design.css',
  'css/reports.css',
  'css/activation.css',
  'js/main.js',
  'js/index.js',
  'js/quotation.js',
  'js/company.js',
  'js/design.js',
  'js/reports.js',
  'js/activation.js',
  'js/license.js'
];

const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE)
          .catch(err => {
            console.warn('Failed to cache assets:', err);
            return Promise.all(
              ASSETS_TO_CACHE.map(url => 
                cache.add(url).catch(() => {})
              )
            );
          });
      })
      .then(() => self.skipWaiting())
  );
});

// التنشيط
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => clients.claim())
  );
});

// الاستراتيجية: Network First مع Fallback
self.addEventListener('fetch', event => {
  const request = event.request;
  
  if (request.url.includes('analytics') || request.url.includes('tracking')) {
    return;
  }

  // الموارد الخارجية
  if (request.url.includes('cdnjs') || request.url.includes('googleapis') || request.url.includes('cdn.jsdelivr')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            fetch(request)
              .then(response => {
                if (response.ok) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, response));
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          return fetch(request)
            .then(response => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              return new Response('Resource unavailable', { status: 503 });
            });
        })
    );
    return;
  }

  // الملفات الرئيسية
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(`
              <!DOCTYPE html>
              <html dir="rtl" lang="ar">
                <head>
                  <meta charset="UTF-8">
                  <title>غير متصل</title>
                  <style>
                    body { font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; background: #f0f4f8; margin: 0; padding: 20px; }
                    .offline { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 400px; }
                    .offline i { font-size: 60px; color: #c9a84c; margin-bottom: 20px; }
                    .offline h2 { color: #1a6b8a; margin-bottom: 10px; }
                    .offline p { color: #666; }
                    .offline .btn { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #1a6b8a; color: white; border-radius: 30px; text-decoration: none; border: none; cursor: pointer; font-family: 'Cairo', sans-serif; }
                  </style>
                </head>
                <body>
                  <div class="offline">
                    <i class="fas fa-wifi-slash"></i>
                    <h2>⚠️ غير متصل بالإنترنت</h2>
                    <p>الرجاء التحقق من اتصالك بالشبكة</p>
                    <button class="btn" onclick="location.reload()">🔄 إعادة المحاولة</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
  );
});

// الاستماع لرسائل التحديث
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});