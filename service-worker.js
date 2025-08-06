const CACHE_NAME = 'binance-web3-cache-v2'; // update version on deploy
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
  'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'
];

// Install - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.error('Failed to cache assets:', err))
  );
  self.skipWaiting(); // activate SW immediately
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // take control of clients
});

// Fetch - differentiate between API and static requests
self.addEventListener('fetch', event => {
  const request = event.request;

  // Network-first for API calls
  if (request.url.includes('/api/') || request.url.includes('ethers') || request.url.includes('binance')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Optional: cache successful API responses
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(request)) // fallback to cache if offline
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
