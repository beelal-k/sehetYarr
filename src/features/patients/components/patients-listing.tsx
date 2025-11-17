'use client';

import { columns } from './patients-tables/columns';
import { PatientTable } from './patients-tables';
import { Patient } from '@/types/patient';
import { useEffect, useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function PatientsListingPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name');
  const [gender] = useQueryState('gender');
  const [bloodGroup] = useQueryState('bloodGroup');

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
          ...(gender && { gender }),
          ...(bloodGroup && { bloodGroup })
        });

        const response = await fetch(`/api/patients?${params}`);
        const data = await response.json();

        if (data.success) {
          setPatients(data.data || []);
          setTotalItems(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        setPatients([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [page, perPage, search, gender, bloodGroup]);

  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />;
  }

  return (
    <PatientTable
      data={patients}
      totalItems={totalItems}
      columns={columns}
    />
  );
}
