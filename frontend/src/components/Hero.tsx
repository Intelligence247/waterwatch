import { Link } from 'react-router-dom';
import { MapPin, AlertCircle, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f766e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/60 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-semibold text-teal-700 tracking-wide uppercase">
                Kwara State Water Corporation
              </span>
            </div>

            <h1 className="font-heading font-800 text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-[1.1]">
              Intelligence for{' '}
              <span className="relative">
                <span className="relative z-10 text-teal-700">Sustainable</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-teal-100/60 -z-0 rounded-sm" />
              </span>{' '}
              Water.
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-md">
              Empowering Kwara State with real-time geospatial mapping and citizen-driven infrastructure monitoring.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-sm hover:shadow-md transition-all group"
              >
                <MapPin className="w-4.5 h-4.5" />
                Explore the Map
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/citizen/login"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl border-2 border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 font-semibold transition-all"
              >
                <AlertCircle className="w-4.5 h-4.5" />
                Report an Issue
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 flex gap-10">
              <div>
                <p className="font-heading font-700 text-2xl text-slate-900 tracking-tight">20+</p>
                <p className="text-sm text-slate-500 mt-0.5">Water Points</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="font-heading font-700 text-2xl text-slate-900 tracking-tight">16</p>
                <p className="text-sm text-slate-500 mt-0.5">LGAs Covered</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="font-heading font-700 text-2xl text-slate-900 tracking-tight">Real-time</p>
                <p className="text-sm text-slate-500 mt-0.5">Monitoring</p>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
              {/* Mock dashboard header */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-slate-100 text-xs text-slate-400 font-mono">
                    waterwatch.kw.gov.ng/map
                  </div>
                </div>
              </div>
              {/* Map placeholder */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-teal-50 via-cyan-50 to-slate-50">
                <img
                  src="https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Aerial view of water infrastructure - replace with actual map screenshot"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* Overlay UI elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
                {/* Floating card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/60">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <p className="font-heading font-700 text-sm text-slate-900">Adewole Borehole</p>
                      <p className="text-xs text-slate-500 mt-0.5">Ilorin West &middot; Functional</p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
                {/* Map pins */}
                <div className="absolute top-[25%] left-[35%] w-6 h-6 rounded-full bg-teal-600 border-2 border-white shadow-md animate-pulse" />
                <div className="absolute top-[40%] left-[55%] w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-md animate-pulse" />
                <div className="absolute top-[55%] left-[30%] w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-md animate-pulse" />
                <div className="absolute top-[30%] left-[70%] w-6 h-6 rounded-full bg-teal-600 border-2 border-white shadow-md animate-pulse" />
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-200/20 to-cyan-200/20 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
