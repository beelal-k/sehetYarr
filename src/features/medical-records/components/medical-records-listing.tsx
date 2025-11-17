'use client';

import { columns } from './medical-records-tables/columns';
import { MedicalRecordTable } from './medical-records-tables';
import { MedicalRecord } from '@/types/medical-record';
import { useEffect, useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function MedicalRecordsListingPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search');

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search })
        });

        const response = await fetch(`/api/medical-records?${params}`);
        const data = await response.json();

        if (data.success) {
          setMedicalRecords(data.data || []);
          setTotalItems(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch medical records:', error);
        setMedicalRecords([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalRecords();
  }, [page, perPage, search]);

  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} filterCount={1} />;
  }

  return (
    <MedicalRecordTable
      data={medicalRecords}
      totalItems={totalItems}
      columns={columns}
    />
  );
}
