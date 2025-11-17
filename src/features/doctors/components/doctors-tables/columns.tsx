'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Doctor } from '@/types/doctor';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Doctor>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Doctor Name' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex space-x-2'>
          <span className='max-w-[500px] truncate font-medium'>
            {row.getValue('name')}
          </span>
        </div>
      );
    },
    meta: {
      label: 'Search by name',
      placeholder: 'Doctor name...',
      variant: 'text'
    }
  },
  {
    accessorKey: 'specialization',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Specialization' />
    ),
    cell: ({ row }) => {
      const specialization = row.getValue('specialization') as string;
      return (
        <div className='capitalize'>
          {specialization || '-'}
        </div>
      );
    },
    meta: {
      label: 'Specialization',
      placeholder: 'Filter by specialization',
      variant: 'text'
    }
  },
  {
    accessorKey: 'licenseNumber',
    header: 'License Number',
    cell: ({ row }) => {
      return (
        <div className='font-mono text-sm'>
          {row.getValue('licenseNumber')}
        </div>
      );
    }
  },
  {
    accessorKey: 'experienceYears',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Experience' />
    ),
    cell: ({ row }) => {
      const years = row.getValue('experienceYears') as number;
      return (
        <div>
          {years ? `${years} years` : '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'hospitalIds',
    header: 'Hospitals',
    cell: ({ row }) => {
      const hospitals = row.getValue('hospitalIds') as Doctor['hospitalIds'];
      if (!hospitals || hospitals.length === 0) {
        return <span className='text-muted-foreground'>-</span>;
      }
      return (
        <div className='max-w-[300px] truncate'>
          {hospitals.map(h => h.name).join(', ')}
        </div>
      );
    }
  },
  {
    accessorKey: 'contact',
    header: 'Contact',
    cell: ({ row }) => {
      const contact = row.getValue('contact') as Doctor['contact'];
      return (
        <div>
          {contact?.primaryNumber || <span className='text-muted-foreground'>-</span>}
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
