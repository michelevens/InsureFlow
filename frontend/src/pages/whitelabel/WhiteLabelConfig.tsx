import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { whiteLabelService } from '@/services/api';
import type { WhiteLabelConfig as WLConfig } from '@/services/api/whiteLabel';
import {
  Palette, Plus, Trash2, Globe, CheckCircle, Copy, Eye,
} from 'lucide-react';

const sslStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: 'Active', variant: 'success' },
  provisioning: { label: 'Provisioning', variant: 'info' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
};

export default function WhiteLabelConfigPage() {
  const [configs, setConfigs] = useState<WLConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<WLConfig | null>(null);
  const [addDomainFor, setAddDomainFor] = useState<number | null>(null);
  const [newDomain, setNewDomain] = useState('');

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await whiteLabelService.list();
      setConfigs(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const toggleActive = async (config: WLConfig) => {
    await whiteLabelService.update(config.id, { is_active: !config.is_active });
    fetchConfigs();
  };

  const deleteConfig = async (id: number) => {
    await whiteLabelService.remove(id);
    if (selected?.id === id) setSelected(null);
    fetchConfigs();
  };

  const handleAddDomain = async () => {
    if (!addDomainFor || !newDomain) return;
    await whiteLabelService.addDomain(addDomainFor, newDomain);
    setAddDomainFor(null);
    setNewDomain('');
    fetchConfigs();
  };

  const verifyDomain = async (domainId: number) => {
    await whiteLabelService.verifyDomain(domainId);
    fetchConfigs();
  };

  const removeDomain = async (domainId: number) => {
    await whiteLabelService.removeDomain(domainId);
    fetchConfigs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">White-Label</h1>
          <p className="text-slate-500 mt-1">Brand the consumer experience for your agency</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Configuration
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : configs.length === 0 ? (
        <Card className="p-12 text-center">
          <Palette className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No white-label configurations yet</p>
          <Button variant="shield" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create First Config
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configs.map(config => (
            <Card key={config.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${config.primary_color}, ${config.secondary_color})` }}
                  >
                    {config.brand_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{config.brand_name}</h3>
                    <p className="text-xs text-slate-500">{config.organization?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {config.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="default">Inactive</Badge>
                  )}
                </div>
              </div>

              {/* Color preview */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: config.primary_color }} title="Primary" />
                <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: config.secondary_color }} title="Secondary" />
                <span className="text-xs text-slate-400 ml-1">{config.primary_color} / {config.secondary_color}</span>
              </div>

              {/* Domains */}
              {config.domains && config.domains.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {config.domains.map(d => {
                    const ssl = sslStatusConfig[d.ssl_status] || sslStatusConfig.pending;
                    return (
                      <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{d.domain}</span>
                          <Badge variant={ssl.variant}>{ssl.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {d.ssl_status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => verifyDomain(d.id)} title="Verify">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {d.txt_record && (
                            <button onClick={() => navigator.clipboard.writeText(d.txt_record!)} className="text-slate-400 hover:text-slate-600" title="Copy TXT record">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => removeDomain(d.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => toggleActive(config)}>
                  {config.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setAddDomainFor(config.id)}>
                  <Globe className="w-3.5 h-3.5 mr-1" /> Add Domain
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(config)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteConfig(config.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateWhiteLabelModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchConfigs(); setShowCreate(false); }}
        />
      )}

      {/* Edit modal */}
      {selected && (
        <EditWhiteLabelModal
          config={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { fetchConfigs(); setSelected(null); }}
        />
      )}

      {/* Add domain modal */}
      {addDomainFor && (
        <Modal isOpen onClose={() => { setAddDomainFor(null); setNewDomain(''); }} title="Add Custom Domain" size="sm">
          <div className="space-y-4">
            <Input label="Domain" placeholder="insurance.youragency.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} />
            <p className="text-xs text-slate-500">After adding, create a CNAME record pointing to <code className="bg-slate-100 px-1 rounded">app.insurons.com</code> and add the TXT verification record.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setAddDomainFor(null); setNewDomain(''); }}>Cancel</Button>
              <Button variant="shield" onClick={handleAddDomain} disabled={!newDomain}>Add Domain</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateWhiteLabelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [brandName, setBrandName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
  const [secondaryColor, setSecondaryColor] = useState('#f59e0b');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!brandName) return;
    setSaving(true);
    try {
      await whiteLabelService.create({
        organization_id: 1, // TODO: get from context
        brand_name: brandName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl || undefined,
      });
      onCreated();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New White-Label Config" size="md">
      <div className="space-y-4">
        <Input label="Brand Name" placeholder="Your Agency Name" value={brandName} onChange={e => setBrandName(e.target.value)} />
        <Input label="Logo URL" placeholder="https://..." value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </div>
        {/* Preview */}
        <div className="rounded-xl p-4 border border-slate-200" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
              {brandName.charAt(0) || '?'}
            </div>
            <span className="font-bold" style={{ color: primaryColor }}>{brandName || 'Preview'}</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: secondaryColor, width: '60%' }} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !brandName}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditWhiteLabelModal({ config, onClose, onSaved }: { config: WLConfig; onClose: () => void; onSaved: () => void }) {
  const [brandName, setBrandName] = useState(config.brand_name);
  const [primaryColor, setPrimaryColor] = useState(config.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(config.secondary_color);
  const [logoUrl, setLogoUrl] = useState(config.logo_url || '');
  const [customCss, setCustomCss] = useState(config.custom_css || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await whiteLabelService.update(config.id, {
        brand_name: brandName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl || null,
        custom_css: customCss || null,
      });
      onSaved();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit White-Label" size="md">
      <div className="space-y-4">
        <Input label="Brand Name" value={brandName} onChange={e => setBrandName(e.target.value)} />
        <Input label="Logo URL" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Custom CSS</label>
          <textarea
            value={customCss}
            onChange={e => setCustomCss(e.target.value)}
            className="w-full h-24 text-sm font-mono border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 focus:border-shield-500"
            placeholder=".header { background: #fff; }"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
