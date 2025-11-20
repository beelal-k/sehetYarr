'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Wifi, WifiOff, Database, HardDrive } from 'lucide-react';

export default function OfflineDebugPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [swStatus, setSwStatus] = useState<'none' | 'registered' | 'activated'>('none');
  const [caches, setCaches] = useState<string[]>([]);
  const [indexedDBs, setIndexedDBs] = useState<string[]>([]);
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => {
    // Online/offline status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check service worker
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) {
            const active = regs.some(reg => reg.active);
            setSwStatus(active ? 'activated' : 'registered');
          }
        } catch (error) {
          console.error('Error checking service worker:', error);
        }
      }
    };

    // Check caches
    const checkCaches = async () => {
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          setCaches(cacheKeys);
          
          // Estimate cache size
          const sizePromises = cacheKeys.map(async (key) => {
            const cache = await window.caches.open(key);
            const requests = await cache.keys();
            return requests.length;
          });
          
          const sizes = await Promise.all(sizePromises);
          setCacheSize(sizes.reduce((a, b) => a + b, 0));
        } catch (error) {
          console.error('Error checking caches:', error);
        }
      }
    };

    // Check IndexedDB
    const checkIndexedDB = async () => {
      if (typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB.databases) {
        try {
          const dbs = await window.indexedDB.databases();
          setIndexedDBs(dbs.map(db => db.name || 'unknown'));
        } catch (error) {
          console.error('Error checking IndexedDB:', error);
        }
      }
    };

    checkServiceWorker();
    checkCaches();
    checkIndexedDB();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearAllCaches = async () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await window.caches.keys();
        await Promise.all(keys.map(key => window.caches.delete(key)));
        setCaches([]);
        setCacheSize(0);
        alert('All caches cleared!');
      } catch (error) {
        console.error('Error clearing caches:', error);
        alert('Failed to clear caches');
      }
    }
  };

  const unregisterSW = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
      setSwStatus('none');
      alert('Service worker unregistered!');
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offline Mode Debugger</h1>
          <p className="text-muted-foreground">Monitor PWA offline capabilities</p>
        </div>
        <Button onClick={reloadPage}>Refresh Status</Button>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={isOnline ? 'default' : 'destructive'} className="text-lg py-2 px-4">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {isOnline 
                ? 'You are connected to the internet' 
                : 'You are in offline mode. Cached content should still be accessible.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {swStatus === 'activated' ? (
              <CheckCircle2 className="text-green-500" />
            ) : (
              <XCircle className="text-red-500" />
            )}
            Service Worker
          </CardTitle>
          <CardDescription>
            Service workers enable offline functionality and caching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={swStatus === 'activated' ? 'default' : 'destructive'}>
              {swStatus === 'none' && 'Not Registered'}
              {swStatus === 'registered' && 'Registered'}
              {swStatus === 'activated' && 'Activated & Running'}
            </Badge>
          </div>
          
          {swStatus === 'none' && (
            <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <p className="font-semibold">⚠️ Service Worker Not Found</p>
              <p className="text-sm mt-2">This usually means:</p>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                <li>You&apos;re running in development mode (SW only works in production)</li>
                <li>First page load - refresh to register</li>
                <li>Build failed - check console for errors</li>
              </ul>
              <p className="text-sm mt-2 font-semibold">
                Solution: Run <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">pnpm build && pnpm start</code>
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                ℹ️ Using native Next.js PWA support (no third-party packages)
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={unregisterSW} variant="destructive" size="sm">
              Unregister SW
            </Button>
            <Button onClick={reloadPage} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="text-blue-500" />
            Cache Storage
          </CardTitle>
          <CardDescription>
            Static assets and API responses cached for offline use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={caches.length > 0 ? 'default' : 'secondary'}>
              {caches.length} Cache{caches.length !== 1 ? 's' : ''} ({cacheSize} items)
            </Badge>
          </div>

          {caches.length > 0 ? (
            <div className="space-y-2">
              {caches.map(cache => (
                <div key={cache} className="p-3 bg-muted rounded-lg">
                  <code className="text-xs">{cache}</code>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No caches found. Visit some pages while online to populate cache.
            </p>
          )}

          <Button onClick={clearAllCaches} variant="destructive" size="sm">
            Clear All Caches
          </Button>
        </CardContent>
      </Card>

      {/* IndexedDB (RxDB) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="text-purple-500" />
            IndexedDB (RxDB)
          </CardTitle>
          <CardDescription>
            Local database for offline data storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={indexedDBs.length > 0 ? 'default' : 'secondary'}>
              {indexedDBs.length} Database{indexedDBs.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {indexedDBs.length > 0 ? (
            <div className="space-y-2">
              {indexedDBs.map(db => (
                <div key={db} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <code className="text-xs">{db}</code>
                  {db === 'sehetyarr_offline_db' && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No databases found. RxDB will initialize on first use.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Open DevTools → Application → IndexedDB to inspect database contents
          </p>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
          <CardDescription>Follow these steps to test offline mode</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li className="font-semibold">
              Build for production: <code className="bg-muted px-2 py-1 rounded ml-2">pnpm build && pnpm start</code>
            </li>
            <li>Visit this page and verify service worker is <Badge variant="default">Activated</Badge></li>
            <li>Navigate to data pages (patients, appointments, hospitals) while <Badge>ONLINE</Badge></li>
            <li>Verify cache storage shows multiple caches with items</li>
            <li>Open DevTools → Network tab → Check &quot;Offline&quot;</li>
            <li>Refresh the page - it should still load</li>
            <li>Navigate between pages - they should work offline</li>
            <li>Check data pages - RxDB data should display</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

