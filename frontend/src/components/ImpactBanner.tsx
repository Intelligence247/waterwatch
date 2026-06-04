import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ImpactBanner() {
  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed image */}
      <div className="relative h-[420px] sm:h-[480px] lg:h-[520px]">
        <img
          src="/community_water.png"
          alt="Nigerian women and children gathering water at a solar-powered borehole in Kwara State"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-900/60" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-xl">
              {/* Decorative line */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-teal-400" />
                <span className="text-xs font-bold text-teal-300 tracking-wider uppercase">
                  Our Impact
                </span>
              </div>

              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                Bringing water transparency to every community.
              </h2>

              <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-md">
                Every water point we map helps a community gain visibility and accountability for their most essential resource.
              </p>

              <Link
                to="/map"
                className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-900/30 transition-all duration-200 group"
              >
                See it in action
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative corner shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 border border-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-8 right-12 w-20 h-20 border-2 border-white/10 rounded-full hidden lg:block" />
      </div>
    </section>
  );
}
