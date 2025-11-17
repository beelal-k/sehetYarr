'use client';

import { columns } from './appointments-tables/columns';
import { AppointmentTable } from './appointments-tables';
import { Appointment } from '@/types/appointment';
import { useEffect, useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function AppointmentsListingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search');
  const [status] = useQueryState('status');
  const [priority] = useQueryState('priority');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
          ...(status && { status }),
          ...(priority && { priority })
        });

        const response = await fetch(`/api/appointments?${params}`);
        const data = await response.json();

        if (data.success) {
          setAppointments(data.data || []);
          setTotalItems(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        setAppointments([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [page, perPage, search, status, priority]);

  if (loading) {
    return <DataTableSkeleton columnCount={8} rowCount={10} filterCount={2} />;
  }

  return (
    <AppointmentTable
      data={appointments}
      totalItems={totalItems}
      columns={columns}
    />
  );
}
