import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Header from './landing/components/Header';
import Hero from './landing/components/Hero';
import AiAgent from './landing/components/AiAgent';
import QuickActions from './landing/components/QuickActions';
import FeatureGrid from './landing/components/FeatureGrid';
import Testimonials from './landing/components/Testimonials';
import CTA from './landing/components/CTA';
import Footer from './landing/components/Footer';

export default async function Page() {
  const { userId } = await auth();

  // If the user is authenticated, go to dashboard.
  if (userId) {
    redirect('/dashboard/overview');
  }

  // Not authenticated: render the landing page (server component)
  return (
    <main className='w-full bg-white'>
      <Header />
      <div className='pt-16'>
        <Hero />
        <AiAgent />
        <QuickActions />
        <FeatureGrid />
        <Testimonials />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
