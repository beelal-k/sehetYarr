'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { BillingModal, BillingFormData } from '@/components/modal/billing-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Appointment } from '@/types/appointment';
import { 
  IconEdit, 
  IconDotsVertical, 
  IconTrash, 
  IconCheck, 
  IconX, 
  IconCircleCheck 
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAppointmentsRefresh } from '../appointments-listing';

interface CellActionProps {
  data: Appointment;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const router = useRouter();
  const { refresh } = useAppointmentsRefresh();

  const isCompleted = data.status === 'Completed';
  const canUpdateStatus = data.status === 'Scheduled';

  const onDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${data._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment deleted successfully');
        refresh();
      } else {
        toast.error(result.message || 'Failed to delete appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const onCancel = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${data._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Cancelled' })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment cancelled successfully');
        refresh();
      } else {
        toast.error(result.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
      setCancelModalOpen(false);
    }
  };

  const onComplete = async (billingData: BillingFormData) => {
    try {
      setLoading(true);

      // Parse bill items
      const parseItems = (str: string) => {
        if (!str || !str.trim()) return [];
        return str.split('\n').filter(Boolean).map(line => {
          const [description, quantity, unitPrice, amount] = line.split('|').map(s => s.trim());
          return {
            description: description || '',
            quantity: quantity ? parseFloat(quantity) : 0,
            unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
            amount: amount ? parseFloat(amount) : 0
          };
        });
      };

      // Update appointment status
      const appointmentResponse = await fetch(`/api/appointments/${data._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Completed' })
      });

      const appointmentResult = await appointmentResponse.json();

      if (!appointmentResult.success) {
        toast.error(appointmentResult.message || 'Failed to update appointment');
        return;
      }

      // Create bill
      const patientId = typeof data.patientId === 'object' ? data.patientId._id : data.patientId;
      const doctorId = typeof data.doctorId === 'object' ? data.doctorId._id : data.doctorId;
      const hospitalId = typeof data.hospitalId === 'object' ? data.hospitalId._id : data.hospitalId;

      const billPayload = {
        patientId,
        hospitalId,
        doctorId,
        billDate: new Date().toISOString(),
        totalAmount: billingData.totalAmount,
        paidAmount: billingData.paidAmount,
        status: billingData.paidAmount >= billingData.totalAmount ? 'Paid' : 'Partial',
        paymentMethod: billingData.paymentMethod,
        discount: billingData.discount || 0,
        items: parseItems(billingData.billItems || '')
      };

      // Import offline submission utility
      const { submitWithOfflineSupport } = await import('@/lib/offline/form-submission');
      
      const billResult = await submitWithOfflineSupport(
        'bills',
        billPayload,
        {
          apiEndpoint: '/api/bills',
          method: 'POST',
        }
      );

      if (billResult.success) {
        toast.success('Appointment completed and bill created successfully!', {
          description: 'The appointment has been marked as completed and a bill has been generated.'
        });
        setBillingModalOpen(false);
        refresh();
      } else {
        toast.warning('Appointment completed but bill creation failed', {
          description: 'The appointment is marked as completed. Please create the bill manually.'
        });
        setBillingModalOpen(false);
        refresh();
      }
    } catch (error) {
      console.error('Complete appointment error:', error);
      toast.error('Failed to complete appointment', {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteClick = () => {
    if (isCompleted) {
      toast.info('Appointment already completed', {
        description: 'This appointment has already been marked as completed and cannot be changed.'
      });
      return;
    }
    setBillingModalOpen(true);
  };

  const handleCancelClick = () => {
    if (isCompleted) {
      toast.error('Cannot cancel completed appointment', {
        description: 'Completed appointments cannot be cancelled.'
      });
      return;
    }
    setCancelModalOpen(true);
  };

  return (
    <>
      <AlertModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />

      <AlertModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={onCancel}
        loading={loading}
        title='Cancel Appointment'
        description='Are you sure you want to cancel this appointment? This action cannot be undone.'
      />

      <BillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onConfirm={onComplete}
        loading={loading}
        patientName={typeof data.patientId === 'object' ? data.patientId.name : undefined}
        doctorName={typeof data.doctorId === 'object' ? data.doctorId.name : undefined}
        appointmentDate={format(new Date(data.appointmentDate), 'PPp')}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {!isCompleted && (
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/appointments/${data._id}`)}
            >
              <IconEdit className='mr-2 h-4 w-4' /> Edit Details
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {canUpdateStatus && (
            <>
              <DropdownMenuItem
                onClick={handleCompleteClick}
                className='text-green-600 focus:text-green-600'
              >
                <IconCircleCheck className='mr-2 h-4 w-4' /> Mark as Completed
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={handleCancelClick}
                className='text-orange-600 focus:text-orange-600'
              >
                <IconX className='mr-2 h-4 w-4' /> Cancel Appointment
              </DropdownMenuItem>
            </>
          )}

          {isCompleted && (
            <DropdownMenuItem disabled>
              <IconCheck className='mr-2 h-4 w-4' /> Completed
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setDeleteModalOpen(true)}
            className='text-red-600 focus:text-red-600'
          >
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
