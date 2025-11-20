// Service Worker for SehetYar PWA
const CACHE_NAME = 'sehetyar-v1';
const RUNTIME_CACHE = 'sehetyar-runtime';
const API_CACHE = 'sehetyar-api';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/offline-debug',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.log('[ServiceWorker] Precache failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // ONLY handle same-origin requests (our own domain)
  // This prevents the service worker from interfering with Clerk, Sentry, etc.
  if (url.origin !== self.location.origin) {
    // Let the browser handle external requests naturally
    return;
  }

  // Skip socket.io and real-time connections
  if (url.pathname.includes('socket.io')) {
    return;
  }
  
  // Skip Clerk paths in same origin
  if (url.pathname.includes('__clerk') || url.pathname.includes('/clerk/')) {
    return;
  }

  // API routes - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response for API calls
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Offline - No cached data available',
                offline: true 
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            );
          });
        })
    );
    return;
  }

  // Static assets (images, fonts, etc.) - Cache First strategy
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // HTML pages and other requests - Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Update cache with fresh response
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch((error) => {
          console.log('[ServiceWorker] Fetch failed:', error);
          // If we have a cached response, return it
          if (cachedResponse) {
            return cachedResponse;
          }
          // Otherwise, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline').then((offlinePage) => {
              return offlinePage || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
          }
        });

      // Return cached response immediately if available,
      // but still fetch fresh data in background
      return cachedResponse || fetchPromise;
    })
  );
});

// Message event - for commands from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/assets/images/doctor.png',
      badge: '/assets/images/doctor.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || '1',
      },
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'SehetYar', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

console.log('[ServiceWorker] Loaded');
