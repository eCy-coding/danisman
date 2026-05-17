// P44 EMERGENCY: Self-destroying Service Worker.
//
// The previous SW (sovereign-cache-v1) precached lp.js/lc.js with an incorrect
// MIME type (text/plain) inherited from Vercel's edge cache. Browsers that
// already installed it intercepted every dynamic import('/assets/lp.js') and
// served the broken cached copy, which crashed the React app into the
// ErrorBoundary ("Hizmet Kesintisi").
//
// This SW installs immediately, deletes every cache it owns on activate,
// unregisters itself, and reloads any controlled clients so they re-fetch
// fresh assets straight from the CDN.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (_err) {}
      try {
        const list = await self.clients.matchAll({ type: 'window' });
        await self.registration.unregister();
        for (const c of list) {
          try { c.navigate(c.url); } catch (_err) {}
        }
      } catch (_err) {}
    })()
  );
});

// Identity passthrough — never intercept.
self.addEventListener('fetch', () => {});
