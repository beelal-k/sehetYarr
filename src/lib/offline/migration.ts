/**
 * Database Migration Utilities
 * Handles schema changes and version upgrades for RxDB
 */

import { removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

/**
 * Clear the entire RxDB database
 * Use this when schema changes are incompatible with existing data
 */
export async function clearRxDatabase(dbName: string): Promise<void> {
  try {
    console.log('🔄 Clearing old RxDB database...');
    
    await removeRxDatabase(dbName, getRxStorageDexie());
    
    console.log('✅ Old database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    // If removeRxDatabase fails, manually clear IndexedDB
    await clearIndexedDB(dbName);
  }
}

/**
 * Manually clear IndexedDB as fallback
 */
async function clearIndexedDB(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    
    request.onsuccess = () => {
      console.log('✅ IndexedDB cleared manually');
      resolve();
    };
    
    request.onerror = () => {
      console.error('Failed to clear IndexedDB');
      reject(request.error);
    };
    
    request.onblocked = () => {
      console.warn('Database deletion blocked - close other tabs');
    };
  });
}

/**
 * Check if database needs migration
 * Returns true if DB6 error (schema mismatch) is detected
 */
export function needsMigration(error: any): boolean {
  return (
    error?.code === 'DB6' ||
    error?.message?.includes('different schema') ||
    error?.parameters?.schemaHash !== error?.parameters?.previousSchemaHash
  );
}
