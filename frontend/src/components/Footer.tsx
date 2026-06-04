import { Droplets } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="about" className="bg-slate-900 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-900/20 rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-teal-900/10 rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-extrabold text-lg text-white tracking-tight">
                WaterWatch
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              A modern geospatial information system designed for the Kwara State Water Corporation to digitize and monitor community water resources across all local government areas.
            </p>
            {/* Mini trust strip */}
            <div className="mt-6 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-700/60 max-w-[60px]" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                University of Ilorin · Final Year Project
              </span>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1" />

          {/* Links */}
          <div className="md:col-span-3">
            <h4 className="font-heading font-bold text-sm text-white tracking-tight mb-5">
              Platform
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/#features" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#roles" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  User Roles
                </a>
              </li>
              <li>
                <a href="/map" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Live Map
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-heading font-bold text-sm text-white tracking-tight mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Kwara State Water Corporation. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Built with care for the people of Kwara State.
          </p>
        </div>
      </div>
    </footer>
  );
}
