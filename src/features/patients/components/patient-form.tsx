'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Patient } from '@/types/patient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

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
  const [isChecking, setIsChecking] = useState(false);
  const [existingPatient, setExistingPatient] = useState<Patient | null>(null);
  const cnicValue = form.watch('cnic');

  useEffect(() => {
    const checkPatient = async () => {
      if (cnicValue?.length >= 13 && !initialData) {
        setIsChecking(true);
        try {
          const response = await fetch(`/api/patients?search=${cnicValue}&lookup=true`);
          const result = await response.json();
          
          if (result.success && result.data && result.data.length > 0) {
            // Find exact match
            const match = result.data.find((p: Patient) => p.cnic === cnicValue);
            if (match) {
              setExistingPatient(match);
              toast.info('Patient found in the system!');
              
              // Auto-fill fields
              form.setValue('name', match.name);
              form.setValue('cnicIV', match.cnicIV);
              form.setValue('gender', match.gender);
              if (match.dateOfBirth) form.setValue('dateOfBirth', new Date(match.dateOfBirth));
              if (match.bloodGroup) form.setValue('bloodGroup', match.bloodGroup);
              if (match.contact?.primaryNumber) form.setValue('contact.primaryNumber', match.contact.primaryNumber);
              if (match.contact?.secondaryNumber) form.setValue('contact.secondaryNumber', match.contact.secondaryNumber);
              if (match.contact?.address) form.setValue('contact.address', match.contact.address);
              if (match.contact?.city) form.setValue('contact.city', match.contact.city);
              if (match.contact?.state) form.setValue('contact.state', match.contact.state);
              if (match.emergencyContact?.name) form.setValue('emergencyContact.name', match.emergencyContact.name);
              if (match.emergencyContact?.relation) form.setValue('emergencyContact.relation', match.emergencyContact.relation);
              if (match.emergencyContact?.phoneNo) form.setValue('emergencyContact.phoneNo', match.emergencyContact.phoneNo);
            } else {
              setExistingPatient(null);
            }
          } else {
            setExistingPatient(null);
          }
        } catch (error) {
          console.error('Error checking patient:', error);
        } finally {
          setIsChecking(false);
        }
      } else if (cnicValue?.length < 13) {
        setExistingPatient(null);
      }
    };

    const timer = setTimeout(checkPatient, 500);
    return () => clearTimeout(timer);
  }, [cnicValue, form, initialData]);

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
        toast.success(result.message || (initialData ? 'Patient updated successfully' : 'Patient created successfully'));
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
        {existingPatient && (
          <Alert className="mb-6 border-primary/50 bg-primary/10 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Patient Found!</AlertTitle>
            <AlertDescription>
              This patient already exists in the system. We've auto-filled their information. 
              Clicking "Create Patient" will link them to your hospital.
            </AlertDescription>
          </Alert>
        )}

        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className="relative">
              <FormInput 
                control={form.control} 
                name='cnic' 
                label='CNIC' 
                placeholder='13-digit CNIC' 
                required 
                disabled={!!initialData}
              />
              <div className="absolute right-3 top-[34px]">
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : existingPatient ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
            </div>

            <FormInput 
              control={form.control} 
              name='name' 
              label='Patient Name' 
              placeholder='Enter name' 
              required 
              disabled={!!existingPatient?.name}
            />
            
            <FormInput 
              control={form.control} 
              name='cnicIV' 
              label='CNIC IV' 
              placeholder='Enter CNIC IV' 
              required 
              disabled={!!existingPatient?.cnicIV}
            />
            
            <FormSelect 
              control={form.control} 
              name='gender' 
              label='Gender' 
              required 
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' }
              ]} 
              disabled={!!existingPatient?.gender}
            />
            
            <FormDatePicker 
              control={form.control} 
              name='dateOfBirth' 
              label='Date of Birth' 
              required 
              disabled={!!existingPatient?.dateOfBirth}
            />
            
            <FormSelect 
              control={form.control} 
              name='bloodGroup' 
              label='Blood Group' 
              options={[
                { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
                { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
                { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
                { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' }
              ]} 
              disabled={!!existingPatient?.bloodGroup}
            />
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Contact Information</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput control={form.control} name='contact.primaryNumber' label='Primary Number' placeholder='Phone number' disabled={!!existingPatient?.contact?.primaryNumber} />
              <FormInput control={form.control} name='contact.secondaryNumber' label='Secondary Number' placeholder='Alternate phone' disabled={!!existingPatient?.contact?.secondaryNumber} />
              <FormInput control={form.control} name='contact.address' label='Address' placeholder='Street address' disabled={!!existingPatient?.contact?.address} />
              <FormInput control={form.control} name='contact.city' label='City' placeholder='City' disabled={!!existingPatient?.contact?.city} />
              <FormInput control={form.control} name='contact.state' label='State' placeholder='State' disabled={!!existingPatient?.contact?.state} />
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Emergency Contact</h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormInput control={form.control} name='emergencyContact.name' label='Name' placeholder='Contact name' disabled={!!existingPatient?.emergencyContact?.name} />
              <FormInput control={form.control} name='emergencyContact.relation' label='Relation' placeholder='Relationship' disabled={!!existingPatient?.emergencyContact?.relation} />
              <FormInput control={form.control} name='emergencyContact.phoneNo' label='Phone' placeholder='Contact number' disabled={!!existingPatient?.emergencyContact?.phoneNo} />
            </div>
          </div>

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : existingPatient ? 'Link Patient' : initialData ? 'Update Patient' : 'Create Patient'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
