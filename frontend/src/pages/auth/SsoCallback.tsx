import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { XCircle } from 'lucide-react';

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No authentication token received from SSO provider');
      return;
    }

    // Store token and redirect to dashboard
    try {
      setToken(token);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Failed to complete SSO authentication');
    }
  }, [searchParams, navigate, setToken]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-4">
            <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">SSO Login Failed</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-shield-600 text-white rounded-xl hover:bg-shield-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Completing SSO Login</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <div className="w-5 h-5 border-2 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
          <span>Authenticating...</span>
        </div>
      </div>
    </div>
  );
}
