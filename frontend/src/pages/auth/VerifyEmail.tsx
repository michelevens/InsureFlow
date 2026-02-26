import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    api.get<{ message: string }>(`/auth/verify-email/${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => navigate('/dashboard'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-6" />

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Verifying your email...</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Please wait a moment</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email Verified!</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{message}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">Redirecting to dashboard...</p>
              <Button
                variant="shield"
                size="lg"
                className="w-full mt-6"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Verification Failed</h1>
              <p className="text-red-600 dark:text-red-400 mt-2">{message}</p>
              <div className="mt-6 space-y-3">
                <Link to="/dashboard">
                  <Button variant="shield" size="lg" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full mt-2">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
