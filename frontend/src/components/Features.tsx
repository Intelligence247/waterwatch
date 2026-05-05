import { Map, Users, Filter, Wrench } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: 'Real-Time GIS Mapping',
    description:
      'Plotting coordinates of boreholes, wells, and public taps across Kwara State on an interactive, live-updating map.',
    accent: 'teal',
    span: 'lg:col-span-2 lg:row-span-1',
  },
  {
    icon: Users,
    title: 'Citizen Crowdsourcing',
    description:
      'Empowering residents to report broken infrastructure instantly with GPS coordinates and photographic evidence.',
    accent: 'cyan',
    span: 'lg:col-span-1 lg:row-span-1',
  },
  {
    icon: Filter,
    title: 'Smart Filtering & Analytics',
    description:
      'Filter water sources by operational status: Functional, Faulty, or Under Repair. Gain actionable insights at a glance.',
    accent: 'teal',
    span: 'lg:col-span-1 lg:row-span-1',
  },
  {
    icon: Wrench,
    title: 'Proactive Maintenance',
    description:
      'Providing actionable data for repair teams to prioritize interventions and reduce downtime of critical water assets.',
    accent: 'cyan',
    span: 'lg:col-span-2 lg:row-span-1',
  },
];

const accentMap: Record<string, { bg: string; icon: string; border: string }> = {
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-700',
    border: 'border-teal-200/60',
  },
  cyan: {
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
    border: 'border-cyan-200/60',
  },
};

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
          <p className="text-sm font-semibold text-teal-700 tracking-wide uppercase mb-3">
            Platform Capabilities
          </p>
          <h2 className="font-heading font-800 text-3xl sm:text-4xl tracking-tight text-slate-900">
            Everything you need to monitor water infrastructure
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            A comprehensive geospatial platform built for transparency, accountability, and rapid response.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const colors = accentMap[feature.accent];
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`${feature.span} group rounded-xl border border-slate-200 bg-white p-8 hover:shadow-md transition-all duration-300 relative overflow-hidden`}
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/0 group-hover:from-teal-50/30 group-hover:to-transparent transition-all duration-500" />

                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-5`}
                  >
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <h3 className="font-heading font-700 text-lg text-slate-900 tracking-tight mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
