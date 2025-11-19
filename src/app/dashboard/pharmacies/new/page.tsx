import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import PharmacyViewPage from '@/features/pharmacies/components/pharmacy-view-page';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Add New Pharmacy'
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-4">
        <Suspense fallback={<div>Loading...</div>}>
          <PharmacyViewPage pharmacyId="new" />
        </Suspense>
      </div>
    </PageContainer>
  );
}