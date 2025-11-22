'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Worker } from '@/types/worker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { submitWithOfflineSupport } from '@/lib/offline/form-submission';

const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' }
];

const designationOptions = [
  { label: 'Nurse', value: 'Nurse' },
  { label: 'Paramedic', value: 'Paramedic' },
  { label: 'Technician', value: 'Technician' },
  { label: 'Other', value: 'Other' }
];

const departmentOptions = [
  { label: 'ICU', value: 'ICU' },
  { label: 'Emergency', value: 'Emergency' },
  { label: 'Radiology', value: 'Radiology' },
  { label: 'General Ward', value: 'General Ward' },
  { label: 'Laboratory', value: 'Laboratory' },
  { label: 'Other', value: 'Other' }
];

const shiftTypeOptions = [
  { label: 'Morning', value: 'Morning' },
  { label: 'Evening', value: 'Evening' },
  { label: 'Night', value: 'Night' },
  { label: 'Rotational', value: 'Rotational' }
];

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.date().optional(),
  cnic: z.string().min(1, { message: 'CNIC is required.' }),
  cnicIV: z.string().min(1, { message: 'CNIC IV is required.' }),
  designation: z.enum(['Nurse', 'Paramedic', 'Technician', 'Other']),
  department: z.enum(['ICU', 'Emergency', 'Radiology', 'General Ward', 'Laboratory', 'Other']).optional(),
  experienceYears: z.string().optional(),
  qualifications: z.string().optional(),
  shiftType: z.enum(['Morning', 'Evening', 'Night', 'Rotational']).optional(),
  shiftStartTime: z.string().optional(),
  shiftEndTime: z.string().optional(),
  primaryNumber: z.string().optional(),
  secondaryNumber: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  hospitalIds: z.string().optional(),
  licenseNumber: z.string().optional(),
  schemes: z.string().optional()
});

export default function WorkerForm({
  initialData,
  pageTitle
}: {
  initialData: Worker | null;
  pageTitle: string;
}) {
  const { t } = useI18n();
  const [hospitals, setHospitals] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch('/api/hospitals?limit=1000');
        const data = await response.json();

        if (data.success) {
          setHospitals(data.data.map((h: any) => ({ label: h.name, value: h._id })));
        }
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
      }
    };
    fetchHospitals();
  }, []);

  const formatSchemes = (schemes?: Worker['schemes']) => {
    if (!schemes || schemes.length === 0) return '';
    return schemes.map(s => 
      `${s.name || ''} | ${s.organization || ''} | ${s.role || ''}`
    ).join('\n');
  };

  const defaultValues = {
    name: initialData?.name || '',
    gender: initialData?.gender,
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : undefined,
    cnic: initialData?.cnic || '',
    cnicIV: initialData?.cnicIV || '',
    designation: (initialData?.designation || 'Nurse') as 'Nurse' | 'Paramedic' | 'Technician' | 'Other',
    department: initialData?.department,
    experienceYears: initialData?.experienceYears?.toString() || '',
    qualifications: initialData?.qualifications?.join(', ') || '',
    shiftType: initialData?.shift?.type,
    shiftStartTime: initialData?.shift?.startTime || '',
    shiftEndTime: initialData?.shift?.endTime || '',
    primaryNumber: initialData?.contact?.primaryNumber || '',
    secondaryNumber: initialData?.contact?.secondaryNumber || '',
    area: initialData?.contact?.area || '',
    city: initialData?.contact?.city || '',
    state: initialData?.contact?.state || '',
    hospitalIds: initialData?.hospitalIds?.map(h => typeof h === 'object' ? h._id : h).join(', ') || '',
    licenseNumber: initialData?.licenseNumber || '',
    schemes: formatSchemes(initialData?.schemes)
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const parseSchemes = (str: string) => {
        if (!str.trim()) return [];
        return str.split('\n').filter(Boolean).map(line => {
          const [name, organization, role] = line.split('|').map(s => s.trim());
          return { name, organization, role };
        });
      };

      const payload = {
        name: values.name,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth?.toISOString(),
        cnic: values.cnic,
        cnicIV: values.cnicIV,
        designation: values.designation,
        department: values.department,
        experienceYears: values.experienceYears ? parseInt(values.experienceYears) : undefined,
        qualifications: values.qualifications ? values.qualifications.split(',').map(q => q.trim()).filter(Boolean) : [],
        shift: values.shiftType ? {
          type: values.shiftType,
          startTime: values.shiftStartTime,
          endTime: values.shiftEndTime
        } : undefined,
        contact: {
          primaryNumber: values.primaryNumber,
          secondaryNumber: values.secondaryNumber,
          area: values.area,
          city: values.city,
          state: values.state
        },
        hospitalIds: values.hospitalIds ? values.hospitalIds.split(',').map(id => id.trim()).filter(Boolean) : [],
        licenseNumber: values.licenseNumber,
        schemes: parseSchemes(values.schemes || '')
      };

      const url = initialData
        ? `/api/workers/${initialData._id}`
        : '/api/workers';
      const method = initialData ? 'PUT' : 'POST';

      await submitWithOfflineSupport(
        'workers',
        payload,
        {
          apiEndpoint: url,
          method,
          id: initialData?._id,
          onSuccess: (result) => {
            router.push('/dashboard/workers');
            router.refresh();
          },
          onError: (error) => {
            console.error(error);
          }
        }
      );
    } catch (error) {
      toast.error('Failed to save worker');
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {initialData ? t('common.edit') : t('common.create_new')} {t('common.workers')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput control={form.control} name='name' label={t('common.name')} placeholder={t('common.enter_name')} required />
            <FormSelect control={form.control} name='gender' label={t('common.gender')} placeholder={t('common.select_gender')} options={genderOptions} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <FormInput control={form.control} name='cnic' label={t('common.cnic')} placeholder={t('common.enter_cnic')} required />
            <FormInput control={form.control} name='cnicIV' label={t('common.cnic') + ' IV'} placeholder={t('common.enter_cnic_iv')} required />
            <FormDatePicker control={form.control} name='dateOfBirth' label={t('common.dob')} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <FormSelect control={form.control} name='designation' label={t('common.designation')} placeholder={t('common.select_designation')} required options={designationOptions} />
            <FormSelect control={form.control} name='department' label={t('common.department')} placeholder={t('common.select_department')} options={departmentOptions} />
            <FormInput control={form.control} name='experienceYears' label={t('common.experience_years')} placeholder='0' type='number' />
          </div>

          <FormInput control={form.control} name='qualifications' label={t('common.qualification')} placeholder={t('common.qualifications_placeholder')} />

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <FormSelect control={form.control} name='shiftType' label={t('common.shift')} placeholder={t('common.select_shift')} options={shiftTypeOptions} />
            <FormInput control={form.control} name='shiftStartTime' label={t('common.start_time')} placeholder={t('common.time_placeholder')} />
            <FormInput control={form.control} name='shiftEndTime' label={t('common.end_time')} placeholder={t('common.time_placeholder')} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput control={form.control} name='primaryNumber' label={t('common.primary_number')} placeholder={t('common.phone')} />
            <FormInput control={form.control} name='secondaryNumber' label={t('common.secondary_number')} placeholder={t('common.phone')} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <FormInput control={form.control} name='area' label={t('common.area')} placeholder={t('common.enter_area')} />
            <FormInput control={form.control} name='city' label={t('common.city')} placeholder={t('common.city')} />
            <FormInput control={form.control} name='state' label={t('common.state')} placeholder={t('common.state')} />
          </div>

          <FormInput control={form.control} name='hospitalIds' label={t('common.hospitals')} placeholder={t('common.comma_separated_hospital_ids')} />

          <FormInput control={form.control} name='licenseNumber' label={t('common.license_number')} placeholder={t('common.enter_license')} />

          <FormTextarea
            control={form.control}
            name='schemes'
            label={t('common.schemes')}
            placeholder={t('common.schemes_placeholder')}
            config={{ rows: 4, maxLength: 1000, showCharCount: true }}
          />

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('common.saving') : initialData ? t('common.update') : t('common.create')}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
