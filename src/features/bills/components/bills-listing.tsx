'use client';

import { getColumns } from './bills-tables/columns';
import { BillTable } from './bills-tables';
import { Bill } from '@/types/bill';
import { useMemo } from 'react';
import { useQueryState, parseAsInteger, parseAsArrayOf, parseAsStringEnum } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useOfflineData } from '@/hooks/use-offline-data';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Plus } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const statusEnum = ['Pending', 'Paid', 'Partial', 'Cancelled'];

export default function BillsListingPage() {
  const { t } = useI18n();
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search');
  const [status] = useQueryState('status', parseAsArrayOf(parseAsStringEnum(statusEnum)).withDefault([]));

  const statusStr = status.join(',');

  const apiEndpoint = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...(search && { search }),
      ...(statusStr && { status: statusStr })
    });
    return `/api/bills?${params}`;
  }, [page, perPage, search, statusStr]);

  const { data: bills, totalItems, loading, isFromCache } = useOfflineData<Bill>({
    collection: 'bills',
    apiEndpoint,
  });
  const isOnline = useOnlineStatus();

  const columns = useMemo(() => getColumns(t), [t]);

  if (loading) {
    return <DataTableSkeleton columnCount={8} rowCount={10} filterCount={1} />;
  }

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-start justify-between'>
        <Heading
          title={t('common.billing')}
          description={t('common.manage_billing')}
        />
        <Link
          href='/dashboard/bills/new'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <Plus className='mr-2 h-4 w-4' /> {t('common.create_new')}
        </Link>
      </div>
      <Separator />
      {!isOnline && isFromCache && (
        <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Showing cached data. Changes will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}
      <BillTable
        data={bills}
        totalItems={totalItems}
        columns={columns}
      />
    </div>
  );
}
