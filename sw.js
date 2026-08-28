// sw.js - Service Worker محدث بالكامل

const CACHE_NAME = 'equipment-quotation-v10';  // ⬅️ إصدار جديد
const ASSETS_TO_CACHE = [
  'index.html',
  'quotation.html',
  'company.html',
  'design.html',
  'reports.html',
  'activation.html',
  'onboarding.html',
  'help.html',
  'settings.html',
  'changelog.html',
  'sirkat.html',
  'manifest.json',
  'css/main.css',
  'css/index.css',
  'css/quotation.css',
  'css/company.css',
  'css/design.css',
  'css/reports.css',
  'css/activation.css',
  'css/onboarding.css',
  'css/help.css',
  'css/sirkat.css',
  'css/changelog.css',
  'js/main.js',
  'js/index.js',
  'js/quotation.js',
  'js/company.js',
  'js/design.js',
  'js/reports.js',
  'js/activation.js',
  'js/onboarding.js',
  'js/help.js',
  'js/settings.js',
  'js/changelog.js',
  'js/sirkat.js',
  'js/license.js',
  'js/firebase.js'
];

// ====== التثبيت ======
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

// ====== التنشيط ======
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

// ====== التعامل مع الطلبات ======
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // ❌ تجاهل طلبات POST (مش بنخزنها)
  if (request.method === 'POST') {
    return;
  }
  
  // ❌ تجاهل طلبات التحليلات
  if (request.url.includes('analytics') || request.url.includes('tracking')) {
    return;
  }
  
  // ❌ تجاهل طلبات Firebase (لتجنب الأخطاء)
  if (request.url.includes('firebase') || request.url.includes('googleapis')) {
    event.respondWith(fetch(request));
    return;
  }

  // ✅ الموارد الخارجية (CDN)
  if (request.url.includes('cdnjs') || request.url.includes('cdn.jsdelivr')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
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
            });
        })
    );
    return;
  }

  // ✅ الملفات الرئيسية - Network First
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && request.method === 'GET') {
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
            // صفحة الخطأ عند عدم الاتصال
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

// ====== الاستماع لرسائل التحديث ======
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker v10 تم تفعيله');