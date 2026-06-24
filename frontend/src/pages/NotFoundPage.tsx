import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-8">
        <Droplets className="w-10 h-10 text-teal-500" />
      </div>

      <p className="text-7xl font-black text-teal-600 mb-4 tracking-tight">404</p>
      <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight mb-3">
        Page not found
      </h1>
      <p className="text-slate-500 text-sm max-w-sm mb-10 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-sm font-semibold text-white transition-all shadow-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
