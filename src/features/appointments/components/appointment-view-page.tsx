import { Appointment } from '@/types/appointment';
import { notFound } from 'next/navigation';
import AppointmentForm from './appointment-form';

type TAppointmentViewPageProps = {
  appointmentId: string;
};

export default async function AppointmentViewPage({
  appointmentId
}: TAppointmentViewPageProps) {
  let appointment = null;
  let pageTitle = 'Create New Appointment';

  if (appointmentId !== 'new') {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/appointments/${appointmentId}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        appointment = result.data as Appointment;
        pageTitle = `Edit Appointment`;
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <AppointmentForm initialData={appointment} pageTitle={pageTitle} />;
}
