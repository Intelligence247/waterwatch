import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { WaterWatchLogo } from './brand/WaterWatchLogo';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Roles', href: '/#roles' },
  { label: 'About', href: '/#about' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, userRole } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/#')) {
      if (location.pathname === '/') {
        const el = document.querySelector(href.replace('/', ''));
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center group py-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
            aria-label="WaterWatch home"
          >
            <WaterWatchLogo className="w-full h-auto max-h-10" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/map"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors px-4 py-2"
            >
              Explore Map
            </Link>
            {user ? (
              <Link
                to={userRole === 'admin' ? '/admin' : '/citizen'}
                className="text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-xl px-4 py-2 shadow-sm shadow-teal-500/10 hover:shadow-teal-500/20 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/citizen/login"
                className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors px-4 py-2"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                to="/map"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
              >
                Explore Map
              </Link>
              {user ? (
                <Link
                  to={userRole === 'admin' ? '/admin' : '/citizen'}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/citizen/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-cyan-700 hover:bg-cyan-50 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
