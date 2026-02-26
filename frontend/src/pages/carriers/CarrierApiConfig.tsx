import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { carrierApiService } from '@/services/api/carrierApi';
import type { CarrierApiConfig, CarrierApiLog, TestResult } from '@/services/api/carrierApi';
import {
  Plug, Plus, TestTube, Trash2, Activity, CheckCircle, XCircle,
  Clock, Globe, ChevronDown, ChevronRight, Settings2,
} from 'lucide-react';

export default function CarrierApiConfigPage() {
  const [configs, setConfigs] = useState<CarrierApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null);
  const [logs, setLogs] = useState<CarrierApiLog[]>([]);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});
  const [testing, setTesting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    carrier_id: '',
    api_type: 'rest' as 'rest' | 'soap' | 'xml',
    base_url: '',
    auth_type: 'api_key' as 'api_key' | 'oauth2' | 'basic' | 'certificate',
    rate_limit_per_minute: 60,
    timeout_seconds: 30,
    api_key: '',
    api_secret: '',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await carrierApiService.getConfigs();
      setConfigs(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load configurations' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        carrier_id: Number(formData.carrier_id),
        api_type: formData.api_type,
        base_url: formData.base_url,
        auth_type: formData.auth_type,
        rate_limit_per_minute: formData.rate_limit_per_minute,
        timeout_seconds: formData.timeout_seconds,
        credentials: { api_key: formData.api_key, api_secret: formData.api_secret },
      };

      if (editingId) {
        await carrierApiService.updateConfig(editingId, payload);
        setMessage({ type: 'success', text: 'Configuration updated' });
      } else {
        await carrierApiService.createConfig(payload);
        setMessage({ type: 'success', text: 'Configuration created' });
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadConfigs();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (config: CarrierApiConfig) => {
    setTesting(config.id);
    try {
      const result = await carrierApiService.testConnection(config.id);
      setTestResults(prev => ({ ...prev, [config.id]: result }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [config.id]: { success: false, response_time_ms: 0, message: err instanceof Error ? err.message : 'Test failed' },
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await carrierApiService.deleteConfig(id);
      setConfigs(prev => prev.filter(c => c.id !== id));
      setMessage({ type: 'success', text: 'Configuration deleted' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' });
    }
  };

  const handleViewLogs = async (configId: number) => {
    if (expandedLogs === configId) {
      setExpandedLogs(null);
      return;
    }
    try {
      const data = await carrierApiService.getLogs(configId);
      setLogs(data.data || []);
      setExpandedLogs(configId);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load logs' });
    }
  };

  const resetForm = () => {
    setFormData({
      carrier_id: '', api_type: 'rest', base_url: '', auth_type: 'api_key',
      rate_limit_per_minute: 60, timeout_seconds: 30, api_key: '', api_secret: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Carrier API Integrations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure real-time rating APIs for carrier partners</p>
        </div>
        <Button variant="shield" onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Integration
        </Button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {editingId ? 'Edit Integration' : 'New Carrier API Integration'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Carrier ID"
              type="number"
              placeholder="1"
              value={formData.carrier_id}
              onChange={(e) => setFormData(p => ({ ...p, carrier_id: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">API Type</label>
              <select
                value={formData.api_type}
                onChange={(e) => setFormData(p => ({ ...p, api_type: e.target.value as 'rest' | 'soap' | 'xml' }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              >
                <option value="rest">REST</option>
                <option value="soap">SOAP</option>
                <option value="xml">XML</option>
              </select>
            </div>
            <Input
              label="Base URL"
              placeholder="https://api.carrier.com/v1"
              value={formData.base_url}
              onChange={(e) => setFormData(p => ({ ...p, base_url: e.target.value }))}
              leftIcon={<Globe className="w-5 h-5" />}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Auth Type</label>
              <select
                value={formData.auth_type}
                onChange={(e) => setFormData(p => ({ ...p, auth_type: e.target.value as 'api_key' | 'oauth2' | 'basic' | 'certificate' }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              >
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="basic">Basic Auth</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>
            <Input
              label="API Key / Username"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(p => ({ ...p, api_key: e.target.value }))}
            />
            <Input
              label="API Secret / Password"
              type="password"
              value={formData.api_secret}
              onChange={(e) => setFormData(p => ({ ...p, api_secret: e.target.value }))}
            />
            <Input
              label="Rate Limit (req/min)"
              type="number"
              value={String(formData.rate_limit_per_minute)}
              onChange={(e) => setFormData(p => ({ ...p, rate_limit_per_minute: Number(e.target.value) }))}
            />
            <Input
              label="Timeout (seconds)"
              type="number"
              value={String(formData.timeout_seconds)}
              onChange={(e) => setFormData(p => ({ ...p, timeout_seconds: Number(e.target.value) }))}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="shield" onClick={handleSave} isLoading={saving}>
              {editingId ? 'Update' : 'Create'} Integration
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Config List */}
      {configs.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <Plug className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No API Integrations</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Connect carrier rating APIs for real-time quotes</p>
          <Button variant="shield" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add First Integration
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map(config => (
            <div key={config.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      config.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <Plug className={`w-5 h-5 ${config.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {config.carrier?.name || `Carrier #${config.carrier_id}`}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="uppercase font-mono">{config.api_type}</span>
                        <span>{config.base_url}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      config.is_active ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config)}
                      isLoading={testing === config.id}
                    >
                      <TestTube className="w-4 h-4 mr-1" /> Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewLogs(config.id)}>
                      <Activity className="w-4 h-4 mr-1" /> Logs
                      {expandedLogs === config.id ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(config.id);
                        setFormData({
                          carrier_id: String(config.carrier_id),
                          api_type: config.api_type,
                          base_url: config.base_url,
                          auth_type: config.auth_type,
                          rate_limit_per_minute: config.rate_limit_per_minute,
                          timeout_seconds: config.timeout_seconds,
                          api_key: '', api_secret: '',
                        });
                        setShowForm(true);
                      }}
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <button onClick={() => handleDelete(config.id)} className="p-2 text-red-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/30 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Test Result */}
                {testResults[config.id] && (
                  <div className={`mt-3 flex items-center gap-2 p-2.5 rounded-xl text-sm ${
                    testResults[config.id].success ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {testResults[config.id].success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {testResults[config.id].message}
                    {testResults[config.id].response_time_ms > 0 && (
                      <span className="ml-auto flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" /> {testResults[config.id].response_time_ms}ms
                      </span>
                    )}
                  </div>
                )}

                {/* Last tested */}
                {config.last_tested_at && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Last tested: {new Date(config.last_tested_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Logs */}
              {expandedLogs === config.id && (
                <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800 p-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Recent API Logs</h4>
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">No logs yet</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.slice(0, 20).map(log => (
                        <div key={log.id} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg text-sm">
                          <span className={`w-2 h-2 rounded-full ${
                            log.response_status && log.response_status < 400 ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{log.request_method}</span>
                          <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{log.request_url}</span>
                          <span className={`font-mono text-xs ${
                            log.response_status && log.response_status < 400 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {log.response_status || 'ERR'}
                          </span>
                          {log.response_time_ms && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">{log.response_time_ms}ms</span>
                          )}
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
