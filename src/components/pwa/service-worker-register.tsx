'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Service Worker Registration Component
 * Registers the service worker and handles updates
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production and if service workers are supported
    if (
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      // Wait for page load to register service worker
      window.addEventListener('load', () => {
        registerServiceWorker();
      });
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              toast.info('App update available', {
                description: 'Click to refresh and get the latest version',
                action: {
                  label: 'Refresh',
                  onClick: () => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  },
                },
                duration: Infinity,
              });
            }
          });
        }
      });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker updated');
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('📦 Cache updated');
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  };

  // This component doesn't render anything
  return null;
}

