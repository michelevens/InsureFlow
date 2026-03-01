import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { Shield, Mail, Lock, User, Building2, Briefcase, ShieldCheck, Zap, ArrowLeft, KeyRound } from 'lucide-react';

const demoAccounts = [
  { email: 'consumer@insurons.com', label: 'Consumer', icon: User, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { email: 'agent@insurons.com', label: 'Agent', icon: Briefcase, color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
  { email: 'agency@insurons.com', label: 'Agency Owner', icon: Building2, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { email: 'carrier@insurons.com', label: 'Carrier', icon: ShieldCheck, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { email: 'admin@insurons.com', label: 'Admin', icon: Shield, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
];

export default function Login() {
  const { login, demoLogin, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  // MFA state
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const mfaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mfaToken && mfaInputRef.current) {
      mfaInputRef.current.focus();
    }
  }, [mfaToken, useBackupCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.mfa_token) {
        setMfaToken(result.mfa_token);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken || !mfaCode.trim()) return;
    setError('');
    setLoading(true);
    try {
      await verifyMfa(mfaToken, mfaCode.trim());
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      setMfaCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaCodeChange = (value: string) => {
    const cleaned = useBackupCode ? value : value.replace(/\D/g, '').slice(0, 6);
    setMfaCode(cleaned);
    // Auto-submit on 6 digits for TOTP
    if (!useBackupCode && cleaned.length === 6 && mfaToken) {
      setError('');
      setLoading(true);
      verifyMfa(mfaToken, cleaned)
        .then(() => navigate('/dashboard'))
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Invalid verification code');
          setMfaCode('');
        })
        .finally(() => setLoading(false));
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

  // MFA verification screen
  if (mfaToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-shield-50 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-shield-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
            <p className="text-slate-500 mt-1">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              {useBackupCode ? (
                <Input
                  ref={mfaInputRef}
                  label="Backup Code"
                  placeholder="Enter backup code"
                  value={mfaCode}
                  onChange={(e) => handleMfaCodeChange(e.target.value)}
                  leftIcon={<Shield className="w-5 h-5" />}
                  required
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
                  <input
                    ref={mfaInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => handleMfaCodeChange(e.target.value)}
                    className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 px-4 rounded-xl border border-slate-200 focus:border-shield-500 focus:ring-2 focus:ring-shield-500/20 outline-none transition-all"
                    maxLength={6}
                    required
                  />
                </div>
              )}

              <Button type="submit" variant="shield" size="lg" className="w-full" isLoading={loading}>
                Verify
              </Button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setUseBackupCode(!useBackupCode); setMfaCode(''); setError(''); }}
                  className="text-sm text-shield-600 hover:underline"
                >
                  {useBackupCode ? 'Use authenticator app' : 'Use a backup code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMfaToken(null); setMfaCode(''); setError(''); }}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to your Insurons account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
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
              <Link to="/forgot-password" className="text-sm text-shield-600 hover:underline">
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
            <span className="text-sm font-medium text-slate-600">Quick Demo Login</span>
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
          <p className="text-xs text-slate-400 mt-2 text-center">
            All demo accounts use password: <code className="text-slate-500">password</code>
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-shield-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
