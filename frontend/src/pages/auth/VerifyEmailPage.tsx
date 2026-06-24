import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../../lib/authApi';
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { WaterWatchLogo } from '../../components/brand/WaterWatchLogo';

type State = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<State>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMessage('No verification token found in the link. Please use the link sent to your email.');
      setState('error');
      return;
    }

    verifyEmail(token)
      .then(() => setState('success'))
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Email verification failed. The link may have expired or already been used.';
        setErrorMessage(message);
        setState('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-10 rounded-xl bg-slate-900/70 border border-slate-200/80 p-4 inline-block">
        <WaterWatchLogo className="h-10 w-auto" />
      </div>

      {state === 'verifying' && (
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-6" />
          <h2 className="font-heading font-800 text-2xl text-slate-900 mb-2">Verifying your email…</h2>
          <p className="text-sm text-slate-500">Please wait while we confirm your account.</p>
        </div>
      )}

      {state === 'success' && (
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-teal-700" />
          </div>
          <h2 className="font-heading font-800 text-2xl text-slate-900 tracking-tight mb-3">
            Email verified!
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Your account is now active. You can sign in to your citizen dashboard.
          </p>
          <Link
            to="/citizen/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm"
          >
            Sign in to your account
          </Link>
        </div>
      )}

      {state === 'error' && (
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-heading font-800 text-2xl text-slate-900 tracking-tight mb-3">
            Verification failed
          </h2>
          <p className="text-slate-500 text-sm mb-8">{errorMessage}</p>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left shadow-sm mb-8">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-cyan-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">What you can do</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  <li>Request a new verification email from the login page.</li>
                  <li>Check that you used the most recent link sent to your inbox.</li>
                  <li>Make sure the full link was copied without line breaks.</li>
                </ul>
              </div>
            </div>
          </div>

          <Link
            to="/citizen/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
