'use client';

import { columns } from './hospitals-tables/columns';
import { HospitalTable } from './hospitals-tables';
import { Hospital } from '@/types/hospital';
import { useEffect, useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function HospitalsListingPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name');
  const [type] = useQueryState('type');
  const [ownershipType] = useQueryState('ownershipType');

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
          ...(type && { type }),
          ...(ownershipType && { ownershipType })
        });

        const response = await fetch(`/api/hospitals?${params}`);
        const data = await response.json();

        if (data.success) {
          setHospitals(data.data || []);
          setTotalItems(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
        setHospitals([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [page, perPage, search, type, ownershipType]);

  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />;
  }

  return (
    <HospitalTable
      data={hospitals}
      totalItems={totalItems}
      columns={columns}
    />
  );
}
