import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Badge, useConfirm } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, Plus, Edit, Trash2, Search, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api/client';
import { complianceService, type ComplianceRequirement, type ComplianceOverview } from '@/services/api/compliance';
import { toast } from 'sonner';

const tabs = [
  { id: 'platform', label: 'Platform' },
  { id: 'billing', label: 'Billing' },
  { id: 'email', label: 'Email' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'compliance', label: 'Compliance' },
];

export default function SuperAdminSettings() {
  const confirm = useConfirm();
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

  // Compliance
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [complianceOverview, setComplianceOverview] = useState<ComplianceOverview | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compSearch, setCompSearch] = useState('');
  const [compStateFilter, setCompStateFilter] = useState('');
  const [showReqModal, setShowReqModal] = useState(false);
  const [editingReq, setEditingReq] = useState<ComplianceRequirement | null>(null);
  const [reqForm, setReqForm] = useState({ state: 'ALL', insurance_type: 'ALL', requirement_type: 'license', title: '', description: '', category: 'licensing', is_required: true, frequency: 'one_time', authority: '', reference_url: '' });
  const [reqSaving, setReqSaving] = useState(false);

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

  // Load compliance data when tab activates
  useEffect(() => {
    if (activeTab === 'compliance' && requirements.length === 0) {
      loadComplianceData();
    }
  }, [activeTab]);

  const loadComplianceData = async () => {
    setCompLoading(true);
    try {
      const [reqs, overview] = await Promise.all([
        complianceService.getRequirements(),
        complianceService.getComplianceOverview(),
      ]);
      setRequirements(reqs);
      setComplianceOverview(overview);
    } catch {
      toast.error('Failed to load compliance data');
    } finally {
      setCompLoading(false);
    }
  };

  const openReqModal = (req?: ComplianceRequirement) => {
    if (req) {
      setEditingReq(req);
      setReqForm({
        state: req.state, insurance_type: req.insurance_type, requirement_type: req.requirement_type,
        title: req.title, description: req.description || '', category: req.category,
        is_required: req.is_required, frequency: req.frequency,
        authority: req.authority || '', reference_url: req.reference_url || '',
      });
    } else {
      setEditingReq(null);
      setReqForm({ state: 'ALL', insurance_type: 'ALL', requirement_type: 'license', title: '', description: '', category: 'licensing', is_required: true, frequency: 'one_time', authority: '', reference_url: '' });
    }
    setShowReqModal(true);
  };

  const handleSaveReq = async () => {
    if (!reqForm.title.trim()) { toast.error('Title is required'); return; }
    setReqSaving(true);
    try {
      if (editingReq) {
        await complianceService.updateRequirement(editingReq.id, reqForm);
        toast.success('Requirement updated');
      } else {
        await complianceService.createRequirement(reqForm);
        toast.success('Requirement created');
      }
      setShowReqModal(false);
      loadComplianceData();
    } catch {
      toast.error('Failed to save requirement');
    } finally {
      setReqSaving(false);
    }
  };

  const handleDeleteReq = async (id: number) => {
    const ok = await confirm({ title: 'Delete Requirement', message: 'Delete this compliance requirement? This cannot be undone.', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await complianceService.deleteRequirement(id);
      toast.success('Requirement deleted');
      setRequirements(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error('Failed to delete requirement');
    }
  };

  const filteredReqs = requirements.filter(r => {
    if (compStateFilter && r.state !== compStateFilter) return false;
    if (compSearch && !r.title.toLowerCase().includes(compSearch.toLowerCase())) return false;
    return true;
  });

  const compStates = [...new Set(requirements.map(r => r.state))].sort();

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure platform-wide settings</p>
        </div>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading settings...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure platform-wide settings</p>
      </div>

      {/* Status message */}
      {message && (
        <div className={cn('flex items-center gap-2 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300')}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700/50">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(null); }}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id ? 'border-shield-600 text-shield-700 dark:text-shield-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Platform Name</label>
              <Input value={platformName} onChange={e => setPlatformName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Support Email</label>
              <Input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="support@insurons.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Default Timezone</label>
              <select value={defaultTimezone} onChange={e => setDefaultTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400">
                <option value="America/New_York">America/New_York (Eastern)</option>
                <option value="America/Chicago">America/Chicago (Central)</option>
                <option value="America/Denver">America/Denver (Mountain)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Maintenance Mode</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={allowRegistrations} onChange={e => setAllowRegistrations(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Allow New Registrations</span>
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Stripe Connection:</span>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', stripeConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300')}>
                {stripeConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Stripe Test Mode</span>
            </label>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Webhook URL</label>
              <Input value={`${window.location.origin}/api/webhooks/stripe`} readOnly className="bg-slate-50 dark:bg-slate-800" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleTestStripe}>Test Stripe Connection</Button>
              {stripeTestResult && <span className="text-sm text-slate-600 dark:text-slate-300">{stripeTestResult}</span>}
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Provider</label>
              <select value={emailProvider} onChange={e => setEmailProvider(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400">
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">Amazon SES</option>
                <option value="resend">Resend</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">From Email</label>
              <Input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@insurons.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">From Name</label>
              <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="InsureFlow" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleTestEmail}>Send Test Email</Button>
              {emailTestResult && <span className="text-sm text-slate-600 dark:text-slate-300">{emailTestResult}</span>}
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Session Timeout (minutes)</label>
              <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Max Login Attempts</label>
              <Input type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password Minimum Length</label>
              <Input type="number" value={passwordMinLength} onChange={e => setPasswordMinLength(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={requireTwoFactor} onChange={e => setRequireTwoFactor(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Require Two-Factor Authentication</span>
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
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Choose which platform-level notifications to receive.</p>
            {[
              { label: 'New agency registration alerts', value: notifyNewAgency, set: setNotifyNewAgency },
              { label: 'Payment failure alerts', value: notifyPaymentFailure, set: setNotifyPaymentFailure },
              { label: 'System performance alerts', value: notifySystemPerf, set: setNotifySystemPerf },
              { label: 'New user registration alerts', value: notifyNewUser, set: setNotifyNewUser },
            ].map(n => (
              <label key={n.label} className="flex items-center gap-3">
                <input type="checkbox" checked={n.value} onChange={e => n.set(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
                <span className="text-sm text-slate-700 dark:text-slate-200">{n.label}</span>
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
                  <h3 className="font-medium text-slate-900 dark:text-white">{i.label}</h3>
                  {i.status !== null && (
                    <span className={cn('w-2.5 h-2.5 rounded-full', i.status ? 'bg-green-500' : 'bg-slate-300')} />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{i.desc}</p>
                {i.href !== '#' && (
                  <Link to={i.href} className="text-sm text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300 font-medium">Configure &rarr;</Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========== COMPLIANCE ========== */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Overview Stats */}
          {complianceOverview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{complianceOverview.total_items}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Requirements</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xl font-bold text-savings-600 dark:text-savings-400">{complianceOverview.completed}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{complianceOverview.overdue}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Overdue Items</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{complianceOverview.users_with_packs}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Users with Packs</p>
              </Card>
            </div>
          )}

          {/* Requirements Management */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Compliance Requirements</h3>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openReqModal()}>
                  Add Requirement
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Search requirements..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400" />
                </div>
                <select value={compStateFilter} onChange={e => setCompStateFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400">
                  <option value="">All States</option>
                  {compStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {compLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-shield-500 mx-auto" />
                </div>
              ) : filteredReqs.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No requirements found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50">
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">State</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Insurance Type</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Title</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Category</th>
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Frequency</th>
                        <th className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Required</th>
                        <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredReqs.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                          <td className="py-3 pr-3"><Badge variant="outline">{req.state}</Badge></td>
                          <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">{req.insurance_type}</td>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-slate-900 dark:text-white">{req.title}</p>
                            {req.authority && <p className="text-xs text-slate-400 dark:text-slate-500">{req.authority}</p>}
                          </td>
                          <td className="py-3 pr-3"><Badge variant="default" className="capitalize">{req.category}</Badge></td>
                          <td className="py-3 pr-3 text-slate-600 dark:text-slate-300 capitalize">{req.frequency.replace('_', ' ')}</td>
                          <td className="py-3 text-center">
                            {req.is_required ? <CheckCircle className="w-4 h-4 text-savings-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openReqModal(req)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteReq(req.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========== REQUIREMENT MODAL ========== */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReqModal(false)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{editingReq ? 'Edit Requirement' : 'Add Requirement'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">State</label>
                  <Input value={reqForm.state} onChange={e => setReqForm({ ...reqForm, state: e.target.value })} placeholder="ALL or 2-letter code" maxLength={5} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Insurance Type</label>
                  <Input value={reqForm.insurance_type} onChange={e => setReqForm({ ...reqForm, insurance_type: e.target.value })} placeholder="ALL or product slug" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
                <Input value={reqForm.title} onChange={e => setReqForm({ ...reqForm, title: e.target.value })} placeholder="Requirement title" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <textarea value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 min-h-[60px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Requirement Type</label>
                  <select value={reqForm.requirement_type} onChange={e => setReqForm({ ...reqForm, requirement_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400">
                    <option value="license">License</option>
                    <option value="ce_credit">CE Credit</option>
                    <option value="eo_insurance">E&O Insurance</option>
                    <option value="background_check">Background Check</option>
                    <option value="appointment">Appointment</option>
                    <option value="bonding">Bonding</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                  <select value={reqForm.category} onChange={e => setReqForm({ ...reqForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400">
                    <option value="licensing">Licensing</option>
                    <option value="education">Education</option>
                    <option value="insurance">Insurance</option>
                    <option value="regulatory">Regulatory</option>
                    <option value="documentation">Documentation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Frequency</label>
                  <select value={reqForm.frequency} onChange={e => setReqForm({ ...reqForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400">
                    <option value="one_time">One Time</option>
                    <option value="annual">Annual</option>
                    <option value="biennial">Biennial</option>
                    <option value="triennial">Triennial</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Authority</label>
                  <Input value={reqForm.authority} onChange={e => setReqForm({ ...reqForm, authority: e.target.value })} placeholder="Regulatory body" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Reference URL</label>
                <Input value={reqForm.reference_url} onChange={e => setReqForm({ ...reqForm, reference_url: e.target.value })} placeholder="https://" />
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={reqForm.is_required} onChange={e => setReqForm({ ...reqForm, is_required: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
                <span className="text-sm text-slate-700 dark:text-slate-200">Required</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowReqModal(false)}>Cancel</Button>
              <Button onClick={handleSaveReq} disabled={reqSaving}>
                {reqSaving ? 'Saving...' : editingReq ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
