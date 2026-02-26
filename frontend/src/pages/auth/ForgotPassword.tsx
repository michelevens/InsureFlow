import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/api';
import { Button, Input } from '@/components/ui';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {sent ? 'Check your email for a reset link' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-slate-700 dark:text-slate-200">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset email shortly.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Didn't receive an email? Check your spam folder or try again.
              </p>
              <Button variant="ghost" onClick={() => setSent(false)} className="mt-2">
                Try again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />
              <Button type="submit" variant="shield" size="lg" className="w-full" isLoading={loading}>
                Send Reset Link
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
