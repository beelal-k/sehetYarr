// Service Worker for SehetYar PWA
const CACHE_VERSION = '2'; // Increment this to force cache refresh
const CACHE_NAME = `sehetyar-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `sehetyar-runtime-v${CACHE_VERSION}`;
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

  // Navigation requests (page loads) - Cache First for offline support
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached page immediately
          console.log('[ServiceWorker] ✅ Serving from cache:', url.pathname);
          
          // Update cache in background (only if online)
          if (navigator.onLine) {
            fetch(request)
              .then((networkResponse) => {
                // Only cache if it's not a redirect to auth pages
                if (networkResponse.ok && !networkResponse.url.includes('/auth/')) {
                  caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, networkResponse);
                    console.log('[ServiceWorker] 🔄 Updated cache in background:', url.pathname);
                  });
                }
              })
              .catch(() => {
                console.log('[ServiceWorker] Background update failed (offline)');
              });
          }
          
          return cachedResponse;
        }

        // Not in cache, try network
        return fetch(request)
          .then((networkResponse) => {
            // Check if response is a redirect to auth
            if (networkResponse.redirected && networkResponse.url.includes('/auth/')) {
              console.log('[ServiceWorker] ⚠️ Detected auth redirect, checking for cached version');
              
              // Try to find a cached version of the requested page
              const normalizedUrl = new URL(request.url);
              normalizedUrl.search = '';
              
              return caches.match(normalizedUrl).then((fallbackCache) => {
                if (fallbackCache) {
                  console.log('[ServiceWorker] ✅ Found cached version, serving instead of auth redirect');
                  return fallbackCache;
                }
                
                // No cached version, serve offline page instead of auth redirect
                console.log('[ServiceWorker] 📴 No cached version, serving offline page');
                return caches.match('/offline').then((offlinePage) => {
                  return offlinePage || new Response('Offline - Authentication required', {
                    status: 503,
                    statusText: 'Service Unavailable',
                  });
                });
              });
            }
            
            // Cache successful responses
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseToCache);
                console.log('[ServiceWorker] 📦 Cached new page:', url.pathname);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('[ServiceWorker] ❌ Navigation failed (possibly offline):', error.message || error);
            
            // Try to match with a normalized URL (without query params)
            const normalizedUrl = new URL(request.url);
            normalizedUrl.search = '';
            
            return caches.match(normalizedUrl).then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[ServiceWorker] ✅ Serving from cache (normalized, offline):', normalizedUrl.pathname);
                return cachedResponse;
              }
              
              // Try original request path as fallback
              return caches.match(url.pathname).then((pathCache) => {
                if (pathCache) {
                  console.log('[ServiceWorker] ✅ Serving from cache (path only):', url.pathname);
                  return pathCache;
                }
                
                // No cached version found, serve offline page
                console.log('[ServiceWorker] 📴 No cached version found, serving offline page');
                return caches.match('/offline').then((offlinePage) => {
                  return offlinePage || new Response('Offline - Page not cached', {
                    status: 503,
                    statusText: 'Service Unavailable',
                  });
                });
              });
            });
          });
      })
    );
    return;
  }

  // Other requests (JS, CSS, API) - Stale While Revalidate
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
          // Return error for non-navigation requests
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
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

  // Warm cache: Pre-cache dashboard pages for offline use
  if (event.data && event.data.type === 'WARM_CACHE') {
    const urlsToCache = event.data.urls || [];
    console.log('[ServiceWorker] 🔥 Warming cache with', urlsToCache.length, 'pages...');
    
    event.waitUntil(
      Promise.all(
        urlsToCache.map(async (url) => {
          try {
            const response = await fetch(url, {
              credentials: 'same-origin',
              mode: 'same-origin',
            });
            
            // Check if response is a redirect to auth (don't cache redirects)
            if (response.redirected && response.url.includes('/auth/')) {
              console.log('[ServiceWorker] ⚠️ Skipping auth redirect for:', url);
              return;
            }
            
            if (response.ok) {
              const cache = await caches.open(RUNTIME_CACHE);
              await cache.put(url, response);
              console.log('[ServiceWorker] ✅ Cached:', url);
            } else {
              console.log('[ServiceWorker] ⚠️ Failed to cache (status ' + response.status + '):', url);
            }
          } catch (err) {
            console.log('[ServiceWorker] ❌ Error caching:', url, err);
          }
        })
      ).then(() => {
        console.log('[ServiceWorker] 🎉 Cache warming complete!');
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
