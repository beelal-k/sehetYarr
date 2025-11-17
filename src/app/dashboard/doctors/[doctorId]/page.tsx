import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import DoctorViewPage from '@/features/doctors/components/doctor-view-page';

export const metadata = {
  title: 'Dashboard : Doctor'
};

type PageProps = { params: Promise<{ doctorId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <DoctorViewPage doctorId={params.doctorId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
