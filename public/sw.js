// JarBees Motion Service Worker Shim
// Cleans up legacy assistant caches and delegates to Workbox bundle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.includes('jarbees-image-cache-v1') || k.includes('jarbees-api-cache-v1'))
          .map((k) => {
            console.log('[SW] Deleting obsolete legacy cache:', k);
            return caches.delete(k);
          })
      );
    })
  );
});

importScripts('./sw-workbox.js');
