import { MedicalRecord } from '@/types/medical-record';
import { notFound } from 'next/navigation';
import MedicalRecordForm from './medical-record-form';

type TMedicalRecordViewPageProps = {
  medicalRecordId: string;
};

export default async function MedicalRecordViewPage({
  medicalRecordId
}: TMedicalRecordViewPageProps) {
  let medicalRecord = null;
  let pageTitle = 'Create New Medical Record';

  if (medicalRecordId !== 'new') {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/medical-records/${medicalRecordId}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        medicalRecord = result.data as MedicalRecord;
        pageTitle = `Edit Medical Record`;
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <MedicalRecordForm initialData={medicalRecord} pageTitle={pageTitle} />;
}
