'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Worker } from '@/types/worker';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Badge } from '@/components/ui/badge';

export const getColumns = (t: any): ColumnDef<Worker>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.name')} />
    ),
    cell: ({ row }) => {
      return (
        <div className='font-medium'>
          {row.getValue('name')}
        </div>
      );
    }
  },
  {
    accessorKey: 'cnic',
    header: t('common.cnic'),
    cell: ({ row }) => {
      return <div className='whitespace-nowrap'>{row.getValue('cnic')}</div>;
    }
  },
  {
    accessorKey: 'designation',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.designation')} />
    ),
    cell: ({ row }) => {
      const designation = row.getValue('designation') as Worker['designation'];
      return (
        <Badge variant='outline'>
          {designation}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.length === 0 || value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.department')} />
    ),
    cell: ({ row }) => {
      const department = row.getValue('department') as Worker['department'];
      return <div>{department || '-'}</div>;
    }
  },
  {
    accessorKey: 'experienceYears',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.experience')} />
    ),
    cell: ({ row }) => {
      const exp = row.getValue('experienceYears') as number;
      return <div>{exp ? `${exp} ${t('common.years') || 'years'}` : '-'}</div>;
    }
  },
  {
    accessorKey: 'shift',
    header: t('common.shift'),
    cell: ({ row }) => {
      const shift = row.getValue('shift') as Worker['shift'];
      return (
        <div className='whitespace-nowrap'>
          {shift?.type || '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'hospitalIds',
    header: t('common.hospitals'),
    cell: ({ row }) => {
      const hospitals = row.getValue('hospitalIds') as Worker['hospitalIds'];
      const count = hospitals?.length || 0;
      return count > 0 ? (
        <Badge variant='outline'>{count} {t('common.hospitals') || 'hospitals'}</Badge>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    }
  },
  {
    accessorKey: 'contact',
    header: t('common.contact'),
    cell: ({ row }) => {
      const contact = row.getValue('contact') as Worker['contact'];
      return (
        <div className='whitespace-nowrap'>
          {contact?.primaryNumber || '-'}
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
