'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { MedicalRecord } from '@/types/medical-record';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<MedicalRecord>[] = [
  {
    accessorKey: 'patientId',
    header: 'Patient',
    cell: ({ row }) => {
      const patient = row.getValue('patientId') as MedicalRecord['patientId'];
      return (
        <div className='font-medium'>
          {patient?.name || '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'doctorId',
    header: 'Doctor',
    cell: ({ row }) => {
      const doctor = row.getValue('doctorId') as MedicalRecord['doctorId'];
      return (
        <div className='font-medium'>
          {doctor?.name || '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'hospitalId',
    header: 'Hospital',
    cell: ({ row }) => {
      const hospital = row.getValue('hospitalId') as MedicalRecord['hospitalId'];
      return (
        <div className='max-w-[200px] truncate'>
          {hospital?.name || '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'visitDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Visit Date' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('visitDate') as string;
      return date ? (
        <div className='whitespace-nowrap'>
          {format(new Date(date), 'PP')}
        </div>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    }
  },
  {
    accessorKey: 'diagnosis',
    header: 'Diagnosis',
    cell: ({ row }) => {
      const diagnosis = row.getValue('diagnosis') as string;
      return (
        <div className='max-w-[300px] truncate'>
          {diagnosis || '-'}
        </div>
      );
    }
  },
  {
    accessorKey: 'prescriptions',
    header: 'Prescriptions',
    cell: ({ row }) => {
      const prescriptions = row.getValue('prescriptions') as MedicalRecord['prescriptions'];
      const count = prescriptions?.length || 0;
      return count > 0 ? (
        <Badge variant='outline'>{count} item{count !== 1 ? 's' : ''}</Badge>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    }
  },
  {
    accessorKey: 'testsOrdered',
    header: 'Tests',
    cell: ({ row }) => {
      const tests = row.getValue('testsOrdered') as MedicalRecord['testsOrdered'];
      const count = tests?.length || 0;
      return count > 0 ? (
        <Badge variant='outline'>{count} test{count !== 1 ? 's' : ''}</Badge>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
