import { useState } from 'react';
import {
  MapPin,
  Search,
  Camera,
  Shield,
  CheckCircle,
  Trash2,
  Users,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

const citizenCapabilities = [
  {
    icon: MapPin,
    title: 'View the Interactive Public Map',
    description: 'Find nearby water sources across Kwara State with real-time status updates.',
  },
  {
    icon: Search,
    title: 'Search Streets & Communities',
    description: 'Locate specific streets or communities to check water availability.',
  },
  {
    icon: Camera,
    title: 'Report a Fault with Evidence',
    description: 'Capture GPS coordinates, upload photographic evidence, and add descriptions for broken infrastructure.',
  },
];

const adminCapabilities = [
  {
    icon: Shield,
    title: 'Secure Management Dashboard',
    description: 'Access an authenticated dashboard to manage all water assets and reports.',
  },
  {
    icon: CheckCircle,
    title: 'Verify Citizen Reports',
    description: 'Review uploaded photos and descriptions, then verify or dismiss reports.',
  },
  {
    icon: UserCheck,
    title: 'Update Operational Status',
    description: "Change asset status from 'Faulty' to 'Repaired' to update the live public map instantly.",
  },
  {
    icon: Trash2,
    title: 'Manage Asset Records',
    description: 'Delete or manage water asset records to keep the system accurate and current.',
  },
];

export default function UserRoles() {
  const [activeTab, activeTabSet] = useState<'citizen' | 'admin'>('citizen');

  const capabilities = activeTab === 'citizen' ? citizenCapabilities : adminCapabilities;

  return (
    <section id="roles" className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-50/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-50/30 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase">
              User Roles
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-slate-900 leading-tight">
            Built for <span className="text-teal-700">citizens</span> and{' '}
            <span className="text-teal-700">administrators</span>
          </h2>
          <p className="mt-5 text-slate-500 text-lg leading-relaxed max-w-xl mx-auto">
            Two distinct experiences designed for the people who use water and the people who maintain it.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-16">
          <div className="relative inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {/* Sliding indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-teal-700 shadow-sm transition-all duration-300 ease-out"
              style={{
                left: activeTab === 'citizen' ? '6px' : 'calc(50% + 3px)',
                width: 'calc(50% - 9px)',
              }}
            />

            <button
              onClick={() => activeTabSet('citizen')}
              className={`relative z-10 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-colors duration-200 min-w-[180px] sm:min-w-[200px] ${
                activeTab === 'citizen' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Citizens / Residents
            </button>

            <button
              onClick={() => activeTabSet('admin')}
              className={`relative z-10 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-colors duration-200 min-w-[180px] sm:min-w-[200px] ${
                activeTab === 'admin' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              Administrators
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
              <img
                src={
                  activeTab === 'citizen'
                    ? '/citizen_reporting.png'
                    : '/admin_monitoring.png'
                }
                alt={
                  activeTab === 'citizen'
                    ? 'Nigerian citizen using mobile app to report water tap fault'
                    : 'Water Corporation administrator reviewing system dashboard'
                }
                className="w-full aspect-[4/3] object-cover transition-opacity duration-300"
              />
              {/* Bottom info bar overlaid on image */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                    {activeTab === 'citizen' ? (
                      <Camera className="w-5 h-5 text-teal-700" />
                    ) : (
                      <Shield className="w-5 h-5 text-teal-700" />
                    )}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-slate-900">
                      {activeTab === 'citizen' ? 'Citizen Reporting' : 'Admin Dashboard'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeTab === 'citizen'
                        ? 'Report faults with GPS & photo evidence'
                        : 'Monitor, verify & manage water assets'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </div>
              </div>
            </div>
            {/* Decorative circle */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border-2 border-teal-100 -z-10" />
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full border-2 border-teal-50 -z-10" />
          </div>

          {/* Right: Capabilities */}
          <div className="order-1 lg:order-2">
            <div className="space-y-4">
              {capabilities.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={`${activeTab}-${i}`}
                    className="flex gap-4 p-5 rounded-xl border border-slate-200/70 bg-white hover:border-teal-200 hover:shadow-md transition-all duration-300 group"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-teal-100 group-hover:scale-105">
                      <Icon className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-slate-900 tracking-tight mb-1">
                        {cap.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
