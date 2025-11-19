'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Pharmacy } from '@/types/pharmacy';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  contact: z.string().min(1, { message: 'Contact number is required.' }),
  'location.address': z.string().min(1, { message: 'Address is required.' }),
  'location.city': z.string().min(1, { message: 'City is required.' }),
  'location.state': z.string().min(1, { message: 'State is required.' }),
  'inventory.name': z.string().optional(),
  'inventory.supplier': z.string().optional(),
  'inventory.quantity': z.string().optional()
});

export default function PharmacyForm({
  initialData,
  pageTitle
}: {
  initialData: Pharmacy | null;
  pageTitle: string;
}) {
  const defaultValues = {
    name: initialData?.name || '',
    contact: initialData?.contact || '',
    'location.address': initialData?.location?.address || '',
    'location.city': initialData?.location?.city || '',
    'location.state': initialData?.location?.state || '',
    'inventory.name': initialData?.inventory?.[0]?.name || '',
    'inventory.supplier': initialData?.inventory?.[0]?.supplier || '',
    'inventory.quantity': initialData?.inventory?.[0]?.quantity || ''
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
        contact: values.contact,
        location: {
          address: values['location.address'],
          city: values['location.city'],
          state: values['location.state']
        },
        inventory: [{
          name: values['inventory.name'] || '',
          supplier: values['inventory.supplier'] || '',
          quantity: values['inventory.quantity'] || ''
        }]
      };

      const url = initialData
        ? `/api/pharmacies/${initialData._id}`
        : '/api/pharmacies';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(initialData ? 'Pharmacy updated successfully' : 'Pharmacy created successfully');
        router.push('/dashboard/pharmacies');
        router.refresh();
      } else {
        toast.error(result.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save pharmacy');
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Basic Information</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput control={form.control} name='name' label='Pharmacy Name' placeholder='Enter pharmacy name' required />
              <FormInput control={form.control} name='contact' label='Contact Number' placeholder='Phone number' required />
            </div>
          </div>

          {/* Location */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Location</h3>
            <div className='grid grid-cols-1 gap-6'>
              <FormInput 
                control={form.control} 
                name='location.address' 
                label='Address' 
                placeholder='Complete address'
                required
              />
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormInput control={form.control} name='location.city' label='City' placeholder='City' required />
                <FormInput control={form.control} name='location.state' label='State/Province' placeholder='State' required />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Sample Inventory Item</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormInput 
                control={form.control} 
                name='inventory.name' 
                label='Medicine Name' 
                placeholder='e.g., Paracetamol'
              />
              <FormInput 
                control={form.control} 
                name='inventory.supplier' 
                label='Supplier' 
                placeholder='e.g., ABC Pharma'
              />
              <FormInput 
                control={form.control} 
                name='inventory.quantity' 
                label='Quantity' 
                placeholder='e.g., 100 tablets'
              />
            </div>
          </div>

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Pharmacy' : 'Create Pharmacy'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}