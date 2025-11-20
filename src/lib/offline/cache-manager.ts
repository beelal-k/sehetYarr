'use client';

import type { SehetYarrDatabase } from './database';

interface CacheConfig {
  baseUrl: string;
  userId: string;
  userRole: string;
  hospitalId?: string;
  doctorId?: string;
  patientId?: string;
}

/**
 * Cache manager for role-based data preloading
 */
export class CacheManager {
  private db: SehetYarrDatabase;
  private config: CacheConfig;
  private isCaching = false;

  constructor(db: SehetYarrDatabase, config: CacheConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * Pre-load data based on user role
   */
  async warmCache(): Promise<void> {
    if (this.isCaching) {
      console.log('⏳ Cache warming already in progress...');
      return;
    }

    this.isCaching = true;
    console.log(`🔥 Warming cache for ${this.config.userRole} user...`);

    try {
      switch (this.config.userRole) {
        case 'admin':
          await this.cacheAdminData();
          break;
        case 'hospital':
          await this.cacheHospitalData();
          break;
        case 'doctor':
          await this.cacheDoctorData();
          break;
        case 'patient':
          await this.cachePatientData();
          break;
        default:
          console.log('❓ Unknown role, skipping cache warming');
      }

      console.log('✅ Cache warming complete!');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      throw error;
    } finally {
      this.isCaching = false;
    }
  }

  /**
   * Admin users: Cache ALL data
   */
  private async cacheAdminData(): Promise<void> {
    console.log('👑 Caching all data for admin...');

    await Promise.all([
      this.fetchAndCacheCollection('patients'),
      this.fetchAndCacheCollection('doctors'),
      this.fetchAndCacheCollection('appointments'),
      this.fetchAndCacheCollection('hospitals'),
      this.fetchAndCacheCollection('bills'),
      this.fetchAndCacheCollection('medical_records')
    ]);
  }

  /**
   * Hospital users: Cache facility-specific data
   */
  private async cacheHospitalData(): Promise<void> {
    console.log('🏥 Caching hospital data...');

    if (!this.config.hospitalId) {
      console.warn('⚠️ No hospitalId provided for hospital user');
      return;
    }

    await Promise.all([
      // Cache own hospital
      this.fetchAndCacheCollection('hospitals', { _id: this.config.hospitalId }),
      // Cache linked patients
      this.fetchAndCacheCollection('patients', { hospitalId: this.config.hospitalId }),
      // Cache affiliated doctors
      this.fetchAndCacheCollection('doctors', { hospitalIds: this.config.hospitalId }),
      // Cache facility appointments
      this.fetchAndCacheCollection('appointments', { hospitalId: this.config.hospitalId }),
      // Cache facility bills
      this.fetchAndCacheCollection('bills', { hospitalId: this.config.hospitalId }),
      // Cache medical records
      this.fetchAndCacheCollection('medical_records', { hospitalId: this.config.hospitalId })
    ]);
  }

  /**
   * Doctor users: Cache doctor-specific data
   */
  private async cacheDoctorData(): Promise<void> {
    console.log('👨‍⚕️ Caching doctor data...');

    if (!this.config.doctorId) {
      console.warn('⚠️ No doctorId provided for doctor user');
      return;
    }

    await Promise.all([
      // Cache own profile
      this.fetchAndCacheCollection('doctors', { _id: this.config.doctorId }),
      // Cache affiliated hospitals
      this.fetchAndCacheCollection('hospitals'),
      // Cache own appointments
      this.fetchAndCacheCollection('appointments', { doctorId: this.config.doctorId }),
      // Cache patients from appointments
      this.fetchAndCacheCollection('patients', { doctorId: this.config.doctorId }),
      // Cache medical records
      this.fetchAndCacheCollection('medical_records', { doctorId: this.config.doctorId })
    ]);
  }

  /**
   * Patient users: Cache own data only
   */
  private async cachePatientData(): Promise<void> {
    console.log('🧑‍🤝‍🧑 Caching patient data...');

    if (!this.config.patientId) {
      console.warn('⚠️ No patientId provided for patient user');
      return;
    }

    await Promise.all([
      // Cache own profile
      this.fetchAndCacheCollection('patients', { _id: this.config.patientId }),
      // Cache own appointments
      this.fetchAndCacheCollection('appointments', { patientId: this.config.patientId }),
      // Cache own medical records
      this.fetchAndCacheCollection('medical_records', { patientId: this.config.patientId }),
      // Cache own bills
      this.fetchAndCacheCollection('bills', { patientId: this.config.patientId }),
      // Cache all hospitals (for finding care)
      this.fetchAndCacheCollection('hospitals'),
      // Cache all doctors (for booking appointments)
      this.fetchAndCacheCollection('doctors')
    ]);
  }

  /**
   * Fetch data from API and cache in RxDB
   */
  private async fetchAndCacheCollection(
    collectionName: string,
    filters?: Record<string, any>
  ): Promise<void> {
    try {
      const collection = (this.db as any)[collectionName];
      if (!collection) {
        console.warn(`⚠️ Collection ${collectionName} not found`);
        return;
      }

      // Build query params
      const params = new URLSearchParams({
        limit: '10000', // Get all data
        ...(filters || {})
      });

      const response = await fetch(
        `${this.config.baseUrl}/api/${collectionName}?${params}`,
        {
          credentials: 'include',
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${collectionName}: ${response.statusText}`);
      }

      const data = await response.json();
      const documents = data.data || [];

      console.log(`📥 Caching ${documents.length} ${collectionName}...`);

      // Batch insert/upsert documents
      for (const doc of documents) {
        const transformedDoc = {
          ...doc,
          _id: doc._id.toString(),
          syncStatus: 'synced' as const,
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString()
        };

        try {
          // Try to find existing document
          const existing = await collection.findOne(transformedDoc._id).exec();
          
          if (existing) {
            // Update if server version is newer
            const existingTime = new Date(existing.updatedAt).getTime();
            const newTime = new Date(transformedDoc.updatedAt).getTime();
            
            if (newTime > existingTime) {
              await existing.patch(transformedDoc);
            }
          } else {
            // Insert new document
            await collection.insert(transformedDoc);
          }
        } catch (error) {
          // Ignore duplicate key errors
          if (!(error as any).message?.includes('already exists')) {
            console.error(`Error caching document in ${collectionName}:`, error);
          }
        }
      }

      console.log(`✅ Cached ${documents.length} ${collectionName}`);
    } catch (error) {
      console.error(`❌ Failed to cache ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    console.log('🗑️ Clearing all cached data...');

    const collections = [
      'patients',
      'doctors',
      'appointments',
      'hospitals',
      'bills',
      'medical_records'
    ];

    for (const collectionName of collections) {
      const collection = (this.db as any)[collectionName];
      if (collection) {
        await collection.remove();
        console.log(`✅ Cleared ${collectionName}`);
      }
    }

    console.log('✅ Cache cleared!');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    const collections = [
      'patients',
      'doctors',
      'appointments',
      'hospitals',
      'bills',
      'medical_records'
    ];

    for (const collectionName of collections) {
      const collection = (this.db as any)[collectionName];
      if (collection) {
        const count = await collection.count().exec();
        stats[collectionName] = count;
      }
    }

    return stats;
  }
}

/**
 * Create cache manager instance
 */
export function createCacheManager(
  db: SehetYarrDatabase,
  config: CacheConfig
): CacheManager {
  return new CacheManager(db, config);
}
