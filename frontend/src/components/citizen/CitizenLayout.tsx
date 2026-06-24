import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Settings,
} from 'lucide-react';
import { WaterWatchLogo } from '../brand/WaterWatchLogo';

const sidebarLinks = [
  { to: '/citizen', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/citizen/explore', icon: Map, label: 'Explore Map', end: false },
  { to: '/citizen/reports', icon: AlertTriangle, label: 'My Reports', end: false },
  { to: '/citizen/community', icon: MessageSquare, label: 'Community', end: false },
  { to: '/citizen/settings', icon: Settings, label: 'Settings', end: false },
];

const breadcrumbMap: Record<string, string> = {
  '/citizen': 'Overview',
  '/citizen/explore': 'Explore Map',
  '/citizen/reports': 'My Reports',
  '/citizen/community': 'Community',
  '/citizen/settings': 'Settings',
};

export default function CitizenLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/citizen/login');
  };

  const currentPage = breadcrumbMap[location.pathname] || 'Overview';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="min-h-16 flex flex-col gap-2 px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <WaterWatchLogo className="h-8 w-auto min-w-0 flex-1 max-h-8" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 w-fit">
            CITIZEN
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-cyan-700">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {profile?.full_name || 'Citizen'}
              </p>
              <p className="text-xs text-slate-400 truncate">{profile?.community || 'Community Member'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 sm:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-400">Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-700">{currentPage}</span>
          </div>

          <div className="flex-1" />

          <a
            href="/map"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Public Map
          </a>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
