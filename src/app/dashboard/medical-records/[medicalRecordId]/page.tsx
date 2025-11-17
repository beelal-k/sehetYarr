import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import MedicalRecordViewPage from '@/features/medical-records/components/medical-record-view-page';

export const metadata = {
  title: 'Dashboard : Medical Record'
};

type PageProps = { params: Promise<{ medicalRecordId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <MedicalRecordViewPage medicalRecordId={params.medicalRecordId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
