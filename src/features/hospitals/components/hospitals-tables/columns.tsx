'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Hospital } from '@/types/hospital';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { IconBuilding, IconBuildingCommunity } from '@tabler/icons-react';

const HOSPITAL_TYPE_OPTIONS = [
  { label: 'Hospital', value: 'hospital' },
  { label: 'Clinic', value: 'clinic' },
  { label: 'Dispensary', value: 'dispensary' },
  { label: 'NGO', value: 'ngo' },
  { label: 'Other', value: 'other' }
];

const OWNERSHIP_TYPE_OPTIONS = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Semi-Government', value: 'semi-government' },
  { label: 'NGO', value: 'ngo' }
];

export const columns: ColumnDef<Hospital>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Hospital Name' />
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
      placeholder: 'Hospital name...',
      variant: 'text'
    }
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className='capitalize'>
          {type}
        </div>
      );
    },
    meta: {
      label: 'Type',
      placeholder: 'Filter by type',
      variant: 'multiSelect',
      options: HOSPITAL_TYPE_OPTIONS
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'ownershipType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ownership' />
    ),
    cell: ({ row }) => {
      const ownership = row.getValue('ownershipType') as string;
      return (
        <div className='capitalize'>
          {ownership.replace('-', ' ')}
        </div>
      );
    },
    meta: {
      label: 'Ownership Type',
      placeholder: 'Filter by ownership',
      variant: 'multiSelect',
      options: OWNERSHIP_TYPE_OPTIONS
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const location = row.getValue('location') as Hospital['location'];
      if (!location) return <span className='text-muted-foreground'>-</span>;
      
      const parts = [location.area, location.city, location.country].filter(Boolean);
      return (
        <div className='max-w-[300px] truncate'>
          {parts.join(', ') || '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'contact',
    header: 'Contact',
    cell: ({ row }) => {
      const contact = row.getValue('contact') as Hospital['contact'];
      return (
        <div>
          {contact?.primaryNumber || <span className='text-muted-foreground'>-</span>}
        </div>
      );
    }
  },
  {
    accessorKey: 'registrationNumber',
    header: 'Registration No',
    cell: ({ row }) => {
      return (
        <div className='font-mono text-sm'>
          {row.getValue('registrationNumber')}
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
