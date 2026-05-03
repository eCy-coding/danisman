const CACHE_NAME = 'sovereign-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Sovereign Vault...');
  // @ts-ignore
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // @ts-ignore
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated.');
  // @ts-ignore
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // @ts-ignore
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  const request = event.request;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Skip browser extensions or non-http
  if (!request.url.startsWith('http')) return;

  // Strategy: Stale-While-Revalidate
  // Serve from cache immediately, then update cache from network
  // @ts-ignore
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Update cache if valid response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
            });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails (Offline), we just rely on what we returned (cachedResponse)
        // If no cachedResponse, maybe return fallback?
      });

      // Return cached response if found, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
