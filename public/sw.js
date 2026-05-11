const CACHE_NAME = 'zizhi-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (event.request.method !== 'GET' || url.hostname.includes('googleapis.com') || url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const contentType = response.headers.get('content-type');
        const isHTML = contentType && contentType.includes('text/html');
        const isAssetRequest = url.pathname.endsWith('.svg') || url.pathname.endsWith('.json') || url.pathname.endsWith('.js');

        if (isAssetRequest && isHTML) {
          return response;
        }

        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
