'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormDatePicker } from '@/components/forms/form-date-picker';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { MedicalRecord } from '@/types/medical-record';
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
  visitDate: z.date().optional(),
  diagnosis: z.string().optional(),
  symptoms: z.string().optional(),
  allergies: z.string().optional(),
  treatmentPlan: z.string().optional(),
  followUpDate: z.date().optional(),
  notes: z.string().optional(),
  prescriptions: z.string().optional(),
  testsOrdered: z.string().optional()
});

export default function MedicalRecordForm({
  initialData,
  pageTitle
}: {
  initialData: MedicalRecord | null;
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
          setPatients(patientsData.data.map((p: any) => ({ label: p.name, value: p._id })));
        }
        if (doctorsData.success) {
          setDoctors(doctorsData.data.map((d: any) => ({ label: d.name, value: d._id })));
        }
        if (hospitalsData.success) {
          setHospitals(hospitalsData.data.map((h: any) => ({ label: h.name, value: h._id })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const formatPrescriptions = (prescriptions?: MedicalRecord['prescriptions']) => {
    if (!prescriptions || prescriptions.length === 0) return '';
    return prescriptions.map(p => 
      `${p.medicineName || ''} | ${p.dosage || ''} | ${p.frequency || ''} | ${p.duration || ''}`
    ).join('\n');
  };

  const formatTests = (tests?: MedicalRecord['testsOrdered']) => {
    if (!tests || tests.length === 0) return '';
    return tests.map(t => `${t.testName || ''} | ${t.results || ''}`).join('\n');
  };

  const defaultValues = {
    patientId: typeof initialData?.patientId === 'object' ? initialData.patientId._id : initialData?.patientId || '',
    doctorId: typeof initialData?.doctorId === 'object' ? initialData.doctorId._id : initialData?.doctorId || '',
    hospitalId: typeof initialData?.hospitalId === 'object' ? initialData.hospitalId._id : initialData?.hospitalId || '',
    visitDate: initialData?.visitDate ? new Date(initialData.visitDate) : undefined,
    diagnosis: initialData?.diagnosis || '',
    symptoms: initialData?.symptoms?.join(', ') || '',
    allergies: initialData?.allergies?.join(', ') || '',
    treatmentPlan: initialData?.treatmentPlan || '',
    followUpDate: initialData?.followUpDate ? new Date(initialData.followUpDate) : undefined,
    notes: initialData?.notes || '',
    prescriptions: formatPrescriptions(initialData?.prescriptions),
    testsOrdered: formatTests(initialData?.testsOrdered)
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const parsePrescriptions = (str: string) => {
        if (!str.trim()) return [];
        return str.split('\n').filter(Boolean).map(line => {
          const [medicineName, dosage, frequency, duration] = line.split('|').map(s => s.trim());
          return { medicineName, dosage, frequency, duration, notes: '' };
        });
      };

      const parseTests = (str: string) => {
        if (!str.trim()) return [];
        return str.split('\n').filter(Boolean).map(line => {
          const [testName, results] = line.split('|').map(s => s.trim());
          return { testName, results, testDate: new Date().toISOString() };
        });
      };

      const payload = {
        patientId: values.patientId,
        doctorId: values.doctorId,
        hospitalId: values.hospitalId,
        visitDate: values.visitDate?.toISOString(),
        diagnosis: values.diagnosis,
        symptoms: values.symptoms ? values.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: values.allergies ? values.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
        treatmentPlan: values.treatmentPlan,
        followUpDate: values.followUpDate?.toISOString(),
        notes: values.notes,
        prescriptions: parsePrescriptions(values.prescriptions || ''),
        testsOrdered: parseTests(values.testsOrdered || ''),
        attachments: []
      };

      const url = initialData
        ? `/api/medical-records/${initialData._id}`
        : '/api/medical-records';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(initialData ? 'Medical record updated successfully' : 'Medical record created successfully');
        router.push('/dashboard/medical-records');
        router.refresh();
      } else {
        toast.error(result.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save medical record');
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <FormSelect control={form.control} name='patientId' label='Patient' placeholder='Select patient' required options={patients} />
            <FormSelect control={form.control} name='doctorId' label='Doctor' placeholder='Select doctor' required options={doctors} />
            <FormSelect control={form.control} name='hospitalId' label='Hospital' placeholder='Select hospital' required options={hospitals} />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormDatePicker control={form.control} name='visitDate' label='Visit Date' />
            <FormDatePicker control={form.control} name='followUpDate' label='Follow-up Date' />
          </div>

          <FormInput control={form.control} name='diagnosis' label='Diagnosis' placeholder='Enter diagnosis' />
          
          <FormInput control={form.control} name='symptoms' label='Symptoms' placeholder='Comma separated (e.g., fever, headache, cough)' />
          
          <FormInput control={form.control} name='allergies' label='Allergies' placeholder='Comma separated (e.g., penicillin, peanuts)' />

          <FormTextarea
            control={form.control}
            name='prescriptions'
            label='Prescriptions'
            placeholder='One per line: Medicine | Dosage | Frequency | Duration&#10;Example: Paracetamol | 500mg | 3 times daily | 5 days'
            config={{ rows: 5, maxLength: 2000, showCharCount: true }}
          />

          <FormTextarea
            control={form.control}
            name='testsOrdered'
            label='Tests Ordered'
            placeholder='One per line: Test Name | Results&#10;Example: Blood Test | Normal&#10;X-Ray Chest | Clear'
            config={{ rows: 4, maxLength: 1000, showCharCount: true }}
          />

          <FormTextarea
            control={form.control}
            name='treatmentPlan'
            label='Treatment Plan'
            placeholder='Describe the treatment plan'
            config={{ rows: 4, maxLength: 1000, showCharCount: true }}
          />

          <FormTextarea
            control={form.control}
            name='notes'
            label='Additional Notes'
            placeholder='Any additional notes or observations'
            config={{ rows: 3, maxLength: 500, showCharCount: true }}
          />

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Medical Record' : 'Create Medical Record'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
