import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Select } from '@/components/ui';
import { Shield, User, Mail, Lock } from 'lucide-react';

const roleOptions = [
  { value: 'consumer', label: 'I need insurance (Consumer)' },
  { value: 'agent', label: 'I sell insurance (Agent)' },
  { value: 'agency_owner', label: 'I run an agency (Agency Owner)' },
  { value: 'carrier', label: 'I represent a carrier (Carrier)' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', role: '' as 'consumer' | 'agent' | 'agency_owner' | 'carrier' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { setError('Please select a role'); return; }
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-shield mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
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
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />
            <Select
              label="I am a..."
              options={roleOptions}
              placeholder="Select your role"
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={form.password_confirmation}
              onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />
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
