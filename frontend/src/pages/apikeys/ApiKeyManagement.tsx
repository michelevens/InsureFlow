import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { apiKeyService } from '@/services/api';
import type { ApiKey, ApiUsageStats } from '@/services/api/apiKeys';
import {
  Key, Plus, Trash2, Copy, RotateCcw, BarChart3, Clock,
} from 'lucide-react';

export default function ApiKeyManagement() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [usage, setUsage] = useState<ApiUsageStats | null>(null);
  const [newKeyPlainText, setNewKeyPlainText] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await apiKeyService.list();
      setKeys(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const viewUsage = async (key: ApiKey) => {
    setSelectedKey(key);
    try {
      const data = await apiKeyService.getUsage(key.id);
      setUsage(data);
    } catch {
      setUsage(null);
    }
  };

  const revokeKey = async (id: number) => {
    await apiKeyService.revoke(id);
    fetchKeys();
    if (selectedKey?.id === id) { setSelectedKey(null); setUsage(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="text-slate-500 mt-1">Manage API access for integrations</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Create API Key
        </Button>
      </div>

      {/* New key alert */}
      {newKeyPlainText && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900 text-sm">API Key Created</p>
              <p className="text-xs text-green-700 mt-1">Copy this key now. It won't be shown again.</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="bg-white px-3 py-1.5 rounded-lg text-sm font-mono text-green-800 border border-green-200 flex-1 truncate">
                  {newKeyPlainText}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(newKeyPlainText); }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <button onClick={() => setNewKeyPlainText(null)} className="text-green-600 hover:text-green-800 text-lg">&times;</button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
            </Card>
          ) : keys.length === 0 ? (
            <Card className="p-12 text-center">
              <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No API keys yet</p>
              <Button variant="shield" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create First Key
              </Button>
            </Card>
          ) : (
            keys.map(key => (
              <Card key={key.id} className={`p-4 cursor-pointer transition-all ${selectedKey?.id === key.id ? 'ring-2 ring-shield-500' : 'hover:shadow-md'}`} onClick={() => viewUsage(key)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Key className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{key.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{key.key_prefix}...****</p>
                    </div>
                  </div>
                  <Badge variant={key.is_active ? 'success' : 'danger'}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {key.request_count.toLocaleString()} requests</span>
                  <span>Rate: {key.rate_limit}/min</span>
                  {key.last_used_at && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {key.permissions.slice(0, 5).map(p => (
                    <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                  {key.permissions.length > 5 && (
                    <span className="text-xs text-slate-400">+{key.permissions.length - 5} more</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); revokeKey(key.id); }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400 mr-1" /> Revoke
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); apiKeyService.regenerate(key.id).then(res => { setNewKeyPlainText(res.plain_text_key); fetchKeys(); }); }}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Regenerate
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Usage panel */}
        <div>
          {selectedKey && usage ? (
            <Card className="p-5 sticky top-4">
              <h3 className="font-bold text-slate-900 mb-4">Usage: {selectedKey.name}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Total Requests</p>
                    <p className="text-lg font-bold text-slate-900">{usage.total_requests.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Avg Response</p>
                    <p className="text-lg font-bold text-slate-900">{usage.avg_response_time_ms}ms</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-500">Error Rate</p>
                    <p className="text-lg font-bold text-slate-900">{(usage.error_rate * 100).toFixed(2)}%</p>
                  </div>
                </div>

                {/* Top Endpoints */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Top Endpoints</p>
                  <div className="space-y-1.5">
                    {usage.top_endpoints.slice(0, 5).map((ep, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1">
                        <span className="text-slate-700 font-mono text-xs truncate flex-1 mr-2">{ep.endpoint}</span>
                        <span className="text-slate-500 text-xs">{ep.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Status Codes</p>
                  <div className="flex flex-wrap gap-2">
                    {usage.status_breakdown.map(s => (
                      <Badge key={s.status} variant={s.status < 400 ? 'success' : s.status < 500 ? 'warning' : 'danger'}>
                        {s.status}: {s.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a key to view usage</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(plainKey) => { setNewKeyPlainText(plainKey); fetchKeys(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState('60');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [availablePerms, setAvailablePerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiKeyService.getPermissions().then(setAvailablePerms).catch(() => {
      setAvailablePerms(['quotes:read', 'quotes:write', 'policies:read', 'applications:read', 'analytics:read']);
    });
  }, []);

  const togglePerm = (p: string) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const result = await apiKeyService.create({ name, permissions, rate_limit: parseInt(rateLimit) || 60 });
      onCreated(result.plain_text_key);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Create API Key" size="md">
      <div className="space-y-4">
        <Input label="Key Name" placeholder="My Integration" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Rate Limit (requests/min)" type="number" value={rateLimit} onChange={e => setRateLimit(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Permissions</label>
          <div className="flex flex-wrap gap-2">
            {availablePerms.map(p => (
              <button
                key={p}
                onClick={() => togglePerm(p)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  permissions.includes(p)
                    ? 'bg-shield-50 border-shield-300 text-shield-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name}>
            {saving ? 'Creating...' : 'Create Key'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
