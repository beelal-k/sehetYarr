import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import PatientViewPage from '@/features/patients/components/patient-view-page';

export const metadata = {
  title: 'Dashboard : Patient'
};

type PageProps = { params: Promise<{ patientId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <PatientViewPage patientId={params.patientId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
