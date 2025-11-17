'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Hospital } from '@/types/hospital';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Hospital name must be at least 2 characters.'
  }),
  registrationNumber: z.string().min(1, {
    message: 'Registration number is required.'
  }),
  type: z.enum(['hospital', 'clinic', 'dispensary', 'ngo', 'other']),
  ownershipType: z.enum(['public', 'private', 'semi-government', 'ngo']),
  'location.area': z.string().optional(),
  'location.city': z.string().optional(),
  'location.country': z.string().optional(),
  'location.latitude': z.number().optional(),
  'location.longitude': z.number().optional(),
  'contact.primaryNumber': z.string().optional(),
  'contact.secondaryNumber': z.string().optional()
});

export default function HospitalForm({
  initialData,
  pageTitle
}: {
  initialData: Hospital | null;
  pageTitle: string;
}) {
  const defaultValues = {
    name: initialData?.name || '',
    registrationNumber: initialData?.registrationNumber || '',
    type: initialData?.type || ('hospital' as const),
    ownershipType: initialData?.ownershipType || ('public' as const),
    'location.area': initialData?.location?.area || '',
    'location.city': initialData?.location?.city || '',
    'location.country': initialData?.location?.country || '',
    'location.latitude': initialData?.location?.latitude,
    'location.longitude': initialData?.location?.longitude,
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
      // Transform flat form values to nested structure
      const payload = {
        name: values.name,
        registrationNumber: values.registrationNumber,
        type: values.type,
        ownershipType: values.ownershipType,
        location: {
          area: values['location.area'],
          city: values['location.city'],
          country: values['location.country'],
          latitude: values['location.latitude'],
          longitude: values['location.longitude']
        },
        contact: {
          primaryNumber: values['contact.primaryNumber'],
          secondaryNumber: values['contact.secondaryNumber']
        }
      };

      const url = initialData
        ? `/api/hospitals/${initialData._id}`
        : '/api/hospitals';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          initialData
            ? 'Hospital updated successfully'
            : 'Hospital created successfully'
        );
        router.push('/dashboard/hospitals');
        router.refresh();
      } else {
        toast.error(result.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save hospital');
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='name'
              label='Hospital Name'
              placeholder='Enter hospital name'
              required
            />

            <FormInput
              control={form.control}
              name='registrationNumber'
              label='Registration Number'
              placeholder='Enter registration number'
              required
            />

            <FormSelect
              control={form.control}
              name='type'
              label='Hospital Type'
              placeholder='Select type'
              required
              options={[
                { label: 'Hospital', value: 'hospital' },
                { label: 'Clinic', value: 'clinic' },
                { label: 'Dispensary', value: 'dispensary' },
                { label: 'NGO', value: 'ngo' },
                { label: 'Other', value: 'other' }
              ]}
            />

            <FormSelect
              control={form.control}
              name='ownershipType'
              label='Ownership Type'
              placeholder='Select ownership type'
              required
              options={[
                { label: 'Public', value: 'public' },
                { label: 'Private', value: 'private' },
                { label: 'Semi-Government', value: 'semi-government' },
                { label: 'NGO', value: 'ngo' }
              ]}
            />
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Location Details</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='location.area'
                label='Area'
                placeholder='Enter area'
              />

              <FormInput
                control={form.control}
                name='location.city'
                label='City'
                placeholder='Enter city'
              />

              <FormInput
                control={form.control}
                name='location.country'
                label='Country'
                placeholder='Enter country'
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormInput
                  control={form.control}
                  name='location.latitude'
                  label='Latitude'
                  placeholder='Latitude'
                  type='number'
                  step='any'
                />

                <FormInput
                  control={form.control}
                  name='location.longitude'
                  label='Longitude'
                  placeholder='Longitude'
                  type='number'
                  step='any'
                />
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Contact Information</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='contact.primaryNumber'
                label='Primary Contact Number'
                placeholder='Enter primary number'
              />

              <FormInput
                control={form.control}
                name='contact.secondaryNumber'
                label='Secondary Contact Number'
                placeholder='Enter secondary number'
              />
            </div>
          </div>

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'Saving...'
              : initialData
                ? 'Update Hospital'
                : 'Create Hospital'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
