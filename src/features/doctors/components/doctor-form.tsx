'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Doctor } from '@/types/doctor';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  cnic: z.string().min(13, { message: 'CNIC must be 13 characters.' }),
  cnicIV: z.string().min(1, { message: 'CNIC IV is required.' }),
  licenseNumber: z.string().min(1, { message: 'License number is required.' }),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.date().optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  qualifications: z.string().optional(),
  subSpecialization: z.string().optional(),
  hospitalIds: z.string().optional(),
  'contact.area': z.string().optional(),
  'contact.city': z.string().optional(),
  'contact.state': z.string().optional(),
  'contact.primaryNumber': z.string().optional(),
  'contact.secondaryNumber': z.string().optional()
});

export default function DoctorForm({
  initialData,
  pageTitle
}: {
  initialData: Doctor | null;
  pageTitle: string;
}) {
  const [hospitals, setHospitals] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch('/api/hospitals?limit=1000');
        const data = await response.json();
        if (data.success) {
          setHospitals(
            data.data.map((h: any) => ({
              label: h.name,
              value: h._id
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
      }
    };
    fetchHospitals();
  }, []);

  const defaultValues = {
    name: initialData?.name || '',
    cnic: initialData?.cnic || '',
    cnicIV: initialData?.cnicIV || '',
    licenseNumber: initialData?.licenseNumber || '',
    gender: initialData?.gender,
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : undefined,
    specialization: initialData?.specialization || '',
    experienceYears: initialData?.experienceYears,
    qualifications: initialData?.qualifications?.join(', ') || '',
    subSpecialization: initialData?.subSpecialization?.join(', ') || '',
    hospitalIds: initialData?.hospitalIds?.[0]?._id || '',
    'contact.area': initialData?.contact?.area || '',
    'contact.city': initialData?.contact?.city || '',
    'contact.state': initialData?.contact?.state || '',
    'contact.primaryNumber': initialData?.contact?.primaryNumber || '',
    'contact.secondaryNumber': initialData?.contact?.secondaryNumber || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        name: values.name,
        cnic: values.cnic,
        cnicIV: values.cnicIV,
        licenseNumber: values.licenseNumber,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth?.toISOString(),
        specialization: values.specialization,
        experienceYears: values.experienceYears,
        qualifications: values.qualifications
          ? values.qualifications.split(',').map(q => q.trim()).filter(Boolean)
          : [],
        subSpecialization: values.subSpecialization
          ? values.subSpecialization.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        hospitalIds: values.hospitalIds ? [values.hospitalIds] : [],
        contact: {
          area: values['contact.area'],
          city: values['contact.city'],
          state: values['contact.state'],
          primaryNumber: values['contact.primaryNumber'],
          secondaryNumber: values['contact.secondaryNumber']
        }
      };

      const url = initialData
        ? `/api/doctors/${initialData._id}`
        : '/api/doctors';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(initialData ? 'Doctor updated successfully' : 'Doctor created successfully');
        router.push('/dashboard/doctors');
        router.refresh();
      } else {
        toast.error(result.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save doctor');
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
            <FormInput control={form.control} name='name' label='Doctor Name' placeholder='Enter name' required />
            <FormInput control={form.control} name='cnic' label='CNIC' placeholder='13-digit CNIC' required />
            <FormInput control={form.control} name='cnicIV' label='CNIC IV' placeholder='Enter CNIC IV' required />
            <FormInput control={form.control} name='licenseNumber' label='License Number' placeholder='Medical license number' required />
            
            <FormSelect control={form.control} name='gender' label='Gender' options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' }
            ]} />
            
            <FormDatePicker control={form.control} name='dateOfBirth' label='Date of Birth' />
            
            <FormInput control={form.control} name='specialization' label='Specialization' placeholder='e.g., Cardiology' />
            
            <FormInput 
              control={form.control} 
              name='experienceYears' 
              label='Experience (Years)' 
              placeholder='Years of experience' 
              type='number' 
              min={0}
            />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput 
              control={form.control} 
              name='qualifications' 
              label='Qualifications' 
              placeholder='MBBS, MD (comma separated)' 
            />
            
            <FormInput 
              control={form.control} 
              name='subSpecialization' 
              label='Sub-Specializations' 
              placeholder='Interventional Cardiology (comma separated)' 
            />
            
            <FormSelect 
              control={form.control} 
              name='hospitalIds' 
              label='Primary Hospital' 
              placeholder='Select hospital'
              options={hospitals}
            />
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Contact Information</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput control={form.control} name='contact.primaryNumber' label='Primary Number' placeholder='Phone number' />
              <FormInput control={form.control} name='contact.secondaryNumber' label='Secondary Number' placeholder='Alternate phone' />
              <FormInput control={form.control} name='contact.area' label='Area' placeholder='Area' />
              <FormInput control={form.control} name='contact.city' label='City' placeholder='City' />
              <FormInput control={form.control} name='contact.state' label='State' placeholder='State' />
            </div>
          </div>

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Doctor' : 'Create Doctor'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
