'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to monitor online/offline status
 * Returns true when online, false when offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    // Event handlers
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Connection lost - Entering offline mode');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
