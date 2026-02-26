import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { Shield, Mail, Lock, User, Building2, Briefcase, ShieldCheck, Zap } from 'lucide-react';

const demoAccounts = [
  { email: 'consumer@insurons.com', label: 'Consumer', icon: User, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/40' },
  { email: 'agent@insurons.com', label: 'Agent', icon: Briefcase, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 border-teal-200 hover:bg-teal-100' },
  { email: 'agency@insurons.com', label: 'Agency Owner', icon: Building2, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 hover:bg-purple-100' },
  { email: 'carrier@insurons.com', label: 'Carrier', icon: ShieldCheck, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/40' },
  { email: 'admin@insurons.com', label: 'Admin', icon: Shield, color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40' },
];

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setDemoLoading(demoEmail);
    try {
      await demoLogin(demoEmail);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to your Insurons account</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
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
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-shield-600 dark:text-shield-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="shield" size="lg" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Quick Demo Login</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.email}
                  onClick={() => handleDemoLogin(demo.email)}
                  disabled={demoLoading !== null}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${demo.color} disabled:opacity-50`}
                >
                  {demoLoading === demo.email ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {demo.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            All demo accounts use password: <code className="text-slate-500 dark:text-slate-400">password</code>
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-shield-600 dark:text-shield-400 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
