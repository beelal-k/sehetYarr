'use client';

import { columns } from './appointments-tables/columns';
import { AppointmentTable } from './appointments-tables';
import { Appointment } from '@/types/appointment';
import { useMemo, createContext, useContext } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useOfflineData } from '@/hooks/use-offline-data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

// Create a context for the refresh function
interface AppointmentsContextType {
  refresh: () => void;
}

const AppointmentsContext = createContext<AppointmentsContextType | null>(null);

export const useAppointmentsRefresh = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointmentsRefresh must be used within AppointmentsListingPage');
  }
  return context;
};

export default function AppointmentsListingPage() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search');
  const [status] = useQueryState('status');
  const [priority] = useQueryState('priority');

  const apiEndpoint = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(priority && { priority })
    });
    return `/api/appointments?${params}`;
  }, [page, perPage, search, status, priority]);

  const { data: appointments, totalItems, loading, isFromCache, refresh } = useOfflineData<Appointment>({
    collection: 'appointments',
    apiEndpoint,
  });

  if (loading) {
    return <DataTableSkeleton columnCount={8} rowCount={10} filterCount={2} />;
  }

  return (
    <AppointmentsContext.Provider value={{ refresh }}>
      {isFromCache && (
        <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Showing cached data. Changes will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}
      <AppointmentTable
        data={appointments}
        totalItems={totalItems}
        columns={columns}
      />
    </AppointmentsContext.Provider>
  );
}
