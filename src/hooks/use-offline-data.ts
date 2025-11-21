/**
 * Offline-aware data fetching hook
 * Automatically falls back to RxDB when offline
 */

import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from './use-online-status';
import { getDatabase } from '@/lib/offline/database';

export interface UseOfflineDataOptions {
  collection: 'patients' | 'doctors' | 'appointments' | 'hospitals' | 'bills' | 'medical_records' | 'workers' | 'facilities' | 'capacity' | 'pharmacies';
  apiEndpoint: string;
  enabled?: boolean;
}

export function useOfflineData<T = any>(options: UseOfflineDataOptions) {
  const { collection, apiEndpoint, enabled = true } = options;
  const isOnline = useOnlineStatus();
  
  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isOnline) {
          // Online: Fetch from API
          console.log('[OfflineData] 🌐 Online - fetching from API:', apiEndpoint);
          
          const response = await fetch(apiEndpoint, {
            credentials: 'include', // Include cookies for Clerk authentication
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('[OfflineData] API response:', { 
            success: result.success, 
            dataLength: result.data?.length,
            hasData: !!result.data 
          });

          if (result.success) {
            setData(result.data || []);
            setTotalItems(result.pagination?.total || result.data?.length || 0);
            setIsFromCache(false);
            
            // Also cache in RxDB for offline access
            try {
              const db = await getDatabase();
              const rxCollection = db[collection];
              
              if (rxCollection && result.data?.length > 0) {
                // Bulk upsert to RxDB
                let successCount = 0;
                await Promise.all(
                  result.data.map((item: any) => {
                    // Remove Mongoose version key and internal fields
                    const { __v, ...cleanItem } = item;
                    
                    return rxCollection.upsert({
                      ...cleanItem,
                      _id: item._id || item.id,
                      updatedAt: item.updatedAt || new Date().toISOString(),
                      syncStatus: 'synced', // Mark as synced from server
                    }).then(() => {
                      successCount++;
                    }).catch((err: any) => {
                      console.warn('[OfflineData] Failed to cache item:', err);
                      // console.warn('[OfflineData] Item data:', cleanItem);
                    });
                  })
                );
                console.log(`[OfflineData] ✅ Cached ${successCount}/${result.data.length} items in RxDB`);
              }
            } catch (cacheError) {
              console.warn('[OfflineData] Failed to cache in RxDB:', cacheError);
            }
          } else {
            throw new Error(result.error || 'Failed to fetch data');
          }
        } else {
          // Offline: Load from RxDB
          console.log('[OfflineData] 📴 Offline - loading from RxDB:', collection);
          
          const db = await getDatabase();
          const rxCollection = db[collection];
          
          if (!rxCollection) {
            throw new Error(`Collection ${collection} not found in RxDB`);
          }

          const docs = await rxCollection.find().exec();
          const cachedData = docs.map((doc: any) => doc.toJSON()) as T[];
          
          setData(cachedData);
          setTotalItems(cachedData.length);
          setIsFromCache(true);
          
          console.log('[OfflineData] ✅ Loaded', cachedData.length, 'items from cache');
        }
      } catch (err: any) {
        console.error('[OfflineData] Error:', err);
        
        // If online fetch failed, try RxDB as fallback
        if (isOnline) {
          console.log('[OfflineData] ⚠️ API failed, trying RxDB fallback...');
          try {
            const db = await getDatabase();
            const rxCollection = db[collection];
            
            if (rxCollection) {
              const docs = await rxCollection.find().exec();
              const cachedData = docs.map((doc: any) => doc.toJSON()) as T[];
              
              setData(cachedData);
              setTotalItems(cachedData.length);
              setIsFromCache(true);
              setError('API unavailable - showing cached data');
              
              console.log('[OfflineData] ✅ Loaded', cachedData.length, 'items from cache (fallback)');
              return;
            }
          } catch (fallbackError) {
            console.error('[OfflineData] Fallback failed:', fallbackError);
          }
        }
        
        setError(err.message || 'Failed to load data');
        setData([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiEndpoint, collection, enabled, isOnline, refreshTrigger]);

  return {
    data,
    totalItems,
    loading,
    error,
    isFromCache,
    refresh,
    refetch: () => {
      // Trigger re-fetch by forcing a re-render
      setLoading(true);
    },
  };
}

/**
 * Fetch a single item by ID with offline support
 */
export async function getOfflineItem<T = any>(
  collection: 'patients' | 'doctors' | 'appointments' | 'hospitals' | 'bills' | 'medical_records' | 'workers' | 'facilities' | 'capacity' | 'pharmacies',
  id: string,
  apiEndpoint: string
): Promise<{ data: T | null; isFromCache: boolean; error?: string }> {
  const isOnline = navigator.onLine;

  try {
    if (isOnline) {
      // Try API first
      const response = await fetch(apiEndpoint, {
        credentials: 'include', // Include cookies for Clerk authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success) {
        // Cache in RxDB
        try {
          const db = await getDatabase();
          const rxCollection = db[collection];
          
          if (rxCollection) {
            await rxCollection.upsert({
              ...result.data,
              _id: result.data._id || id,
              updatedAt: result.data.updatedAt || new Date().toISOString(),
              syncStatus: 'synced', // Mark as synced from server
            });
          }
        } catch (cacheError) {
          console.warn('[OfflineItem] Failed to cache:', cacheError);
        }

        return { data: result.data as T, isFromCache: false };
      }
    }

    // Offline or API failed - try RxDB
    const db = await getDatabase();
    const rxCollection = db[collection];
    
    if (!rxCollection) {
      return { data: null, isFromCache: false, error: 'Collection not found' };
    }

    const doc = await rxCollection.findOne(id).exec();
    
    if (doc) {
      return { data: doc.toJSON() as T, isFromCache: true };
    }

    return { data: null, isFromCache: false, error: 'Item not found' };
  } catch (error: any) {
    console.error('[OfflineItem] Error:', error);
    return { data: null, isFromCache: false, error: error.message };
  }
}

