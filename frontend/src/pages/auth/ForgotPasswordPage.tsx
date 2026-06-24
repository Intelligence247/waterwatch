import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { forgotPassword } from '../../lib/authApi';
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { WaterWatchLogo } from '../../components/brand/WaterWatchLogo';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('role') === 'admin';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const loginPath = isAdmin ? '/login' : '/citizen/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-teal-700" />
          </div>
          <h2 className="font-heading font-800 text-2xl text-slate-900 tracking-tight mb-3">
            Check your email
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we've sent a
            password reset link. Check your inbox and spam/junk folder.
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left shadow-sm mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Next steps</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
                  <li>Open the reset email from WaterWatch.</li>
                  <li>Click the "Reset Password" link inside.</li>
                  <li>Create a new password and sign in.</li>
                </ol>
              </div>
            </div>
          </div>

          <Link
            to={loginPath}
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-700 relative overflow-hidden items-center justify-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="rounded-2xl bg-slate-950/45 backdrop-blur-sm border border-white/10 px-8 py-6 mx-auto mb-8 max-w-sm">
            <WaterWatchLogo className="w-full h-auto max-h-24 object-contain" />
          </div>
          <h1 className="font-heading font-800 text-3xl text-white tracking-tight mb-4">
            Reset your password
          </h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            Enter the email address linked to your account and we'll send you a reset link.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 rounded-xl bg-slate-900/60 border border-slate-200/80 p-4">
            <WaterWatchLogo className="h-10 w-auto max-w-full" />
          </div>

          <Link
            to={loginPath}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          <h2 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            No worries. Enter your email and we'll send you a reset link.
          </p>

          {error && (
            <div className="mt-6 p-3.5 rounded-xl bg-red-50 border border-red-200/60 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
