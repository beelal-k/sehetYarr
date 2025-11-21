'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { IconReceipt } from '@tabler/icons-react';

const billingSchema = z.object({
  totalAmount: z.number().min(0.01, { message: 'Total amount must be greater than 0' }),
  paidAmount: z.number().min(0, { message: 'Paid amount cannot be negative' }),
  paymentMethod: z.enum(['Cash', 'Card', 'Bank Transfer', 'Insurance']),
  discount: z.number().min(0).optional(),
  billItems: z.string().optional()
});

export type BillingFormData = z.infer<typeof billingSchema>;

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BillingFormData) => Promise<void>;
  loading: boolean;
  patientName?: string;
  doctorName?: string;
  appointmentDate?: string;
}

export function BillingModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  patientName,
  doctorName,
  appointmentDate
}: BillingModalProps) {
  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      totalAmount: undefined,
      paidAmount: undefined,
      paymentMethod: 'Cash',
      discount: undefined,
      billItems: ''
    }
  });

  const handleSubmit = async (values: BillingFormData) => {
    try {
      await onConfirm(values);
      form.reset();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Billing submission error:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <IconReceipt className='h-5 w-5 text-primary' />
            <DialogTitle>Complete Appointment & Create Bill</DialogTitle>
          </div>
          <DialogDescription>
            Fill in the billing details to complete this appointment. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {(patientName || doctorName || appointmentDate) && (
          <div className='rounded-lg border bg-muted/50 p-4 space-y-2'>
            <h4 className='text-sm font-semibold'>Appointment Details</h4>
            {patientName && (
              <p className='text-sm'>
                <span className='text-muted-foreground'>Patient:</span>{' '}
                <span className='font-medium'>{patientName}</span>
              </p>
            )}
            {doctorName && (
              <p className='text-sm'>
                <span className='text-muted-foreground'>Doctor:</span>{' '}
                <span className='font-medium'>{doctorName}</span>
              </p>
            )}
            {appointmentDate && (
              <p className='text-sm'>
                <span className='text-muted-foreground'>Date:</span>{' '}
                <span className='font-medium'>{appointmentDate}</span>
              </p>
            )}
          </div>
        )}

        <Separator />

        <Form form={form} onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <div className='space-y-4'>
            <h4 className='text-sm font-semibold'>Payment Information</h4>
            
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='totalAmount'
                label='Total Amount'
                type='number'
                placeholder='Enter total amount'
                required
                min='0.01'
                step='0.01'
              />
              
              <FormInput
                control={form.control}
                name='paidAmount'
                label='Paid Amount'
                type='number'
                placeholder='Enter paid amount'
                required
                min='0'
                step='0.01'
              />
              
              <FormSelect
                control={form.control}
                name='paymentMethod'
                label='Payment Method'
                required
                options={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Card', value: 'Card' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Insurance', value: 'Insurance' }
                ]}
              />
              
              <FormInput
                control={form.control}
                name='discount'
                label='Discount (Optional)'
                type='number'
                placeholder='0'
                min='0'
                step='0.01'
              />
            </div>

            <FormTextarea
              control={form.control}
              name='billItems'
              label='Bill Items (Optional)'
              placeholder='Format: Description | Quantity | Unit Price | Amount (one per line)&#10;Example: Consultation | 1 | 500 | 500'
              config={{
                maxLength: 1000,
                showCharCount: true,
                rows: 4
              }}
            />
          </div>

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Processing...' : 'Complete & Create Bill'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

