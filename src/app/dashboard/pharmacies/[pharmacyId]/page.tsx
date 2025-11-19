import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import PharmacyViewPage from '@/features/pharmacies/components/pharmacy-view-page';

export const metadata = {
  title: 'Dashboard : Pharmacy'
};

type PageProps = { params: Promise<{ pharmacyId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <PharmacyViewPage pharmacyId={params.pharmacyId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
