'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
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
  reason: z.string().optional()
});

export default function AppointmentForm({
  initialData,
  pageTitle
}: {
  initialData: Appointment | null;
  pageTitle: string;
}) {
  const [patients, setPatients] = useState<Array<{ label: string; value: string }>>([]);
  const [doctors, setDoctors] = useState<Array<{ label: string; value: string }>>([]);
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
            value: p._id
          })));
        }

        if (doctorsData.success) {
          setDoctors(doctorsData.data.map((d: any) => ({
            label: d.name,
            value: d._id
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
    reason: initialData?.reason || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const dateTime = new Date(values.appointmentDate);
      const [hours, minutes] = values.appointmentTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      const payload = {
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(initialData ? 'Appointment updated successfully' : 'Appointment created successfully');
        router.push('/dashboard/appointments');
        router.refresh();
      } else {
        toast.error(result.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save appointment');
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormSelect 
              control={form.control} 
              name='patientId' 
              label='Patient' 
              placeholder='Select patient'
              required
              options={patients}
            />
            
            <FormSelect 
              control={form.control} 
              name='doctorId' 
              label='Doctor' 
              placeholder='Select doctor'
              required
              options={doctors}
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

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Appointment' : 'Create Appointment'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
