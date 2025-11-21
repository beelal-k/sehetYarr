'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormSearchableSelect, SearchableSelectOption } from '@/components/forms/form-searchable-select';
import { FormSwitch } from '@/components/forms/form-switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Appointment } from '@/types/appointment';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Patient is required.' }),
  doctorId: z.string().min(1, { message: 'Doctor is required.' }),
  hospitalId: z.string().min(1, { message: 'Hospital is required.' }),
  appointmentDate: z.date(),
  appointmentTime: z.string().min(1, { message: 'Time is required.' }),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'No Show']),
  priority: z.enum(['Normal', 'Urgent']).optional(),
  reason: z.string().optional(),
  // Pay upfront / complete appointment fields
  payUpfront: z.boolean().default(false),
  // Billing fields (conditional)
  totalAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  paymentMethod: z.enum(['Cash', 'Card', 'Bank Transfer', 'Insurance']).optional(),
  discount: z.number().optional(),
  billItems: z.string().optional()
}).refine((data) => {
  // If payUpfront is true, billing fields are required
  if (data.payUpfront) {
    return (
      data.totalAmount !== undefined && 
      data.totalAmount > 0 &&
      data.paidAmount !== undefined && 
      data.paidAmount >= 0 &&
      data.paymentMethod
    );
  }
  return true;
}, {
  message: 'Billing details are required when completing appointment with payment',
  path: ['totalAmount']
});

export default function AppointmentForm({
  initialData,
  pageTitle
}: {
  initialData: Appointment | null;
  pageTitle: string;
}) {
  const [patients, setPatients] = useState<SearchableSelectOption[]>([]);
  const [doctors, setDoctors] = useState<SearchableSelectOption[]>([]);
  const [hospitals, setHospitals] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes, hospitalsRes] = await Promise.all([
          fetch('/api/patients?limit=1000'),
          fetch('/api/doctors?limit=1000'),
          fetch('/api/hospitals?limit=1000')
        ]);

        const [patientsData, doctorsData, hospitalsData] = await Promise.all([
          patientsRes.json(),
          doctorsRes.json(),
          hospitalsRes.json()
        ]);

        if (patientsData.success) {
          setPatients(patientsData.data.map((p: any) => ({
            label: p.name,
            value: p._id,
            subtitle: `CNIC: ${p.cnic || 'N/A'}`,
            searchText: `${p.name} ${p.cnic || ''}`
          })));
        }

        if (doctorsData.success) {
          setDoctors(doctorsData.data.map((d: any) => ({
            label: d.name,
            value: d._id,
            subtitle: `CNIC: ${d.cnic || 'N/A'}`,
            searchText: `${d.name} ${d.cnic || ''}`
          })));
        }

        if (hospitalsData.success) {
          setHospitals(hospitalsData.data.map((h: any) => ({
            label: h.name,
            value: h._id
          })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const getTimeFromDate = (date: string) => {
    const d = new Date(date);
    return d.toTimeString().slice(0, 5);
  };

  const defaultValues = {
    patientId: typeof initialData?.patientId === 'object' ? initialData.patientId._id : initialData?.patientId || '',
    doctorId: typeof initialData?.doctorId === 'object' ? initialData.doctorId._id : initialData?.doctorId || '',
    hospitalId: typeof initialData?.hospitalId === 'object' ? initialData.hospitalId._id : initialData?.hospitalId || '',
    appointmentDate: initialData?.appointmentDate ? new Date(initialData.appointmentDate) : undefined,
    appointmentTime: initialData?.appointmentDate ? getTimeFromDate(initialData.appointmentDate) : '',
    status: initialData?.status || ('Scheduled' as const),
    priority: initialData?.priority,
    reason: initialData?.reason || '',
    payUpfront: false,
    totalAmount: undefined,
    paidAmount: undefined,
    paymentMethod: 'Cash' as const,
    discount: undefined,
    billItems: ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const router = useRouter();

  // Watch payUpfront checkbox to auto-update status
  const payUpfront = form.watch('payUpfront');
  
  useEffect(() => {
    if (payUpfront) {
      form.setValue('status', 'Completed');
    } else if (!initialData) {
      // Only reset to Scheduled if it's a new appointment
      form.setValue('status', 'Scheduled');
    }
  }, [payUpfront, form, initialData]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const dateTime = new Date(values.appointmentDate);
      const [hours, minutes] = values.appointmentTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      const appointmentPayload = {
        patientId: values.patientId,
        doctorId: values.doctorId,
        hospitalId: values.hospitalId,
        appointmentDate: dateTime.toISOString(),
        status: values.status,
        priority: values.priority,
        reason: values.reason
      };

      const url = initialData
        ? `/api/appointments/${initialData._id}`
        : '/api/appointments';
      const method = initialData ? 'PUT' : 'POST';

      // Import offline submission utility dynamically to avoid SSR issues
      const { submitWithOfflineSupport } = await import('@/lib/offline/form-submission');

      const result = await submitWithOfflineSupport(
        'appointments',
        appointmentPayload,
        {
          apiEndpoint: url,
          method,
          id: initialData?._id,
        }
      );

      if (!result.success) {
        // Error already shown by utility
        console.error('Appointment submission failed:', result.error);
        return;
      }

      // If payUpfront is enabled, create a bill
      if (values.payUpfront && !initialData) {
        try {
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

          const billPayload = {
            patientId: values.patientId,
            hospitalId: values.hospitalId,
            doctorId: values.doctorId,
            billDate: dateTime.toISOString(),
            totalAmount: values.totalAmount!,
            paidAmount: values.paidAmount!,
            status: values.paidAmount! >= values.totalAmount! ? 'Paid' : 'Partial',
            paymentMethod: values.paymentMethod!,
            discount: values.discount || 0,
            items: parseItems(values.billItems || '')
          };

          await submitWithOfflineSupport(
            'bills',
            billPayload,
            {
              apiEndpoint: '/api/bills',
              method: 'POST',
            }
          );

          toast.success('Appointment completed and bill created successfully!');
        } catch (billError) {
          console.error('Bill creation failed:', billError);
          toast.warning('Appointment created but bill creation failed. Please create the bill manually.');
        }
      } else {
        toast.success(initialData ? 'Appointment updated successfully!' : 'Appointment created successfully!');
      }

      router.push('/dashboard/appointments');
      router.refresh();
    } catch (error) {
      toast.error('Failed to save appointment');
      console.error('Appointment form error:', error);
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
        <CardDescription>
          {!initialData && 'Enable "Complete & Pay Upfront" if the patient is paying during appointment creation'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {/* Appointment Details Section */}
          <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormSearchableSelect 
                control={form.control} 
                name='patientId' 
                label='Patient' 
                placeholder='Select patient'
                required
                options={patients}
                emptyMessage='No patients found.'
              />
              
              <FormSearchableSelect 
                control={form.control} 
                name='doctorId' 
                label='Doctor' 
                placeholder='Select doctor'
                required
                options={doctors}
                emptyMessage='No doctors found.'
              />
              
              <FormSelect 
                control={form.control} 
                name='hospitalId' 
                label='Hospital' 
                placeholder='Select hospital'
                required
                options={hospitals}
              />
              
              <FormDatePicker 
                control={form.control} 
                name='appointmentDate' 
                label='Appointment Date' 
                required 
              />
              
              <FormInput 
                control={form.control} 
                name='appointmentTime' 
                label='Appointment Time' 
                placeholder='HH:MM (e.g., 14:30)'
                required 
              />
              
              <FormSelect 
                control={form.control} 
                name='status' 
                label='Status' 
                required
                disabled={payUpfront}
                options={[
                  { label: 'Scheduled', value: 'Scheduled' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' },
                  { label: 'No Show', value: 'No Show' }
                ]}
              />
              
              <FormSelect 
                control={form.control} 
                name='priority' 
                label='Priority'
                options={[
                  { label: 'Normal', value: 'Normal' },
                  { label: 'Urgent', value: 'Urgent' }
                ]}
              />
            </div>

            <FormTextarea
              control={form.control}
              name='reason'
              label='Reason for Visit'
              placeholder='Enter reason for appointment'
              config={{
                maxLength: 500,
                showCharCount: true,
                rows: 4
              }}
            />
          </div>

          {/* Pay Upfront Section - Only show for new appointments */}
          {!initialData && (
            <>
              <Separator className='my-6' />
              
              <FormSwitch
                control={form.control}
                name='payUpfront'
                label='Complete Appointment & Collect Payment'
                description='Enable this if the patient is present and paying now. This will mark the appointment as completed and create a bill.'
                showDescription={true}
              />

              {/* Conditional Billing Fields */}
              {payUpfront && (
                <div className='space-y-6 rounded-lg border border-primary/20 bg-primary/5 p-6'>
                  <div className='space-y-2'>
                    <h3 className='text-lg font-semibold'>Payment Details</h3>
                    <p className='text-sm text-muted-foreground'>
                      Fill in the billing information for this appointment
                    </p>
                  </div>

                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
              )}
            </>
          )}

          <div className='flex gap-4'>
            <Button 
              type='button' 
              variant='outline' 
              onClick={() => router.back()}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting 
                ? 'Saving...' 
                : initialData 
                  ? 'Update Appointment' 
                  : payUpfront 
                    ? 'Complete & Create Bill' 
                    : 'Create Appointment'
              }
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
