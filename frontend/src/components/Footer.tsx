import { Droplets } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="about" className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-800 text-lg tracking-tight text-slate-900">
                Water<span className="text-teal-700">Watch</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              A modern geospatial information system designed for the Kwara State Water Corporation to digitize and monitor community water resources.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-700 text-sm text-slate-900 tracking-tight mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/#features" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#roles" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
                  User Roles
                </a>
              </li>
              <li>
                <a href="/map" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
                  Live Map
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-700 text-sm text-slate-900 tracking-tight mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 hover:text-teal-700 transition-colors">
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Kwara State Water Corporation. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Built with care for the people of Kwara State.
          </p>
        </div>
      </div>
    </footer>
  );
}
