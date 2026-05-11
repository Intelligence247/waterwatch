import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import { resendVerification } from '../../lib/authApi';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { WaterWatchLogo } from '../../components/brand/WaterWatchLogo';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err, fullName } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err === 'Invalid login credentials' ? 'Invalid email or password.' : err);
      return;
    }
    const name = fullName?.trim().split(/\s+/)[0];
    toast(
      'success',
      name ? `Signed in successfully. Welcome back, ${name}.` : 'Signed in successfully. Welcome to the admin dashboard.',
    );
    navigate('/admin');
  };

  const handleResend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast('warning', 'Enter your email address to resend verification.');
      return;
    }
    setResending(true);
    try {
      await resendVerification(trimmed);
      toast('success', 'Verification email sent. Check your inbox and spam/junk folder.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification email.';
      toast('error', message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-700 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="rounded-2xl bg-slate-950/45 backdrop-blur-sm border border-white/10 px-8 py-6 mx-auto mb-8 max-w-sm">
            <WaterWatchLogo className="w-full h-auto max-h-24 object-contain" />
          </div>
          <h1 className="font-heading font-800 text-3xl text-white tracking-tight mb-4">
            WaterWatch Admin
          </h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            Manage water infrastructure, verify citizen reports, and keep Kwara State's water assets operational.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 rounded-xl bg-slate-900/60 border border-slate-200/80 p-4">
            <WaterWatchLogo className="h-10 w-auto max-w-full" />
          </div>

          <h2 className="font-heading font-800 text-2xl text-slate-900 tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Access the Water Corporation management dashboard.
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
                placeholder="admin@waterwatch.kw.gov.ng"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending}
              className="text-sm font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {resending ? 'Sending...' : "Didn't receive the verification email?"}{" "}
              {!resending ? 'Resend' : null}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800 transition-colors">
              Create one
            </Link>
          </p>

          <p className="mt-4 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Back to public site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
