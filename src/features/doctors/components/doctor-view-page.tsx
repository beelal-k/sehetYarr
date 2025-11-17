import { Doctor } from '@/types/doctor';
import { notFound } from 'next/navigation';
import DoctorForm from './doctor-form';

type TDoctorViewPageProps = {
  doctorId: string;
};

export default async function DoctorViewPage({
  doctorId
}: TDoctorViewPageProps) {
  let doctor = null;
  let pageTitle = 'Create New Doctor';

  if (doctorId !== 'new') {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/doctors/${doctorId}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        doctor = result.data as Doctor;
        pageTitle = `Edit Doctor`;
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <DoctorForm initialData={doctor} pageTitle={pageTitle} />;
}
