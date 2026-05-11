import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { WaterWatchLogo } from '../../components/brand/WaterWatchLogo';

export default function RegisterPage() {
  const { signUpAdmin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!inviteToken.trim()) {
      setError('Admin invite token is required.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await signUpAdmin(email, password, fullName, inviteToken.trim());
    setSubmitting(false);
    if (err) {
      setError(err === 'User already registered' ? 'An account with this email already exists.' : err);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-teal-700" />
            </div>
            <h2 className="font-heading font-800 text-2xl text-slate-900 tracking-tight mb-3">
              Admin account created
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Your account was created with the invite you provided. A verification email has been sent to the address
              you registered with.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <h3 className="font-heading font-700 text-sm text-slate-900">Verify your email first</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check your inbox and spam folder for a message from WaterWatch. Click the verification link, then sign
                  in on the admin login page.
                </p>
              </div>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
              <li>Open the verification email.</li>
              <li>Confirm your email address using the link provided.</li>
              <li>Sign in at the admin login page with your new password.</li>
            </ol>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm transition-all"
            >
              Go to admin sign in
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              Sign-in will only work after your email is verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            Join WaterWatch
          </h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            Register as an administrator to manage Kwara State's water infrastructure and respond to citizen reports.
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Register with your admin invite token to access the Water Corporation dashboard.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 flex gap-3">
            <Mail className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Use the same email the invite was issued for,</span> and
              paste the one-time token your administrator shared. After registering, you must verify your email before
              you can sign in.
            </p>
          </div>

          {error && (
            <div className="mt-6 p-3.5 rounded-xl bg-red-50 border border-red-200/60 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                placeholder="Enter your full name"
              />
            </div>

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
              <label htmlFor="inviteToken" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Admin invite token
              </label>
              <input
                id="inviteToken"
                type="text"
                required
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                placeholder="Paste invite token from admin"
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
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= level
                          ? passwordStrength === 1 ? 'bg-red-400' : passwordStrength === 2 ? 'bg-amber-400' : 'bg-teal-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 transition-colors">
              Sign in
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
