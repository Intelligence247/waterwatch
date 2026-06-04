import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import ImpactBanner from '../components/ImpactBanner';
import UserRoles from '../components/UserRoles';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <ImpactBanner />
      <UserRoles />
      <Footer />
    </div>
  );
}
