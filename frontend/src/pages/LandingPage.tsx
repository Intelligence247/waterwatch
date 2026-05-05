import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import UserRoles from '../components/UserRoles';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Hero />
      <Features />
      <UserRoles />
      <Footer />
    </div>
  );
}
