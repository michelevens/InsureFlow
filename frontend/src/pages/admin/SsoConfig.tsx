import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { ssoService } from '@/services/api/sso';
import { adminService } from '@/services/api/admin';
import { Shield, Key, Globe, FileText, CheckCircle, XCircle, Copy } from 'lucide-react';

interface Agency {
  id: number;
  name: string;
  agency_code: string;
  sso_enabled?: boolean;
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_certificate?: string;
  sso_default_role?: string;
}

export default function SsoConfig() {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [entityId, setEntityId] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [certificate, setCertificate] = useState('');
  const [defaultRole, setDefaultRole] = useState<'agent' | 'agency_owner'>('agent');

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const data = await adminService.getAgencies();
      const list = Array.isArray(data) ? data : (data as { data: Agency[] }).data || [];
      setAgencies(list);
      if (list.length === 1) selectAgency(list[0]);
    } catch {
      // Agency owner — use own agency
      if (user?.agency_id) {
        setAgencies([{ id: user.agency_id, name: 'My Agency', agency_code: '' } as Agency]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectAgency = (agency: Agency) => {
    setSelectedAgency(agency);
    setEntityId(agency.saml_entity_id || '');
    setSsoUrl(agency.saml_sso_url || '');
    setCertificate(agency.saml_certificate || '');
    setDefaultRole((agency.sso_default_role as 'agent' | 'agency_owner') || 'agent');
  };

  const handleSave = async () => {
    if (!selectedAgency) return;
    setSaving(true);
    setMessage(null);
    try {
      await ssoService.configure({
        agency_id: selectedAgency.id,
        saml_entity_id: entityId,
        saml_sso_url: ssoUrl,
        saml_certificate: certificate,
        sso_default_role: defaultRole,
      });
      setMessage({ type: 'success', text: 'SSO configured successfully' });
      setSelectedAgency({ ...selectedAgency, sso_enabled: true });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!selectedAgency) return;
    setSaving(true);
    setMessage(null);
    try {
      await ssoService.disable(selectedAgency.id);
      setMessage({ type: 'success', text: 'SSO disabled' });
      setSelectedAgency({ ...selectedAgency, sso_enabled: false });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to disable' });
    } finally {
      setSaving(false);
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const metadataUrl = `${apiUrl}/sso/metadata`;
  const acsUrl = selectedAgency ? `${apiUrl}/sso/acs/${selectedAgency.agency_code?.toLowerCase()}` : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard' });
    setTimeout(() => setMessage(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SSO Configuration</h1>
        <p className="text-slate-500 mt-1">Configure SAML 2.0 single sign-on for enterprise agencies</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Agency selector (admin only) */}
      {agencies.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Agency</label>
          <select
            value={selectedAgency?.id || ''}
            onChange={(e) => {
              const agency = agencies.find(a => a.id === Number(e.target.value));
              if (agency) selectAgency(agency);
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-shield-500 focus:border-transparent"
          >
            <option value="">Choose an agency...</option>
            {agencies.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} {a.sso_enabled ? '(SSO Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedAgency && (
        <>
          {/* SP Metadata (for IdP configuration) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-shield-600" />
              <h2 className="text-lg font-semibold text-slate-900">Service Provider Details</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Provide these to your identity provider (Okta, Azure AD, OneLogin, etc.)
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SP Entity ID / Metadata URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 break-all">
                    {metadataUrl}
                  </code>
                  <button onClick={() => copyToClipboard(metadataUrl)} className="p-2 text-slate-400 hover:text-slate-600">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ACS URL (Assertion Consumer Service)</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 break-all">
                    {acsUrl}
                  </code>
                  <button onClick={() => copyToClipboard(acsUrl)} className="p-2 text-slate-400 hover:text-slate-600">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* IdP Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-shield-600" />
              <h2 className="text-lg font-semibold text-slate-900">Identity Provider Settings</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="IdP Entity ID"
                placeholder="https://idp.example.com/metadata"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                leftIcon={<Globe className="w-5 h-5" />}
              />
              <Input
                label="SSO Login URL"
                placeholder="https://idp.example.com/sso/saml"
                value={ssoUrl}
                onChange={(e) => setSsoUrl(e.target.value)}
                leftIcon={<Shield className="w-5 h-5" />}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  X.509 Certificate
                </label>
                <textarea
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDp...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-shield-500 focus:border-transparent text-sm font-mono resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Default Role for SSO Users
                </label>
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value as 'agent' | 'agency_owner')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-shield-500 focus:border-transparent"
                >
                  <option value="agent">Agent</option>
                  <option value="agency_owner">Agency Owner</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <Button variant="shield" onClick={handleSave} isLoading={saving}>
                {selectedAgency.sso_enabled ? 'Update SSO Configuration' : 'Enable SSO'}
              </Button>
              {selectedAgency.sso_enabled && (
                <Button variant="danger" onClick={handleDisable} isLoading={saving}>
                  Disable SSO
                </Button>
              )}
            </div>
          </div>

          {/* SSO Login URL */}
          {selectedAgency.sso_enabled && (
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">SSO is Active</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Your team can log in using the SSO URL below:
              </p>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-white rounded-lg text-sm text-green-800 break-all">
                  {window.location.origin}/sso/login/{selectedAgency.agency_code?.toLowerCase()}
                </code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/sso/login/${selectedAgency.agency_code?.toLowerCase()}`)}
                  className="p-2 text-green-500 hover:text-green-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
