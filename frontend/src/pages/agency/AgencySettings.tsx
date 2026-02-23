import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, Plus, Key, Plug, Palette, Shield, UserPlus, Copy, RefreshCw, Link2 } from 'lucide-react';
import { api } from '@/services/api/client';
import { toast } from 'sonner';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'billing', label: 'Billing' },
  { id: 'team', label: 'Team' },
  { id: 'products', label: 'Products & Carriers' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
];

interface AgencyData {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  agents: TeamMember[];
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface BillingData {
  plan: { name: string; status: string; current_period_end: string | null; price: number };
  stripe_connected: boolean;
}

interface ComplianceAgent {
  agent_id: number;
  name: string;
  npn: string | null;
  license_states: string[];
  license_expiry: string | null;
}

export default function AgencySettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [form, setForm] = useState({ name: '', description: '', phone: '', email: '', website: '', address: '', city: '', state: '', zip_code: '' });

  // Billing
  const [billing, setBilling] = useState<BillingData | null>(null);

  // Team
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Add Agent
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', password: '' });
  const [addingAgent, setAddingAgent] = useState(false);
  const [newAgentPassword, setNewAgentPassword] = useState('');

  // Reset Password
  const [resetTempPassword, setResetTempPassword] = useState('');
  const [resetAgentId, setResetAgentId] = useState<number | null>(null);

  // Agency Code & Lead Intake
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [intakeUrls, setIntakeUrls] = useState<{ agency_code: string; agency_intake_url: string; agent_intake_url: string } | null>(null);

  // Compliance
  const [complianceAgents, setComplianceAgents] = useState<ComplianceAgent[]>([]);

  // Notifications
  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [notifyAppStatus, setNotifyAppStatus] = useState(true);
  const [notifyRenewal, setNotifyRenewal] = useState(true);
  const [notifyCommission, setNotifyCommission] = useState(true);
  const [notifyTeamActivity, setNotifyTeamActivity] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/agency/settings') as { agency: AgencyData };
      const a = res.agency;
      setAgency(a);
      setForm({
        name: a.name || '',
        description: a.description || '',
        phone: a.phone || '',
        email: a.email || '',
        website: a.website || '',
        address: a.address || '',
        city: a.city || '',
        state: a.state || '',
        zip_code: a.zip_code || '',
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to load agency settings' });
    } finally {
      setLoading(false);
    }
  };

  const loadBilling = async () => {
    try {
      const res = await api.get('/agency/settings/billing') as BillingData;
      setBilling(res);
    } catch { /* billing may not be available */ }
  };

  const loadCompliance = async () => {
    try {
      const res = await api.get('/agency/settings/compliance') as { agents: ComplianceAgent[] };
      setComplianceAgents(res.agents || []);
    } catch { /* compliance may not be available */ }
  };

  useEffect(() => {
    if (activeTab === 'billing' && !billing) loadBilling();
    if (activeTab === 'compliance' && complianceAgents.length === 0) loadCompliance();
  }, [activeTab]);

  const saveGeneral = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/agency/settings', form);
      setMessage({ type: 'success', text: 'Agency settings updated' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await api.post('/agency/invites', { email: inviteEmail, role: 'agent' });
      setInviteEmail('');
      setShowInviteModal(false);
      setMessage({ type: 'success', text: 'Invite sent successfully' });
      loadData();
    } catch {
      setMessage({ type: 'error', text: 'Failed to send invite' });
    } finally {
      setInviting(false);
    }
  };

  const loadIntakeUrls = async () => {
    try {
      const res = await api.get('/agency/settings/lead-intake') as { agency_code: string; agency_intake_url: string; agent_intake_url: string };
      setIntakeUrls(res);
    } catch { /* may not be available */ }
  };

  useEffect(() => {
    if (activeTab === 'general' && !intakeUrls) loadIntakeUrls();
  }, [activeTab]);

  const handleRegenerateCode = async () => {
    if (!confirm('Regenerate agency code? Existing shared codes will stop working.')) return;
    setRegeneratingCode(true);
    try {
      const res = await api.post('/agency/settings/regenerate-code') as { agency_code: string };
      toast.success('Agency code regenerated: ' + res.agency_code);
      loadData();
      loadIntakeUrls();
    } catch {
      toast.error('Failed to regenerate code');
    } finally {
      setRegeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  const handleAddAgent = async () => {
    if (!agentForm.name || !agentForm.email) { toast.error('Name and email are required'); return; }
    setAddingAgent(true);
    try {
      const res = await api.post('/agency/settings/agents', agentForm) as { agent: TeamMember; temporary_password: string };
      setNewAgentPassword(res.temporary_password);
      toast.success('Agent created successfully');
      setAgentForm({ name: '', email: '', password: '' });
      loadData();
    } catch {
      toast.error('Failed to create agent');
    } finally {
      setAddingAgent(false);
    }
  };

  const handleResetAgentPassword = async (agentId: number) => {
    try {
      const res = await api.post(`/agency/settings/agents/${agentId}/reset-password`) as { temporary_password: string };
      setResetTempPassword(res.temporary_password);
      setResetAgentId(agentId);
      toast.success('Password reset successfully');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agency Settings</h1>
          <p className="text-slate-500 mt-1">Manage your agency configuration</p>
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
        <h1 className="text-2xl font-bold text-slate-900">Agency Settings</h1>
        <p className="text-slate-500 mt-1">Manage your agency configuration</p>
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

      {/* ========== GENERAL ========== */}
      {activeTab === 'general' && (
        <Card>
          <div className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Agency Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Website</label>
                <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 min-h-[80px]" />
            </div>
            <div className="grid sm:grid-cols-4 gap-5">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">City</label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">State</label>
                  <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Zip</label>
                  <Input value={form.zip_code} onChange={e => setForm({ ...form, zip_code: e.target.value })} />
                </div>
              </div>
            </div>
            <Button disabled={saving} onClick={saveGeneral}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}

      {/* Agency Code & Lead Intake Links (shown under General tab) */}
      {activeTab === 'general' && agency && (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Agency Code</h3>
              <p className="text-sm text-slate-500 mb-3">Share this code with agents so they can join your agency during registration.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-lg font-bold text-shield-700 tracking-widest">
                  {(agency as AgencyData & { agency_code?: string }).agency_code || 'Not generated'}
                </div>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard((agency as AgencyData & { agency_code?: string }).agency_code || '', 'Agency code')}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRegenerateCode} disabled={regeneratingCode}>
                  {regeneratingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                <Link2 className="w-5 h-5 inline mr-2" />Lead Intake Links
              </h3>
              <p className="text-sm text-slate-500 mb-4">Share these links with potential clients. When they fill out the form, the lead is automatically routed to your agency.</p>
              {intakeUrls ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agency Link</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={intakeUrls.agency_intake_url} readOnly className="bg-slate-50 text-sm font-mono" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(intakeUrls.agency_intake_url, 'Agency intake link')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Leads go to your agency queue for distribution</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Your Personal Link</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={intakeUrls.agent_intake_url} readOnly className="bg-slate-50 text-sm font-mono" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(intakeUrls.agent_intake_url, 'Personal intake link')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Leads go directly to you</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Loading intake links...</p>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ========== BILLING ========== */}
      {activeTab === 'billing' && (
        <Card>
          <div className="p-6 space-y-5">
            {!billing ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-shield-500 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">Loading billing info...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Current Plan</p>
                    <p className="text-xl font-bold text-slate-900">{billing.plan.name}</p>
                  </div>
                  <Badge variant={billing.plan.status === 'active' ? 'success' : 'warning'}>
                    {billing.plan.status}
                  </Badge>
                </div>
                {billing.plan.price > 0 && (
                  <p className="text-lg font-semibold text-savings-600">${billing.plan.price}/mo</p>
                )}
                {billing.plan.current_period_end && (
                  <p className="text-sm text-slate-500">Renews: {new Date(billing.plan.current_period_end).toLocaleDateString()}</p>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', billing.stripe_connected ? 'bg-green-500' : 'bg-slate-300')} />
                  <span className="text-sm text-slate-700">Stripe Connect: {billing.stripe_connected ? 'Connected' : 'Not connected'}</span>
                </div>
                <Link to="/pricing">
                  <Button variant="outline">Upgrade Plan</Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ========== TEAM ========== */}
      {activeTab === 'team' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowInviteModal(true)}>
                  Invite Agent
                </Button>
                <Button size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => { setShowAddAgentModal(true); setNewAgentPassword(''); }}>
                  Add Agent
                </Button>
              </div>
            </div>

            {resetTempPassword && resetAgentId && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800">Temporary Password for Agent #{resetAgentId}:</p>
                <p className="text-lg font-mono font-bold text-amber-900 mt-1">{resetTempPassword}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-amber-600">Share this with the agent. They should change it after logging in.</p>
                  <button onClick={() => { setResetTempPassword(''); setResetAgentId(null); }} className="text-xs text-amber-700 underline">Dismiss</button>
                </div>
              </div>
            )}

            {!agency?.agents || agency.agents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No team members yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Name</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Email</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Role</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Status</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agency.agents.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-3 font-medium text-slate-900">{a.name}</td>
                        <td className="py-3 text-sm text-slate-600">{a.email}</td>
                        <td className="py-3 text-sm text-slate-600 capitalize">{a.role?.replace('_', ' ')}</td>
                        <td className="py-3">
                          <Badge variant={a.is_active ? 'success' : 'danger'}>
                            {a.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleResetAgentPassword(a.id)} title="Reset Password">
                            <Key className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ========== PRODUCTS & CARRIERS ========== */}
      {activeTab === 'products' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Agency Products</h3>
              <p className="text-sm text-slate-500 mb-4">Manage which insurance products your agency offers.</p>
              <Link to="/agency/products"><Button variant="outline">Go to Products</Button></Link>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Carrier Appointments</h3>
              <p className="text-sm text-slate-500 mb-4">Manage your carrier appointments and authorizations.</p>
              <Link to="/agency/appointments"><Button variant="outline">Go to Appointments</Button></Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========== COMPLIANCE ========== */}
      {activeTab === 'compliance' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Agent Compliance</h3>
              <Link to="/compliance" className="text-sm text-shield-600 hover:text-shield-700 font-medium">Manage Details &rarr;</Link>
            </div>
            {complianceAgents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No compliance data available</p>
            ) : (
              <div className="space-y-3">
                {complianceAgents.map(a => {
                  const expiring = a.license_expiry && new Date(a.license_expiry) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                  return (
                    <div key={a.agent_id} className={cn('p-4 rounded-lg border', expiring ? 'border-amber-200 bg-amber-50' : 'border-slate-100')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-500">NPN: {a.npn || 'Not set'}</p>
                        </div>
                        {a.license_expiry && (
                          <p className={cn('text-xs font-medium', expiring ? 'text-amber-700' : 'text-slate-500')}>
                            Expires: {new Date(a.license_expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {a.license_states.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {a.license_states.map(s => (
                            <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-shield-50 text-shield-700 font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ========== INTEGRATIONS ========== */}
      {activeTab === 'integrations' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'SSO Configuration', desc: 'Configure single sign-on for your agency', href: '/admin/sso', icon: <Shield className="w-5 h-5" /> },
            { label: 'API Keys', desc: 'Manage API keys for programmatic access', href: '/api-keys', icon: <Key className="w-5 h-5" /> },
            { label: 'Webhooks', desc: 'Set up webhook notifications', href: '/webhooks', icon: <Plug className="w-5 h-5" /> },
            { label: 'White-Label', desc: 'Customize branding and embed widgets', href: '/white-label', icon: <Palette className="w-5 h-5" /> },
          ].map(i => (
            <Card key={i.label}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-shield-50 text-shield-600 flex items-center justify-center">{i.icon}</div>
                  <h3 className="font-medium text-slate-900">{i.label}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3">{i.desc}</p>
                <Link to={i.href}><Button variant="outline" size="sm">Configure</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========== NOTIFICATIONS ========== */}
      {activeTab === 'notifications' && (
        <Card>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 mb-2">Choose which notifications to receive for your agency.</p>
            {[
              { label: 'New lead alerts', value: notifyNewLead, set: setNotifyNewLead },
              { label: 'Application status changes', value: notifyAppStatus, set: setNotifyAppStatus },
              { label: 'Policy renewal reminders', value: notifyRenewal, set: setNotifyRenewal },
              { label: 'Commission payout notifications', value: notifyCommission, set: setNotifyCommission },
              { label: 'Team activity notifications', value: notifyTeamActivity, set: setNotifyTeamActivity },
            ].map(n => (
              <label key={n.label} className="flex items-center gap-3">
                <input type="checkbox" checked={n.value} onChange={e => n.set(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
                <span className="text-sm text-slate-700">{n.label}</span>
              </label>
            ))}
            <div className="pt-2">
              <Button disabled={saving} onClick={() => {
                setMessage({ type: 'success', text: 'Notification preferences saved' });
              }}>
                Save Notification Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========== INVITE MODAL ========== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInviteModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Invite Agent</h3>
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input type="email" placeholder="agent@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========== ADD AGENT MODAL ========== */}
      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddAgentModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              <UserPlus className="w-5 h-5 inline mr-2" />Add Agent
            </h3>
            {newAgentPassword ? (
              <div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <p className="text-sm font-medium text-green-800">Agent created successfully!</p>
                  <p className="text-sm text-green-700 mt-1">Temporary password:</p>
                  <p className="text-lg font-mono font-bold text-green-900 mt-1">{newAgentPassword}</p>
                  <p className="text-xs text-green-600 mt-1">Share this with the agent. They should change it after logging in.</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => { setShowAddAgentModal(false); setNewAgentPassword(''); }}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input value={agentForm.name} onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <Input type="email" value={agentForm.email} onChange={e => setAgentForm({ ...agentForm, email: e.target.value })} placeholder="agent@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Password (optional)</label>
                    <Input type="password" value={agentForm.password} onChange={e => setAgentForm({ ...agentForm, password: e.target.value })} placeholder="Leave blank for auto-generated" />
                    <p className="text-xs text-slate-400">If left blank, a temporary password will be generated.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddAgentModal(false)}>Cancel</Button>
                  <Button onClick={handleAddAgent} disabled={addingAgent || !agentForm.name || !agentForm.email}>
                    {addingAgent ? 'Creating...' : 'Create Agent'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
