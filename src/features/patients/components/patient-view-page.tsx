import { Patient } from '@/types/patient';
import { notFound } from 'next/navigation';
import PatientForm from './patient-form';

type TPatientViewPageProps = {
  patientId: string;
};

export default async function PatientViewPage({
  patientId
}: TPatientViewPageProps) {
  let patient = null;
  let pageTitle = 'Create New Patient';

  if (patientId !== 'new') {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/patients/${patientId}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        patient = result.data as Patient;
        pageTitle = `Edit Patient`;
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <PatientForm initialData={patient} pageTitle={pageTitle} />;
}
