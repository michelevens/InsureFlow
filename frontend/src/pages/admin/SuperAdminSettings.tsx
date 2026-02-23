import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/services/api/client';

const tabs = [
  { id: 'platform', label: 'Platform' },
  { id: 'billing', label: 'Billing' },
  { id: 'email', label: 'Email' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
];

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Platform
  const [platformName, setPlatformName] = useState('InsureFlow');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [defaultTimezone, setDefaultTimezone] = useState('America/New_York');

  // Billing
  const [stripeConnected, setStripeConnected] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [stripeTestResult, setStripeTestResult] = useState('');

  // Email
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [emailTestResult, setEmailTestResult] = useState('');

  // Security
  const [sessionTimeout, setSessionTimeout] = useState(120);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);

  // Notifications
  const [notifyNewAgency, setNotifyNewAgency] = useState(true);
  const [notifyPaymentFailure, setNotifyPaymentFailure] = useState(true);
  const [notifySystemPerf, setNotifySystemPerf] = useState(true);
  const [notifyNewUser, setNotifyNewUser] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/admin/settings') as Record<string, Record<string, unknown>>;
      const p = res.platform ?? {};
      const b = res.billing ?? {};
      const e = res.email ?? {};
      const s = res.security ?? {};
      const n = res.notifications ?? {};

      if (p.platform_name) setPlatformName(p.platform_name as string);
      if (p.support_email) setSupportEmail(p.support_email as string);
      if (p.maintenance_mode !== undefined) setMaintenanceMode(p.maintenance_mode as boolean);
      if (p.allow_registrations !== undefined) setAllowRegistrations(p.allow_registrations as boolean);
      if (p.default_timezone) setDefaultTimezone(p.default_timezone as string);

      if (b.stripe_connected !== undefined) setStripeConnected(b.stripe_connected as boolean);
      if (b.test_mode !== undefined) setTestMode(b.test_mode as boolean);

      if (e.provider) setEmailProvider(e.provider as string);
      if (e.from_email) setFromEmail(e.from_email as string);
      if (e.from_name) setFromName(e.from_name as string);

      if (s.session_timeout) setSessionTimeout(s.session_timeout as number);
      if (s.max_login_attempts) setMaxLoginAttempts(s.max_login_attempts as number);
      if (s.password_min_length) setPasswordMinLength(s.password_min_length as number);
      if (s.require_two_factor !== undefined) setRequireTwoFactor(s.require_two_factor as boolean);

      if (n.new_agency !== undefined) setNotifyNewAgency(n.new_agency as boolean);
      if (n.payment_failure !== undefined) setNotifyPaymentFailure(n.payment_failure as boolean);
      if (n.system_performance !== undefined) setNotifySystemPerf(n.system_performance as boolean);
      if (n.new_user !== undefined) setNotifyNewUser(n.new_user as boolean);
    } catch {
      // Settings may not exist yet — use defaults
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (group: string, entries: { key: string; value: unknown }[]) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/admin/settings', {
        settings: entries.map(e => ({ ...e, group })),
      });
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestStripe = async () => {
    setStripeTestResult('Testing...');
    try {
      const res = await api.post('/admin/settings/test-stripe') as { connected: boolean; message: string };
      setStripeConnected(res.connected);
      setStripeTestResult(res.message);
    } catch {
      setStripeTestResult('Connection test failed');
    }
  };

  const handleTestEmail = async () => {
    if (!supportEmail) {
      setEmailTestResult('Enter a support email first');
      return;
    }
    setEmailTestResult('Sending...');
    try {
      const res = await api.post('/admin/settings/test-email', { to: supportEmail }) as { message: string };
      setEmailTestResult(res.message);
    } catch {
      setEmailTestResult('Failed to send test email');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">Configure platform-wide settings</p>
        </div>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading settings...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Configure platform-wide settings</p>
      </div>

      {/* Status message */}
      {message && (
        <div className={cn('flex items-center gap-2 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(null); }}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id ? 'border-shield-600 text-shield-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'platform' && (
        <Card>
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Platform Name</label>
              <Input value={platformName} onChange={e => setPlatformName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Support Email</label>
              <Input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="support@insurons.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Default Timezone</label>
              <select value={defaultTimezone} onChange={e => setDefaultTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500">
                <option value="America/New_York">America/New_York (Eastern)</option>
                <option value="America/Chicago">America/Chicago (Central)</option>
                <option value="America/Denver">America/Denver (Mountain)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
              <span className="text-sm text-slate-700">Maintenance Mode</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={allowRegistrations} onChange={e => setAllowRegistrations(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
              <span className="text-sm text-slate-700">Allow New Registrations</span>
            </label>
            <Button disabled={saving} onClick={() => saveSettings('platform', [
              { key: 'platform_name', value: platformName },
              { key: 'support_email', value: supportEmail },
              { key: 'default_timezone', value: defaultTimezone },
              { key: 'maintenance_mode', value: maintenanceMode },
              { key: 'allow_registrations', value: allowRegistrations },
            ])}>
              {saving ? 'Saving...' : 'Save Platform Settings'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Stripe Connection:</span>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', stripeConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                {stripeConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
              <span className="text-sm text-slate-700">Stripe Test Mode</span>
            </label>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Webhook URL</label>
              <Input value={`${window.location.origin}/api/webhooks/stripe`} readOnly className="bg-slate-50" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleTestStripe}>Test Stripe Connection</Button>
              {stripeTestResult && <span className="text-sm text-slate-600">{stripeTestResult}</span>}
            </div>
            <Button disabled={saving} onClick={() => saveSettings('billing', [
              { key: 'stripe_connected', value: stripeConnected },
              { key: 'test_mode', value: testMode },
            ])}>
              {saving ? 'Saving...' : 'Save Billing Settings'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'email' && (
        <Card>
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email Provider</label>
              <select value={emailProvider} onChange={e => setEmailProvider(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500">
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">Amazon SES</option>
                <option value="resend">Resend</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">From Email</label>
              <Input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@insurons.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">From Name</label>
              <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="InsureFlow" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleTestEmail}>Send Test Email</Button>
              {emailTestResult && <span className="text-sm text-slate-600">{emailTestResult}</span>}
            </div>
            <Button disabled={saving} onClick={() => saveSettings('email', [
              { key: 'provider', value: emailProvider },
              { key: 'from_email', value: fromEmail },
              { key: 'from_name', value: fromName },
            ])}>
              {saving ? 'Saving...' : 'Save Email Settings'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Session Timeout (minutes)</label>
              <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Max Login Attempts</label>
              <Input type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Password Minimum Length</label>
              <Input type="number" value={passwordMinLength} onChange={e => setPasswordMinLength(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={requireTwoFactor} onChange={e => setRequireTwoFactor(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
              <span className="text-sm text-slate-700">Require Two-Factor Authentication</span>
            </label>
            <Button disabled={saving} onClick={() => saveSettings('security', [
              { key: 'session_timeout', value: sessionTimeout },
              { key: 'max_login_attempts', value: maxLoginAttempts },
              { key: 'password_min_length', value: passwordMinLength },
              { key: 'require_two_factor', value: requireTwoFactor },
            ])}>
              {saving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 mb-2">Choose which platform-level notifications to receive.</p>
            {[
              { label: 'New agency registration alerts', value: notifyNewAgency, set: setNotifyNewAgency },
              { label: 'Payment failure alerts', value: notifyPaymentFailure, set: setNotifyPaymentFailure },
              { label: 'System performance alerts', value: notifySystemPerf, set: setNotifySystemPerf },
              { label: 'New user registration alerts', value: notifyNewUser, set: setNotifyNewUser },
            ].map(n => (
              <label key={n.label} className="flex items-center gap-3">
                <input type="checkbox" checked={n.value} onChange={e => n.set(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
                <span className="text-sm text-slate-700">{n.label}</span>
              </label>
            ))}
            <div className="pt-2">
              <Button disabled={saving} onClick={() => saveSettings('notifications', [
                { key: 'new_agency', value: notifyNewAgency },
                { key: 'payment_failure', value: notifyPaymentFailure },
                { key: 'system_performance', value: notifySystemPerf },
                { key: 'new_user', value: notifyNewUser },
              ])}>
                {saving ? 'Saving...' : 'Save Notification Preferences'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'integrations' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Stripe Payments', desc: stripeConnected ? 'Connected' : 'Not configured', href: '#', status: stripeConnected },
            { label: 'Email Provider', desc: emailProvider.toUpperCase(), href: '#', status: !!fromEmail },
            { label: 'Carrier APIs', desc: 'Manage carrier API connections', href: '/carrier/api-config', status: null },
            { label: 'Webhooks', desc: 'Platform webhook endpoints', href: '/webhooks', status: null },
          ].map(i => (
            <Card key={i.label}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{i.label}</h3>
                  {i.status !== null && (
                    <span className={cn('w-2.5 h-2.5 rounded-full', i.status ? 'bg-green-500' : 'bg-slate-300')} />
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">{i.desc}</p>
                {i.href !== '#' && (
                  <Link to={i.href} className="text-sm text-shield-600 hover:text-shield-700 font-medium">Configure &rarr;</Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
