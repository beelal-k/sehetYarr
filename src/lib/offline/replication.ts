'use client';

import { RxCollection } from 'rxdb';
import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';
import { firstValueFrom } from 'rxjs';
import type { SehetYarrDatabase } from './database';

interface ReplicationConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

interface SyncCheckpoint {
  collection: string;
  lastSync: string;
  checkpoint: any;
}

// Store sync checkpoints in localStorage
const CHECKPOINT_KEY = 'rxdb_sync_checkpoints';

function getCheckpoint(collectionName: string): any {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(CHECKPOINT_KEY);
  if (!stored) return null;
  
  const checkpoints = JSON.parse(stored) as SyncCheckpoint[];
  const found = checkpoints.find(c => c.collection === collectionName);
  return found?.checkpoint || null;
}

function saveCheckpoint(collectionName: string, checkpoint: any): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(CHECKPOINT_KEY);
  const checkpoints: SyncCheckpoint[] = stored ? JSON.parse(stored) : [];
  
  const index = checkpoints.findIndex(c => c.collection === collectionName);
  const newCheckpoint: SyncCheckpoint = {
    collection: collectionName,
    lastSync: new Date().toISOString(),
    checkpoint
  };
  
  if (index >= 0) {
    checkpoints[index] = newCheckpoint;
  } else {
    checkpoints.push(newCheckpoint);
  }
  
  localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoints));
}

/**
 * Setup replication for a collection
 */
function setupCollectionReplication<T>(
  collection: RxCollection<T>,
  config: ReplicationConfig
): RxReplicationState<T, any> {
  const collectionName = collection.name;
  const apiEndpoint = `${config.baseUrl}/api/${collectionName}`;
  
  console.log(`🔄 Setting up replication for ${collectionName}...`);

  const replicationState = replicateRxCollection<T, any>({
    collection,
    replicationIdentifier: `${collectionName}-replication`,
    live: true, // Continuous sync when online
    retryTime: 5000, // Retry failed syncs every 5 seconds
    autoStart: true,
    
    // Pull from server (download)
    pull: {
      handler: async (checkpointOrNull, batchSize) => {
        const checkpoint = checkpointOrNull || getCheckpoint(collectionName);
        const since = checkpoint?.updatedAt || new Date(0).toISOString();
        
        try {
          const response = await fetch(
            `${apiEndpoint}?since=${since}&limit=${batchSize}`,
            {
              headers: config.headers || {},
              credentials: 'include'
            }
          );
          
          if (!response.ok) {
            throw new Error(`Pull failed: ${response.statusText}`);
          }
          
          const data = await response.json();
          const documents = data.data || [];
          
          // Transform documents to include syncStatus
          const transformedDocs = documents.map((doc: any) => ({
            ...doc,
            _id: doc._id.toString(),
            syncStatus: 'synced' as const,
            createdAt: doc.createdAt || new Date().toISOString(),
            updatedAt: doc.updatedAt || new Date().toISOString()
          }));
          
          // Calculate new checkpoint
          const newCheckpoint = transformedDocs.length > 0
            ? {
                updatedAt: transformedDocs[transformedDocs.length - 1].updatedAt,
                count: transformedDocs.length
              }
            : checkpoint;
          
          if (newCheckpoint) {
            saveCheckpoint(collectionName, newCheckpoint);
          }
          
          return {
            documents: transformedDocs,
            checkpoint: newCheckpoint
          };
        } catch (error) {
          console.error(`❌ Pull error for ${collectionName}:`, error);
          throw error;
        }
      },
      batchSize: 50,
      modifier: (doc) => doc // Optional: modify documents before storing
    },
    
    // Push to server (upload)
    push: {
      handler: async (docs) => {
        // Only push documents that need syncing
        const docsToSync = docs.filter(doc => 
          (doc as any).syncStatus === 'pending' || (doc as any).syncStatus === 'failed'
        );
        
        if (docsToSync.length === 0) {
          return [];
        }
        
        try {
          const response = await fetch(`${apiEndpoint}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.headers || {})
            },
            credentials: 'include',
            body: JSON.stringify({ documents: docsToSync })
          });
          
          if (!response.ok) {
            throw new Error(`Push failed: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Mark synced documents
          for (const doc of docsToSync) {
            const rxDoc = await collection.findOne((doc as any)._id).exec();
            if (rxDoc) {
              await rxDoc.patch({ syncStatus: 'synced' } as any);
            }
          }
          
          console.log(`✅ Pushed ${docsToSync.length} ${collectionName} to server`);
          return [];
        } catch (error) {
          console.error(`❌ Push error for ${collectionName}:`, error);
          
          // Mark as failed
          for (const doc of docsToSync) {
            const rxDoc = await collection.findOne((doc as any)._id).exec();
            if (rxDoc) {
              await rxDoc.patch({ syncStatus: 'failed' } as any);
            }
          }
          
          throw error;
        }
      },
      batchSize: 20,
      modifier: (doc) => doc
    }
  });

  // Monitor replication status
  replicationState.active$.subscribe(active => {
    if (active) {
      console.log(`🔄 ${collectionName}: Syncing...`);
    }
  });

  replicationState.error$.subscribe(error => {
    console.error(`❌ ${collectionName} replication error:`, error);
  });

  return replicationState;
}

/**
 * Setup replication for all collections
 */
export async function setupReplication(
  db: SehetYarrDatabase,
  config: ReplicationConfig
): Promise<Map<string, RxReplicationState<any, any>>> {
  const replicationStates = new Map<string, RxReplicationState<any, any>>();

  console.log('🚀 Setting up replication for all collections...');

  // Setup replication for each collection
  const collections = [
    'patients',
    'doctors',
    'appointments',
    'hospitals',
    'bills',
    'medical_records'
  ];

  for (const collectionName of collections) {
    const collection = (db as any)[collectionName];
    if (collection) {
      const state = setupCollectionReplication(collection, config);
      replicationStates.set(collectionName, state);
    }
  }

  console.log('✅ Replication setup complete!');
  return replicationStates;
}

/**
 * Stop all replication
 */
export async function stopReplication(
  replicationStates: Map<string, RxReplicationState<any, any>>
): Promise<void> {
  console.log('🛑 Stopping replication...');
  
  for (const [name, state] of replicationStates.entries()) {
    await state.cancel();
    console.log(`✅ Stopped replication for ${name}`);
  }
  
  replicationStates.clear();
}

/**
 * Manually trigger sync for all collections
 */
export async function triggerManualSync(
  replicationStates: Map<string, RxReplicationState<any, any>>
): Promise<void> {
  console.log('🔄 Manual sync triggered...');
  
  for (const [name, state] of replicationStates.entries()) {
    await state.reSync();
    console.log(`✅ Re-synced ${name}`);
  }
}

/**
 * Get sync status for all collections
 * Note: This returns a promise since we need to get values from observables
 */
export async function getSyncStatus(
  replicationStates: Map<string, RxReplicationState<any, any>>
): Promise<{ [key: string]: { active: boolean; error: any } }> {
  const status: { [key: string]: { active: boolean; error: any } } = {};
  
  const statusPromises = Array.from(replicationStates.entries()).map(
    async ([name, state]) => {
      try {
        // Use firstValueFrom to get current value from observables
        const active = await firstValueFrom(state.active$);
        const error = await firstValueFrom(state.error$);
        
        return { name, active, error };
      } catch (err) {
        // If observable hasn't emitted yet, use defaults
        return { name, active: false, error: null };
      }
    }
  );
  
  const results = await Promise.all(statusPromises);
  results.forEach(({ name, active, error }) => {
    status[name] = { active, error };
  });
  
  return status;
}
