/**
 * Offline Form Submission Utility
 * Handles form submissions with offline support via RxDB
 */

import { toast } from 'sonner';
import { getDatabase } from './database';

export interface OfflineSubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  offline?: boolean;
  synced?: boolean;
}

/**
 * Submit a form with automatic offline handling
 * - If online: submits to API normally
 * - If offline: saves to RxDB and queues for sync
 * 
 * @param collection - RxDB collection name
 * @param data - Form data to submit
 * @param options - Submission options
 */
export async function submitWithOfflineSupport(
  collection: 'patients' | 'doctors' | 'appointments' | 'hospitals' | 'bills' | 'medical_records' | 'workers' | 'facilities' | 'capacity' | 'pharmacies',
  data: any,
  options: {
    apiEndpoint: string;
    method?: 'POST' | 'PUT';
    id?: string; // For updates
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
  }
): Promise<OfflineSubmissionResult> {
  const isOnline = navigator.onLine;
  const { apiEndpoint, method = 'POST', id, onSuccess, onError } = options;

  try {
    if (isOnline) {
      // Online: Submit to API normally
      console.log('[OfflineSubmit] 🌐 Online - submitting to API:', apiEndpoint);
      
      const response = await fetch(apiEndpoint, {
        method,
        credentials: 'include', // Include cookies for Clerk authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Also cache in RxDB for offline access
        try {
          const db = await getDatabase();
          const rxCollection = db[collection];
          
          if (rxCollection) {
            const docData = {
              ...result.data,
              _id: result.data._id || result.data.id,
              updatedAt: result.data.updatedAt || new Date().toISOString(),
              syncStatus: 'synced' as const, // Mark as synced from server
            };
            
            if (method === 'PUT' && id) {
              // Update existing document
              const doc = await rxCollection.findOne(id).exec();
              if (doc) {
                await doc.update({ $set: docData });
              } else {
                await rxCollection.upsert(docData);
              }
            } else {
              // Insert new document
              await rxCollection.upsert(docData);
            }
            
            console.log('[OfflineSubmit] ✅ Also cached in RxDB');
          }
        } catch (cacheError) {
          console.warn('[OfflineSubmit] Failed to cache in RxDB:', cacheError);
          // Don't fail the submission if caching fails
        }

        // Check if there's a custom message from the API
        if (result.message && result.message.includes('already')) {
          toast.info(result.message);
        } else {
          toast.success(
            method === 'PUT' ? 'Updated successfully' : 'Created successfully'
          );
        }
        
        onSuccess?.(result);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message,
          synced: true,
        };
      } else {
        const errorMsg = result.message || result.error || 'Something went wrong';
        toast.error(errorMsg);
        onError?.(errorMsg);
        
        return {
          success: false,
          error: errorMsg,
        };
      }
    } else {
      // Offline: Save to RxDB and queue for sync
      console.log('[OfflineSubmit] 📴 Offline - saving to RxDB:', collection);
      
      const db = await getDatabase();
      const rxCollection = db[collection];
      
      if (!rxCollection) {
        throw new Error(`Collection ${collection} not found in RxDB`);
      }

      // Prepare document for RxDB
      const docId = id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docData = {
        ...data,
        _id: docId,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const, // Mark as pending sync
        _meta: {
          offline: true,
          pending: true,
          createdAt: new Date().toISOString(),
        },
      };

      // Save to RxDB
      const doc = await rxCollection.upsert(docData);
      
      toast.success('💾 Saved offline - will sync when online', {
        description: 'Your changes are saved locally and will be synced automatically when you reconnect.',
        duration: 5000,
      });

      onSuccess?.({ data: doc.toJSON() });

      return {
        success: true,
        data: doc.toJSON(),
        offline: true,
        synced: false,
      };
    }
  } catch (error: any) {
    console.error('[OfflineSubmit] Error:', error);
    
    const errorMsg = error.message || 'Failed to save';
    toast.error(errorMsg);
    onError?.(errorMsg);
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Check if there are pending offline submissions
 */
export async function getPendingSubmissions(
  collection: 'patients' | 'doctors' | 'appointments' | 'hospitals' | 'bills' | 'medical_records' | 'workers' | 'facilities' | 'capacity' | 'pharmacies'
): Promise<any[]> {
  try {
    const db = await getDatabase();
    const rxCollection = db[collection];
    
    if (!rxCollection) {
      return [];
    }

    const docs = await rxCollection
      .find({
        selector: {
          '_meta.pending': true,
        } as any, // Type assertion needed as _meta is not in schema
      })
      .exec();

    return docs.map((doc: any) => doc.toJSON());
  } catch (error) {
    console.error('[OfflineSubmit] Error getting pending submissions:', error);
    return [];
  }
}

/**
 * Get count of pending submissions across all collections
 */
export async function getPendingSubmissionsCount(): Promise<number> {
  try {
    const collections: Array<'patients' | 'doctors' | 'appointments' | 'hospitals' | 'bills' | 'medical_records' | 'workers' | 'facilities' | 'capacity' | 'pharmacies'> = [
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

    const counts = await Promise.all(
      collections.map(async (collection) => {
        const pending = await getPendingSubmissions(collection);
        return pending.length;
      })
    );

    return counts.reduce((sum, count) => sum + count, 0);
  } catch (error) {
    console.error('[OfflineSubmit] Error counting pending submissions:', error);
    return 0;
  }
}

/**
 * Clear pending flag from a document after successful sync
 */
export async function markAsSynced(
  collection: 'patients' | 'doctors' | 'appointments' | 'hospitals' | 'bills' | 'medical_records' | 'workers' | 'facilities' | 'capacity' | 'pharmacies',
  docId: string
): Promise<void> {
  try {
    const db = await getDatabase();
    const rxCollection = db[collection];
    
    if (!rxCollection) {
      return;
    }

    const doc = await rxCollection.findOne(docId).exec();
    
    if (doc) {
      await doc.update({
        $set: {
          '_meta.pending': false,
          '_meta.syncedAt': new Date().toISOString(),
        } as any, // Type assertion needed as _meta is not in schema
      });
      
      console.log('[OfflineSubmit] ✅ Marked as synced:', docId);
    }
  } catch (error) {
    console.error('[OfflineSubmit] Error marking as synced:', error);
  }
}

