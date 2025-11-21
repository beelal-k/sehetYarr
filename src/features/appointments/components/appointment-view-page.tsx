import { Appointment } from '@/types/appointment';
import { notFound, redirect } from 'next/navigation';
import AppointmentForm from './appointment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCircleCheck, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        
        // If appointment is completed, show a read-only view
        if (appointment.status === 'Completed') {
          const patientName = typeof appointment.patientId === 'object' ? appointment.patientId.name : 'Unknown';
          const doctorName = typeof appointment.doctorId === 'object' ? appointment.doctorId.name : 'Unknown';
          const hospitalName = typeof appointment.hospitalId === 'object' ? appointment.hospitalId.name : 'Unknown';
          
          return (
            <Card className='mx-auto w-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconCircleCheck className='h-6 w-6 text-green-500' />
                  Appointment Completed
                </CardTitle>
                <CardDescription>
                  This appointment has been completed and cannot be edited.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <Alert className='border-green-500/50 bg-green-50 dark:bg-green-950'>
                  <IconCircleCheck className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800 dark:text-green-200'>
                    This appointment was marked as completed. The appointment details are locked and cannot be modified.
                  </AlertDescription>
                </Alert>

                <div className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Patient</p>
                      <p className='font-medium'>{patientName}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Doctor</p>
                      <p className='font-medium'>{doctorName}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Hospital</p>
                      <p className='font-medium'>{hospitalName}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Status</p>
                      <p className='font-medium text-green-600'>Completed</p>
                    </div>
                    {appointment.priority && (
                      <div>
                        <p className='text-sm text-muted-foreground'>Priority</p>
                        <p className='font-medium'>{appointment.priority}</p>
                      </div>
                    )}
                    {appointment.reason && (
                      <div className='md:col-span-2'>
                        <p className='text-sm text-muted-foreground'>Reason</p>
                        <p className='font-medium'>{appointment.reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex gap-4'>
                  <Link href='/dashboard/appointments'>
                    <Button variant='outline'>
                      <IconArrowLeft className='mr-2 h-4 w-4' />
                      Back to Appointments
                    </Button>
                  </Link>
                  <Link href='/dashboard/bills'>
                    <Button>
                      View Bills
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        }
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <AppointmentForm initialData={appointment} pageTitle={pageTitle} />;
}
