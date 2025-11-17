'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Patient } from '@/types/patient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  cnic: z.string().min(13, { message: 'CNIC must be 13 characters.' }),
  cnicIV: z.string().min(1, { message: 'CNIC IV is required.' }),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.date(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).optional(),
  'contact.primaryNumber': z.string().optional(),
  'contact.secondaryNumber': z.string().optional(),
  'contact.address': z.string().optional(),
  'contact.city': z.string().optional(),
  'contact.state': z.string().optional(),
  'emergencyContact.name': z.string().optional(),
  'emergencyContact.relation': z.string().optional(),
  'emergencyContact.phoneNo': z.string().optional()
});

export default function PatientForm({
  initialData,
  pageTitle
}: {
  initialData: Patient | null;
  pageTitle: string;
}) {
  const defaultValues = {
    name: initialData?.name || '',
    cnic: initialData?.cnic || '',
    cnicIV: initialData?.cnicIV || '',
    gender: initialData?.gender || ('male' as const),
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : undefined,
    bloodGroup: initialData?.bloodGroup,
    'contact.primaryNumber': initialData?.contact?.primaryNumber || '',
    'contact.secondaryNumber': initialData?.contact?.secondaryNumber || '',
    'contact.address': initialData?.contact?.address || '',
    'contact.city': initialData?.contact?.city || '',
    'contact.state': initialData?.contact?.state || '',
    'emergencyContact.name': initialData?.emergencyContact?.name || '',
    'emergencyContact.relation': initialData?.emergencyContact?.relation || '',
    'emergencyContact.phoneNo': initialData?.emergencyContact?.phoneNo || ''
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
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.toISOString(),
        bloodGroup: values.bloodGroup,
        contact: {
          primaryNumber: values['contact.primaryNumber'],
          secondaryNumber: values['contact.secondaryNumber'],
          address: values['contact.address'],
          city: values['contact.city'],
          state: values['contact.state']
        },
        emergencyContact: {
          name: values['emergencyContact.name'],
          relation: values['emergencyContact.relation'],
          phoneNo: values['emergencyContact.phoneNo']
        }
      };

      const url = initialData
        ? `/api/patients/${initialData._id}`
        : '/api/patients';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(initialData ? 'Patient updated successfully' : 'Patient created successfully');
        router.push('/dashboard/patients');
        router.refresh();
      } else {
        toast.error(result.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save patient');
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
            <FormInput control={form.control} name='name' label='Patient Name' placeholder='Enter name' required />
            <FormInput control={form.control} name='cnic' label='CNIC' placeholder='13-digit CNIC' required />
            <FormInput control={form.control} name='cnicIV' label='CNIC IV' placeholder='Enter CNIC IV' required />
            
            <FormSelect control={form.control} name='gender' label='Gender' required options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' }
            ]} />
            
            <FormDatePicker control={form.control} name='dateOfBirth' label='Date of Birth' required />
            
            <FormSelect control={form.control} name='bloodGroup' label='Blood Group' options={[
              { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
              { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
              { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
              { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' }
            ]} />
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Contact Information</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput control={form.control} name='contact.primaryNumber' label='Primary Number' placeholder='Phone number' />
              <FormInput control={form.control} name='contact.secondaryNumber' label='Secondary Number' placeholder='Alternate phone' />
              <FormInput control={form.control} name='contact.address' label='Address' placeholder='Street address' />
              <FormInput control={form.control} name='contact.city' label='City' placeholder='City' />
              <FormInput control={form.control} name='contact.state' label='State' placeholder='State' />
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Emergency Contact</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormInput control={form.control} name='emergencyContact.name' label='Name' placeholder='Contact name' />
              <FormInput control={form.control} name='emergencyContact.relation' label='Relation' placeholder='Relationship' />
              <FormInput control={form.control} name='emergencyContact.phoneNo' label='Phone' placeholder='Contact number' />
            </div>
          </div>

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Patient' : 'Create Patient'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
