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

  return (
    <section id="roles" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
          <p className="text-sm font-semibold text-teal-700 tracking-wide uppercase mb-3">
            User Roles
          </p>
          <h2 className="font-heading font-800 text-3xl sm:text-4xl tracking-tight text-slate-900">
            Built for citizens and administrators
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Two distinct experiences designed for the people who use water and the people who maintain it.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <button
              onClick={() => activeTabSet('citizen')}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'citizen'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Citizens / Residents
            </button>
            <button
              onClick={() => activeTabSet('admin')}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Administrators
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/60">
              <img
                src={
                  activeTab === 'citizen'
                    ? 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800'
                    : 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'
                }
                alt={
                  activeTab === 'citizen'
                    ? 'Citizen using mobile app to report water issue - replace with actual screenshot'
                    : 'Administrator reviewing dashboard - replace with actual screenshot'
                }
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-200/10 to-cyan-200/10 rounded-3xl blur-2xl -z-10" />
          </div>

          {/* Right: Capabilities */}
          <div className="order-1 lg:order-2">
            <div className="space-y-6">
              {(activeTab === 'citizen' ? citizenCapabilities : adminCapabilities).map(
                (cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <div
                      key={i}
                      className="flex gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                        <Icon className="w-5 h-5 text-teal-700" />
                      </div>
                      <div>
                        <h3 className="font-heading font-700 text-base text-slate-900 tracking-tight mb-1">
                          {cap.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {cap.description}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
