import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { embedService } from '@/services/api';
import type { EmbedPartner, EmbedAnalytics } from '@/services/api/embed';
import {
  Code, Plus, Trash2, BarChart3, Globe, Copy, Key,
} from 'lucide-react';

export default function EmbedPartnerDashboard() {
  const [partners, setPartners] = useState<EmbedPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<EmbedPartner | null>(null);
  const [analytics, setAnalytics] = useState<EmbedAnalytics | null>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await embedService.list();
      setPartners(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const loadAnalytics = async (partner: EmbedPartner) => {
    setSelectedPartner(partner);
    try {
      const data = await embedService.analytics(partner.id);
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
  };

  const toggleActive = async (partner: EmbedPartner) => {
    await embedService.update(partner.id, { is_active: !partner.is_active });
    fetchPartners();
  };

  const deletePartner = async (id: number) => {
    await embedService.remove(id);
    if (selectedPartner?.id === id) { setSelectedPartner(null); setAnalytics(null); }
    fetchPartners();
  };

  const regenerateKey = async (id: number) => {
    const result = await embedService.regenerateKey(id);
    setShowApiKey(result.api_key);
  };

  const getWidgetCode = async (id: number) => {
    const result = await embedService.widgetCode(id);
    setEmbedCode(result.embed_code);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Embedded Insurance</h1>
          <p className="text-slate-500 mt-1">Manage widget partners and track conversions</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Partner
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : partners.length === 0 ? (
        <Card className="p-12 text-center">
          <Code className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No embed partners configured</p>
          <Button variant="shield" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add First Partner
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Partner list */}
          <div className="lg:col-span-1 space-y-3">
            {partners.map(p => (
              <Card
                key={p.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedPartner?.id === p.id ? 'ring-2 ring-shield-500' : ''}`}
                onClick={() => loadAnalytics(p)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.contact_email}</p>
                  </div>
                  {p.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{p.sessions_count ?? 0} sessions</span>
                  <span>{p.converted_count ?? 0} conversions</span>
                  <span>{p.commission_share_percent}% share</span>
                </div>
                {p.allowed_domains && p.allowed_domains.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.allowed_domains.map(d => (
                      <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{d}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Analytics panel */}
          <div className="lg:col-span-2">
            {selectedPartner && analytics ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">{selectedPartner.name} — Analytics</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => getWidgetCode(selectedPartner.id)}>
                      <Code className="w-4 h-4 mr-1" /> Embed Code
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => regenerateKey(selectedPartner.id)}>
                      <Key className="w-4 h-4 mr-1" /> New Key
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(selectedPartner)}>
                      {selectedPartner.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePartner(selectedPartner.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{analytics.total_sessions}</p>
                    <p className="text-sm text-slate-500">Total Sessions</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-savings-600">{analytics.conversions}</p>
                    <p className="text-sm text-slate-500">Conversions</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-shield-600">{analytics.conversion_rate}%</p>
                    <p className="text-sm text-slate-500">Conversion Rate</p>
                  </div>
                </div>

                {/* By domain */}
                {analytics.by_domain.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">By Domain</h3>
                    <div className="space-y-2">
                      {analytics.by_domain.map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{d.source_domain || 'Direct'}</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-500">
                            <span>{d.total} sessions</span>
                            <span>{d.conversions} conversions</span>
                            <span className="font-medium text-shield-600">
                              {d.total > 0 ? ((d.conversions / d.total) * 100).toFixed(1) : '0'}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400">Select a partner to view analytics</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create partner modal */}
      {showCreate && (
        <CreatePartnerModal
          onClose={() => setShowCreate(false)}
          onCreated={(partner) => {
            if (partner.api_key) setShowApiKey(partner.api_key);
            fetchPartners();
            setShowCreate(false);
          }}
        />
      )}

      {/* Show API key modal */}
      {showApiKey && (
        <Modal isOpen onClose={() => setShowApiKey(null)} title="API Key" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Save this API key now — it won't be shown again.</p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3">
              <code className="text-sm font-mono flex-1 break-all">{showApiKey}</code>
              <button onClick={() => navigator.clipboard.writeText(showApiKey)} className="text-slate-400 hover:text-slate-600">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <Button variant="shield" onClick={() => setShowApiKey(null)} className="w-full">Done</Button>
          </div>
        </Modal>
      )}

      {/* Embed code modal */}
      {embedCode && (
        <Modal isOpen onClose={() => setEmbedCode(null)} title="Widget Embed Code" size="md">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Add this snippet to your partner's website to embed the insurance widget:</p>
            <div className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-green-400 font-mono break-all">{embedCode}</code>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(embedCode); }}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
              <Button variant="shield" onClick={() => setEmbedCode(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreatePartnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: EmbedPartner) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [domains, setDomains] = useState('');
  const [commission, setCommission] = useState('10');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const partner = await embedService.create({
        name,
        contact_email: email || undefined,
        contact_name: contactName || undefined,
        allowed_domains: domains ? domains.split(',').map(d => d.trim()).filter(Boolean) : undefined,
        commission_share_percent: parseFloat(commission) || 10,
      });
      onCreated(partner);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Embed Partner" size="md">
      <div className="space-y-4">
        <Input label="Partner Name" placeholder="e.g. ABC Car Dealerships" value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Contact Name" placeholder="John Smith" value={contactName} onChange={e => setContactName(e.target.value)} />
          <Input label="Contact Email" placeholder="john@partner.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <Input label="Allowed Domains" placeholder="dealer.com, mortgage.co (comma-separated)" value={domains} onChange={e => setDomains(e.target.value)} />
        <Input label="Commission Share %" type="number" value={commission} onChange={e => setCommission(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name}>
            {saving ? 'Creating...' : 'Create Partner'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
