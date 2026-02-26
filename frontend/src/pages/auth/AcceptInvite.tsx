import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { Users, Mail, Lock, User, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = upper + lower + digits + symbols;
  // Guarantee at least one of each category
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 12 }, () => pick(all));
  // Shuffle
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string; checks: { label: string; met: boolean }[] } {
  const checks = [
    { label: '8+ characters', met: pw.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'Number', met: /\d/.test(pw) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.met).length;
  const config = score <= 1 ? { label: 'Weak', color: 'bg-red-500' }
    : score <= 2 ? { label: 'Fair', color: 'bg-orange-500' }
    : score <= 3 ? { label: 'Good', color: 'bg-amber-500' }
    : score <= 4 ? { label: 'Strong', color: 'bg-teal-500' }
    : { label: 'Very Strong', color: 'bg-green-500' };
  return { score, ...config, checks };
}

interface InviteInfo {
  email: string;
  role: string;
  agency_name: string;
  inviter_name: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<InviteInfo>(`/invites/${token}`)
      .then((data) => {
        setInvite(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Invalid or expired invite');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string }>(`/invites/${token}/accept`, {
        name,
        password,
        password_confirmation: passwordConfirm,
      });
      localStorage.setItem('auth_token', res.token);
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Invitation</h1>
            <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
            <Button variant="shield" className="mt-6" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join {invite.agency_name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            You've been invited as <span className="font-semibold text-teal-700">{invite.role}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
          {/* Invite info card */}
          <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-100 mb-6">
            <Users className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-teal-900">{invite.inviter_name} invited you</p>
              <p className="text-xs text-teal-600">to join {invite.agency_name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}

            <Input
              label="Email"
              type="email"
              value={invite.email}
              disabled
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Full Name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            {/* Password with strength meter + generator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    const pw = generateStrongPassword();
                    setPassword(pw);
                    setPasswordConfirm(pw);
                    setShowPassword(true);
                    navigator.clipboard.writeText(pw).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Generate Strong Password
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {password && (
                    <button type="button" onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300" title="Copy">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Strength bar */}
              {password && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength.score >= 4 ? 'text-green-600 dark:text-green-400' : strength.score >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {strength.checks.map(c => (
                        <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.met ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {c.met ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300 inline-block" />}
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            <Button type="submit" variant="shield" size="lg" className="w-full" isLoading={submitting}>
              Accept & Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
