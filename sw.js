const CACHE_NAME = 'zizhi-cache-v1';
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
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/@google/genai@^1.29.0',
  'https://aistudiocdn.com/react@^19.2.0',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll with a catch to prevent install failure if one resource fails
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache one or more resources:', error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try the cache first.
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If it's not in the cache, try the network.
      try {
        const networkResponse = await fetch(event.request);

        // If the network request is successful, cache it and return it.
        if (networkResponse.ok) {
          // We don't cache POST requests or Gemini API calls
          if (event.request.method === 'GET' && !event.request.url.includes('generativelanguage')) {
            await cache.put(event.request, networkResponse.clone());
          }
        }
        return networkResponse;
      } catch (error) {
        // The network failed.
        // For navigation requests, serve the main app shell from the cache.
        if (event.request.mode === 'navigate') {
          const indexResponse = await cache.match('/index.html');
          if (indexResponse) return indexResponse;
        }
        // For other requests, we can't do anything, so let the error propagate.
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
    })
  );
});