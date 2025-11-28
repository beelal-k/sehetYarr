'use client';

import { getColumns } from './patients-tables/columns';
import { PatientTable } from './patients-tables';
import { Patient } from '@/types/patient';
import { useMemo } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useOfflineData } from '@/hooks/use-offline-data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Plus } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useOfflineAuth } from '@/hooks/use-offline-auth';

export default function PatientsListingPage() {
  const { t } = useI18n();
  const { user } = useOfflineAuth();
  const role = (user?.publicMetadata?.role as string) || 'patient';
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name');
  const [gender] = useQueryState('gender');
  const [bloodGroup] = useQueryState('bloodGroup');

  const apiEndpoint = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...(search && { search }),
      ...(gender && { gender }),
      ...(bloodGroup && { bloodGroup })
    });
    return `/api/patients?${params}`;
  }, [page, perPage, search, gender, bloodGroup]);

  const { data: patients, totalItems, loading, isFromCache } = useOfflineData<Patient>({
    collection: 'patients',
    apiEndpoint,
  });

  const columns = useMemo(() => getColumns(t), [t]);

  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />;
  }

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-start justify-between'>
        <Heading
          title={t('common.patients')}
          description={t('common.manage_patient_records')}
        />
        {role !== 'patient' && (
          <Link
            href='/dashboard/patients/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <Plus className='mr-2 h-4 w-4' /> {t('common.create_new')}
          </Link>
        )}
      </div>
      <Separator />
      {isFromCache && (
        <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Showing cached data. Changes will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}
      <PatientTable
        data={patients}
        totalItems={totalItems}
        columns={columns}
      />
    </div>
  );
}
