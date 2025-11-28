'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Patient } from '@/types/patient';
import { IconEdit, IconDotsVertical, IconTrash, IconFileDescription } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PatientSummaryModal } from '../patient-summary-modal';
import { useI18n } from '@/providers/i18n-provider';
import { useOfflineAuth } from '@/hooks/use-offline-auth';

interface CellActionProps {
  data: Patient;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useOfflineAuth();
  const role = (user?.publicMetadata?.role as string) || 'patient';

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${data._id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Patient deleted successfully');
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to delete patient');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title={t('common.delete') + '?'}
        description="Are you sure you want to delete this patient?"
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
      <PatientSummaryModal 
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        patient={data}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t('common.actions')}</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => setShowSummary(true)}
          >
            <IconFileDescription className="mr-2 h-4 w-4" /> {t('common.view')}
          </DropdownMenuItem>
          {role !== 'patient' && (
            <>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/patients/${data._id}`)}
              >
                <IconEdit className='mr-2 h-4 w-4' /> {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <IconTrash className='mr-2 h-4 w-4' /> {t('common.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
