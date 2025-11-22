import Header from './components/Header';
import Hero from './components/Hero';
import AiAgent from './components/AiAgent';
import QuickActions from './components/QuickActions';
import FeatureGrid from './components/FeatureGrid';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

export const metadata = {
  title: 'SehatYarr - Landing',
  description: 'Healthcare & Telemedicine Platform',
};

export default function LandingPage() {
  return (
    <main className="w-full bg-white">
      <Header />
      <div className="pt-16">
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
