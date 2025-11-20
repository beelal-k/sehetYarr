'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase, type SehetYarrDatabase } from './database';

interface RxDBContextValue {
  db: SehetYarrDatabase | null;
  isLoading: boolean;
  error: Error | null;
}

const RxDBContext = createContext<RxDBContextValue>({
  db: null,
  isLoading: true,
  error: null
});

export function RxDBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SehetYarrDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initDatabase() {
      try {
        console.log('🚀 Initializing RxDB...');
        const database = await getDatabase();
        
        if (isMounted) {
          setDb(database);
          setIsLoading(false);
          console.log('✅ RxDB initialized successfully');
        }
      } catch (err) {
        console.error('❌ Failed to initialize RxDB:', err);
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    }

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <RxDBContext.Provider value={{ db, isLoading, error }}>
      {children}
    </RxDBContext.Provider>
  );
}

/**
 * Hook to access RxDB database instance
 */
export function useRxDB() {
  const context = useContext(RxDBContext);
  
  if (context === undefined) {
    throw new Error('useRxDB must be used within RxDBProvider');
  }

  return context;
}

/**
 * Hook to access patients collection
 */
export function usePatients() {
  const { db } = useRxDB();
  return db?.patients;
}

/**
 * Hook to access doctors collection
 */
export function useDoctors() {
  const { db } = useRxDB();
  return db?.doctors;
}

/**
 * Hook to access appointments collection
 */
export function useAppointments() {
  const { db } = useRxDB();
  return db?.appointments;
}

/**
 * Hook to access hospitals collection
 */
export function useHospitals() {
  const { db } = useRxDB();
  return db?.hospitals;
}

/**
 * Hook to access bills collection
 */
export function useBills() {
  const { db } = useRxDB();
  return db?.bills;
}

/**
 * Hook to access medical records collection
 */
export function useMedicalRecords() {
  const { db } = useRxDB();
  return db?.medical_records;
}
