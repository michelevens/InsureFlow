import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/api';
import { Button, Input, Select } from '@/components/ui';
import { User, Mail, Lock, Building2, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const roleOptions = [
  { value: 'consumer', label: 'I need insurance (Consumer)' },
  { value: 'agent', label: 'I sell insurance (Agent)' },
  { value: 'agency_owner', label: 'I run an agency (Agency Owner)' },
  { value: 'carrier', label: 'I represent a carrier (Carrier)' },
];

function getPasswordStrength(password: string) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.met).length;
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', checks };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500', checks };
  if (score <= 4) return { score, label: 'Good', color: 'bg-teal-500', checks };
  return { score, label: 'Strong', color: 'bg-green-500', checks };
}

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + nums + special;
  let pw = '';
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += nums[Math.floor(Math.random() * nums.length)];
  pw += special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 14; i++) pw += all[Math.floor(Math.random() * all.length)];
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: '' as 'consumer' | 'agent' | 'agency_owner' | 'carrier',
    agency_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) { setEmailStatus('idle'); return; }
    setEmailStatus('checking');
    try {
      const res = await authService.checkEmail(email);
      setEmailStatus(res.exists ? 'taken' : 'available');
    } catch {
      setEmailStatus('idle');
    }
  }, []);

  const handleSuggestPassword = () => {
    const pw = generateStrongPassword();
    setForm(f => ({ ...f, password: pw, password_confirmation: pw }));
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { setError('Please select a role'); return; }
    if (emailStatus === 'taken') { setError('This email is already registered'); return; }
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
        agency_code: form.agency_code || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);
  const showAgencyCode = form.role === 'agent';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1">Join Insurons and get started</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
            <Input
              label="Full Name"
              placeholder="John Smith"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            {/* Email with availability check */}
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setEmailStatus('idle'); }}
                onBlur={() => checkEmail(form.email)}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />
              {emailStatus === 'checking' && (
                <p className="text-xs text-slate-400 mt-1">Checking availability...</p>
              )}
              {emailStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Email is available
                </p>
              )}
              {emailStatus === 'taken' && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Email is already registered.{' '}
                  <Link to="/login" className="underline">Sign in instead?</Link>
                </p>
              )}
            </div>

            <Select
              label="I am a..."
              options={roleOptions}
              placeholder="Select your role"
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}
            />

            {/* Agency Code (shown for agents) */}
            {showAgencyCode && (
              <div>
                <Input
                  label="Agency Code (optional)"
                  placeholder="e.g. MARTINEZ"
                  value={form.agency_code}
                  onChange={(e) => setForm(f => ({ ...f, agency_code: e.target.value.toUpperCase() }))}
                  leftIcon={<Building2 className="w-5 h-5" />}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Have an agency code? Enter it to join your agency automatically.
                </p>
              </div>
            )}

            {/* Password with strength meter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={handleSuggestPassword}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Suggest strong password
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength indicator */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength.score ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 2 ? 'text-red-600' :
                    strength.score <= 3 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {strength.label}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {strength.checks.map(c => (
                      <span key={c.label} className={`text-xs flex items-center gap-0.5 ${c.met ? 'text-green-600' : 'text-slate-400'}`}>
                        {c.met ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={form.password_confirmation}
              onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />
            {form.password_confirmation && form.password !== form.password_confirmation && (
              <p className="text-xs text-red-600 flex items-center gap-1 -mt-3">
                <XCircle className="w-3.5 h-3.5" /> Passwords do not match
              </p>
            )}

            <Button type="submit" variant="shield" size="lg" className="w-full" isLoading={loading}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-shield-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
