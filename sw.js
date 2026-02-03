
const CACHE_NAME = 'zizhi-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/db.ts',
  '/components/FileUpload.tsx',
  '/components/icons.tsx',
  '/components/QuotesView.tsx',
  '/components/SearchSidebar.tsx',
  '/components/TextSelectionPopup.tsx',
  '/components/Toast.tsx',
  '/components/TrailerView.tsx',
  '/components/SettingsView.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:wght@400;700&family=Nunito:wght@400;700&family=Roboto+Slab:wght@400;700&family=Roboto:wght@400;500;700&family=Source+Serif+Pro:wght@400;700&display=swap',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/@google/genai@^1.29.0',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache resources:', error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // CRITICAL: Ignore all Supabase requests. 
  // Letting the browser handle these directly prevents "Failed to fetch" errors caused by SW interception.
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          if (event.request.method === 'GET' && 
              !event.request.url.includes('generativelanguage') &&
              !event.request.url.startsWith('chrome-extension')) {
            await cache.put(event.request, networkResponse.clone());
          }
        }
        return networkResponse;
      } catch (error) {
        if (event.request.mode === 'navigate') {
          const indexResponse = await cache.match('/index.html');
          if (indexResponse) return indexResponse;
        }
        throw error;
      }
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
