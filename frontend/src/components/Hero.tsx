import { Link } from 'react-router-dom';
import { MapPin, AlertCircle, ArrowRight, Loader2, Droplets, Building2, Users } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { listWaterpoints } from '../lib/waterpointsApi';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || target === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 1800;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function Hero() {
  const [stats, setStats] = useState({
    waterPoints: 0,
    lgasCovered: 0,
    communitiesServed: 0,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    listWaterpoints({ limit: 1000 })
      .then((data) => {
        if (!active) return;
        const items = data.items || [];
        const uniqueLgas = new Set(
          items.map((item) => item.lga?.trim().toLowerCase()).filter(Boolean)
        );
        const uniqueCommunities = new Set(
          items.map((item) => item.community?.trim().toLowerCase()).filter(Boolean)
        );
        setStats({
          waterPoints: items.length || 20,
          lgasCovered: uniqueLgas.size || 16,
          communitiesServed: uniqueCommunities.size || 15,
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setStats({ waterPoints: 20, lgasCovered: 16, communitiesServed: 15, loading: false });
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Full-bleed hero background */}
      <div className="absolute inset-0">
        <img
          src="/hero_background.png"
          alt="Aerial view of a Nigerian community water borehole with solar panels in Kwara State"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/65" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900/90 to-transparent" />
      </div>

      {/* Decorative shape accents */}
      <div className="absolute top-0 right-0 w-96 h-96 border border-teal-400/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute top-32 right-20 w-64 h-64 border border-teal-400/5 rounded-full" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-12">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-end">

          {/* Left: Copy */}
          <div className="lg:col-span-7">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-8 animate-fade-up"
              style={{ animationDelay: '0.05s' }}
            >
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold text-teal-100 tracking-wide uppercase">
                Kwara State Water Corporation
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-white leading-[1.08] animate-fade-up"
              style={{ animationDelay: '0.18s' }}
            >
              Intelligence for{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-teal-300">Sustainable</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-teal-600/40 -z-0 rounded-sm" />
              </span>{' '}
              Water.
            </h1>

            {/* Sub-copy */}
            <p
              className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-lg animate-fade-up"
              style={{ animationDelay: '0.32s' }}
            >
              Real-time geospatial mapping and citizen-driven infrastructure monitoring for every community in Kwara State.
            </p>

            {/* CTAs */}
            <div
              className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-up"
              style={{ animationDelay: '0.46s' }}
            >
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base shadow-lg shadow-teal-900/30 transition-all duration-200 group"
              >
                <MapPin className="w-5 h-5" />
                Explore the Map
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/citizen/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border-2 border-white/25 hover:border-teal-400/60 text-white hover:text-teal-200 font-semibold text-base backdrop-blur-sm transition-all duration-200"
              >
                <AlertCircle className="w-5 h-5" />
                Report an Issue
              </Link>
            </div>
          </div>

          {/* Right: Dashboard Preview Card */}
          <div
            className="lg:col-span-5 hidden lg:block animate-slide-right"
            style={{ animationDelay: '0.38s' }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white transform hover:-translate-y-1 transition-transform duration-500">
              {/* Mock browser chrome */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-400 font-mono">
                    waterwatch.kw.gov.ng/map
                  </div>
                </div>
              </div>
              {/* Map image */}
              <div className="relative aspect-[4/3]">
                <img
                  src="/map_dashboard.png"
                  alt="Geospatial Infrastructure Map Dashboard showing Kwara State water points"
                  className="w-full h-full object-cover"
                />
                {/* Floating info card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-lg border border-slate-200/80">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-xs text-slate-950">Adewole Borehole</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ilorin West &middot; Functional</p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
                {/* Pulsing map pins */}
                <div className="absolute top-[30%] left-[44%] w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow-md animate-pulse" />
                <div className="absolute top-[46%] left-[56%] w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-md" />
                <div className="absolute top-[50%] left-[30%] w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-md animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          className="mt-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-6 sm:p-8 animate-fade-up"
          style={{ animationDelay: '0.58s' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-white/15">
            <div className="flex items-center gap-4 sm:justify-center sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <p className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                  {stats.loading ? (
                    <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
                  ) : (
                    <AnimatedCounter target={stats.waterPoints} suffix="+" />
                  )}
                </p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Water Points Mapped
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:justify-center sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <p className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                  {stats.loading ? (
                    <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
                  ) : (
                    <AnimatedCounter target={stats.lgasCovered} />
                  )}
                </p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  LGAs Covered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:justify-center sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <p className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                  {stats.loading ? (
                    <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
                  ) : (
                    <AnimatedCounter target={stats.communitiesServed} suffix="+" />
                  )}
                </p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Communities Served
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
