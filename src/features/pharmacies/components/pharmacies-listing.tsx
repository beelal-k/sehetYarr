'use client';

import { columns } from './pharmacies-tables/columns';
import { PharmacyTable } from './pharmacies-tables';
import { Pharmacy } from '@/types/pharmacy';
import { useEffect, useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function PharmaciesListingPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name');

  useEffect(() => {
    const fetchPharmacies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search })
        });

        const response = await fetch(`/api/pharmacies?${params}`);
        const data = await response.json();

        if (data.success) {
          setPharmacies(data.data || []);
          setTotalItems(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch pharmacies:', error);
        setPharmacies([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [page, perPage, search]);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={10} filterCount={1} />;
  }

  return (
    <PharmacyTable
      data={pharmacies}
      totalItems={totalItems}
      columns={columns}
    />
  );
}