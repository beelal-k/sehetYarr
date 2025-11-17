import { Hospital } from '@/types/hospital';
import { notFound } from 'next/navigation';
import HospitalForm from './hospital-form';

type THospitalViewPageProps = {
  hospitalId: string;
};

export default async function HospitalViewPage({
  hospitalId
}: THospitalViewPageProps) {
  let hospital = null;
  let pageTitle = 'Create New Hospital';

  if (hospitalId !== 'new') {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hospitals/${hospitalId}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        hospital = result.data as Hospital;
        pageTitle = `Edit Hospital`;
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <HospitalForm initialData={hospital} pageTitle={pageTitle} />;
}
