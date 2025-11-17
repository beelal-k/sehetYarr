'use client';

import { columns } from './doctors-tables/columns';
import { DoctorTable } from './doctors-tables';
import { Doctor } from '@/types/doctor';
import { useEffect, useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function DoctorsListingPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name');
  const [specialization] = useQueryState('specialization');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
          ...(specialization && { specialization })
        });

        const response = await fetch(`/api/doctors?${params}`);
        const data = await response.json();

        if (data.success) {
          setDoctors(data.data || []);
          setTotalItems(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        setDoctors([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [page, perPage, search, specialization]);

  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />;
  }

  return (
    <DoctorTable
      data={doctors}
      totalItems={totalItems}
      columns={columns}
    />
  );
}
