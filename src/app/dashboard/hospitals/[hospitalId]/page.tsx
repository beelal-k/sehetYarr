import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import HospitalViewPage from '@/features/hospitals/components/hospital-view-page';

export const metadata = {
  title: 'Dashboard : Hospital'
};

type PageProps = { params: Promise<{ hospitalId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <HospitalViewPage hospitalId={params.hospitalId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
