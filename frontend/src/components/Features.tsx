import { Map, Users, Filter, Wrench } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: 'Real-Time GIS Mapping',
    description:
      'Plotting coordinates of boreholes, wells, and public taps across Kwara State on an interactive, live-updating map.',
    image: '/map_dashboard.png',
    imageAlt: 'Interactive GIS map showing water points across Ilorin',
    span: 'lg:col-span-2 lg:row-span-2',
    large: true,
  },
  {
    icon: Users,
    title: 'Citizen Crowdsourcing',
    description:
      'Empowering residents to report broken infrastructure instantly with GPS coordinates and photographic evidence.',
    image: '/citizen_reporting.png',
    imageAlt: 'Nigerian citizen using mobile phone to report water infrastructure issues',
    span: 'lg:col-span-1 lg:row-span-1',
    large: false,
  },
  {
    icon: Filter,
    title: 'Smart Filtering & Analytics',
    description:
      'Filter water sources by operational status: Functional, Faulty, or Under Repair. Gain actionable insights at a glance.',
    image: null,
    imageAlt: '',
    span: 'lg:col-span-1 lg:row-span-1',
    large: false,
  },
  {
    icon: Wrench,
    title: 'Proactive Maintenance',
    description:
      'Providing actionable data for repair teams to prioritize interventions and reduce downtime of critical water assets.',
    image: '/water_infrastructure.png',
    imageAlt: 'Water tap dispensing clean water in a Nigerian community',
    span: 'lg:col-span-3 lg:row-span-1',
    large: false,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase">
              Platform Capabilities
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-slate-900 leading-tight">
            Everything you need to monitor{' '}
            <span className="text-teal-700">water infrastructure</span>
          </h2>
          <p className="mt-5 text-slate-500 text-lg leading-relaxed max-w-xl mx-auto">
            A comprehensive geospatial platform built for transparency, accountability, and rapid response in Kwara State.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;

            if (feature.large) {
              return (
                <div
                  key={feature.title}
                  className={`${feature.span} group rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden hover:border-teal-300 hover:shadow-xl transition-all duration-500 relative`}
                >
                  {/* Image area */}
                  <div className="relative h-64 lg:h-72 overflow-hidden">
                    <img
                      src={feature.image!}
                      alt={feature.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors duration-500" />
                    {/* Badge on image */}
                    <div className="absolute top-4 left-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-white/50 shadow-sm">
                        <Icon className="w-4 h-4 text-teal-700" />
                        <span className="text-xs font-bold text-slate-800">{feature.title}</span>
                      </div>
                    </div>
                  </div>
                  {/* Content area */}
                  <div className="p-7">
                    <h3 className="font-heading font-bold text-lg text-slate-900 tracking-tight mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            }

            if (feature.image) {
              return (
                <div
                  key={feature.title}
                  className={`${feature.span} group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-teal-300 hover:shadow-lg transition-all duration-500 relative`}
                >
                  {feature.span.includes('col-span-3') ? (
                    /* Wide card with side-by-side layout */
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="sm:w-2/5 relative overflow-hidden">
                        <img
                          src={feature.image}
                          alt={feature.imageAlt}
                          className="w-full h-48 sm:h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-slate-900/10" />
                      </div>
                      <div className="sm:w-3/5 p-7 flex flex-col justify-center">
                        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                          <Icon className="w-5 h-5 text-teal-700" />
                        </div>
                        <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-500 leading-relaxed text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Regular card with image on top */
                    <>
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={feature.image}
                          alt={feature.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-slate-900/10" />
                      </div>
                      <div className="p-6">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 -mt-10 relative z-10 shadow-sm">
                          <Icon className="w-4.5 h-4.5 text-teal-700" />
                        </div>
                        <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-500 leading-relaxed text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            /* Icon-only card (no image) */
            return (
              <div
                key={feature.title}
                className={`${feature.span} group rounded-2xl border border-slate-200 bg-white p-7 hover:border-teal-300 hover:shadow-lg transition-all duration-500 relative flex flex-col justify-between`}
              >
                {/* Decorative shape */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-[80px] -z-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
                {/* Mini visual element */}
                <div className="relative z-10 mt-6 flex gap-2">
                  <div className="h-1.5 w-8 rounded-full bg-teal-600" />
                  <div className="h-1.5 w-5 rounded-full bg-teal-300" />
                  <div className="h-1.5 w-3 rounded-full bg-teal-100" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
