import { useCallback, useEffect, useState } from 'react';
import { useOnlineStatus } from './use-online-status';
import { getDatabase } from '@/lib/offline/database';
import { toast } from 'sonner';
import { getPendingSubmissions, markAsSynced } from '@/lib/offline/form-submission';

export function useSync() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCollection = useCallback(async (collectionName: string) => {
    const pendingItems = await getPendingSubmissions(collectionName as any);
    if (pendingItems.length === 0) return 0;

    console.log(`[Sync] found ${pendingItems.length} pending items in ${collectionName}`);
    let syncedCount = 0;

    const db = await getDatabase();
    const collection = db[collectionName as keyof typeof db.collections];

    for (const item of pendingItems) {
      try {
        // Determine operation type based on ID (temp IDs start with 'temp_')
        const isCreate = item._id.startsWith('temp_');
        const method = isCreate ? 'POST' : 'PUT';
        
        // Map collection name to API endpoint
        // Handle special cases if any (e.g. medical_records -> medical-records)
        const endpointName = collectionName.replace('_', '-');
        const url = isCreate 
          ? `/api/${endpointName}` 
          : `/api/${endpointName}/${item._id}`;

        // Prepare payload (remove internal fields)
        const { _id, _rev, _meta, updatedAt, createdAt, syncStatus, ...payload } = item;
        
        // For updates, we might want to preserve some fields or send partial updates
        // For now, sending full payload minus internal fields

        console.log(`[Sync] Syncing item ${item._id} to ${url} (${method})`);

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
          if (isCreate) {
            // For create: Delete temp doc and insert real doc
            const realData = result.data;
            
            // Remove the temp document
            const tempDoc = await collection.findOne(item._id).exec();
            if (tempDoc) {
              await tempDoc.remove();
            }
            
            // Insert the new document from server
            // Ensure syncStatus is 'synced'
            await collection.upsert({
              ...realData,
              syncStatus: 'synced',
              updatedAt: new Date().toISOString() // Ensure we have a fresh timestamp
            });
            
            console.log(`[Sync] Replaced temp ID ${item._id} with real ID ${realData._id}`);
          } else {
            // For update: Mark as synced
            await markAsSynced(collectionName as any, item._id);
          }
          syncedCount++;
        } else {
          console.error(`[Sync] Failed to sync item ${item._id}:`, result.error);
          // Optionally mark as failed in _meta
        }
      } catch (error) {
        console.error(`[Sync] Error syncing item ${item._id}:`, error);
      }
    }
    return syncedCount;
  }, []);

  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const collections = [
        'patients',
        'doctors',
        'appointments',
        'hospitals',
        'bills',
        'medical_records',
        'workers',
        'facilities',
        'capacity',
        'pharmacies',
      ];

      let totalSynced = 0;
      for (const col of collections) {
        totalSynced += await syncCollection(col);
      }

      if (totalSynced > 0) {
        toast.success(`Synced ${totalSynced} offline changes`);
        // Trigger a refresh of data if needed? 
        // The RxDB updates should automatically trigger UI updates if observing queries.
      }
    } catch (error) {
      console.error('[Sync] Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncCollection]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure connection is stable and DB is ready
      const timer = setTimeout(() => {
        syncAll();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncAll]);

  return {
    isSyncing,
    syncAll
  };
}

