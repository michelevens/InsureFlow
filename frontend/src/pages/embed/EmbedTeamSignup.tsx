import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import {
  User, Mail, Phone, Lock, CheckCircle2, Shield, Building2,
  Eye, EyeOff, ArrowRight,
} from 'lucide-react';
import { api } from '@/services/api/client';

interface AgencyInfo {
  partner_name: string;
  agency: {
    name: string;
    city: string | null;
    state: string | null;
    description: string | null;
  };
  widget_config: Record<string, unknown> | null;
}

export default function EmbedTeamSignup() {
  const [params] = useSearchParams();
  const apiKey = params.get('key') || '';

  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Load agency config
  useEffect(() => {
    if (!apiKey) {
      setError('Missing widget key');
      setLoading(false);
      return;
    }
    api.get<AgencyInfo>(`/embed/team-config/${apiKey}`)
      .then(data => { setAgency(data); setLoading(false); })
      .catch(() => { setError('Invalid Widget Key'); setLoading(false); });
  }, [apiKey]);

  // PostMessage resize
  useEffect(() => {
    const send = () => {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'insurons:resize', height: h }, '*');
    };
    send();
    const obs = new MutationObserver(send);
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => obs.disconnect();
  }, []);

  const widgetConfig = agency?.widget_config as Record<string, string> | null;
  const primaryColor = widgetConfig?.primary_color || '#2563eb';
  const displayName = widgetConfig?.company_name || agency?.agency.name || '';

  const passwordStrength = (() => {
    if (password.length < 8) return 0;
    let s = 1;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][passwordStrength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (password !== passwordConfirm) {
      setFormError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/embed/team-signup', {
        api_key: apiKey,
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirm,
      });
      setSuccess(true);
      window.parent.postMessage({
        type: 'insurons:team-signup',
        name,
        email,
      }, '*');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: primaryColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <Shield size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 600, fontSize: 18 }}>{error}</p>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Please check the widget configuration.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        maxWidth: 480,
        margin: '0 auto',
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <CheckCircle2 size={40} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
          Application Submitted!
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
          Thank you, <strong>{name}</strong>. Your application to join{' '}
          <strong>{displayName}</strong> has been received.
        </p>
        <div style={{
          background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12,
          padding: 16, textAlign: 'left', marginBottom: 24,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#0369a1', fontSize: 14 }}>What happens next?</p>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: 14, lineHeight: 1.8 }}>
            <li>The agency will review your application</li>
            <li>Once approved, you'll receive login credentials</li>
            <li>Access the full Insurons agent platform</li>
          </ul>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          Powered by <a href="https://insurons.com" target="_blank" rel="noopener" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 600 }}>Insurons</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      maxWidth: 480,
      margin: '0 auto',
      padding: '24px 20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}30)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <Building2 size={28} color={primaryColor} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
          Join {displayName}
        </h1>
        {agency?.agency.city && agency?.agency.state && (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>
            {agency.agency.city}, {agency.agency.state}
          </p>
        )}
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          Apply to become a licensed agent with access to 50+ carriers, CRM tools, and the Insurons platform.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Full Name *
          </label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Smith"
              required
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Email Address *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@email.com"
              required
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Phone Number
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <Input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Password *
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              style={{ paddingLeft: 36, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= passwordStrength ? strengthColor : '#e2e8f0',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: strengthColor, fontWeight: 500 }}>{strengthLabel}</p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Confirm Password *
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="Confirm your password"
              required
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        {formError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 14,
          }}>
            {formError}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || !name || !email || !password || !passwordConfirm}
          style={{
            width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600,
            background: primaryColor, color: '#fff', border: 'none',
            borderRadius: 10, cursor: 'pointer',
            opacity: submitting ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {submitting ? 'Submitting...' : 'Apply to Join'}
          {!submitting && <ArrowRight size={18} />}
        </Button>
      </form>

      {/* Trust bar */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
          {[
            { icon: Shield, text: '256-bit SSL' },
            { icon: CheckCircle2, text: 'Verified Agency' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
              <Icon size={14} /> {text}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>
          Powered by <a href="https://insurons.com" target="_blank" rel="noopener" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 600 }}>Insurons</a>
        </p>
      </div>
    </div>
  );
}
