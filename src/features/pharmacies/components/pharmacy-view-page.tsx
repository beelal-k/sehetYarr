import { Pharmacy } from '@/types/pharmacy';
import { notFound } from 'next/navigation';
import PharmacyForm from './pharmacy-form';

type TPharmacyViewPageProps = {
  pharmacyId: string;
};

export default async function PharmacyViewPage({
  pharmacyId
}: TPharmacyViewPageProps) {
  let pharmacy = null;
  let pageTitle = 'Create New Pharmacy';

  if (pharmacyId !== 'new') {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pharmacies/${pharmacyId}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        pharmacy = result.data as Pharmacy;
        pageTitle = `Edit Pharmacy`;
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    }
  }

  return <PharmacyForm initialData={pharmacy} pageTitle={pageTitle} />;
}