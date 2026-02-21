import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { Shield, Users, Mail, Lock, User } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Invalid Invitation</h1>
            <p className="text-red-600 mt-2">{error}</p>
            <Button variant="shield" className="mt-6" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-shield mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join {invite.agency_name}</h1>
          <p className="text-slate-500 mt-1">
            You've been invited as <span className="font-semibold text-teal-700">{invite.role}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          {/* Invite info card */}
          <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100 mb-6">
            <Users className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-teal-900">{invite.inviter_name} invited you</p>
              <p className="text-xs text-teal-600">to join {invite.agency_name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
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

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
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
