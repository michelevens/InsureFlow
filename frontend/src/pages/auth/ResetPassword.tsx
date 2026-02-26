import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/ui';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
            <p className="text-slate-700 dark:text-slate-200 mb-4">Invalid or missing reset link.</p>
            <Link to="/forgot-password" className="text-shield-600 dark:text-shield-400 font-medium hover:underline">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Set new password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Enter your new password below</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-slate-700 dark:text-slate-200">Your password has been reset successfully.</p>
              <Button variant="shield" onClick={() => navigate('/login')} className="mt-2">
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your new password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              <Button type="submit" variant="shield" size="lg" className="w-full" isLoading={loading}>
                Reset Password
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/login" className="text-sm text-shield-600 dark:text-shield-400 font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
