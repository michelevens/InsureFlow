import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { webhookService } from '@/services/api';
import type { Webhook, WebhookDelivery, WebhookEventType } from '@/services/api/webhooks';
import {
  Plug, Plus, Trash2, Play, RefreshCw, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronDown, Copy,
} from 'lucide-react';

const statusIcons: Record<string, typeof CheckCircle> = {
  success: CheckCircle,
  failed: XCircle,
  pending: Clock,
};

const statusColors: Record<string, string> = {
  success: 'text-savings-600',
  failed: 'text-red-500',
  pending: 'text-slate-400',
};

export default function WebhookSettings() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<WebhookEventType>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<number | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const [wh, et] = await Promise.all([webhookService.list(), webhookService.eventTypes()]);
      setWebhooks(wh);
      setEventTypes(et);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const toggleWebhook = async (wh: Webhook) => {
    await webhookService.update(wh.id, { is_active: !wh.is_active });
    fetchWebhooks();
  };

  const deleteWebhook = async (id: number) => {
    await webhookService.remove(id);
    if (selectedWebhook === id) setSelectedWebhook(null);
    fetchWebhooks();
  };

  const testWebhook = async (id: number) => {
    await webhookService.test(id);
    if (selectedWebhook === id) loadDeliveries(id);
  };

  const loadDeliveries = async (id: number) => {
    setSelectedWebhook(id);
    setDeliveriesLoading(true);
    try {
      const d = await webhookService.deliveries(id);
      setDeliveries(d);
    } catch {
      setDeliveries([]);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const retryDelivery = async (deliveryId: number) => {
    await webhookService.retry(deliveryId);
    if (selectedWebhook) loadDeliveries(selectedWebhook);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
          <p className="text-slate-500 mt-1">Configure event-driven integrations</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Webhook
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <Plug className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No webhooks configured yet</p>
          <Button variant="shield" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create First Webhook
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => {
            const isExpanded = selectedWebhook === wh.id;
            return (
              <Card key={wh.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => isExpanded ? setSelectedWebhook(null) : loadDeliveries(wh.id)}>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{wh.name}</span>
                        {wh.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Disabled</Badge>}
                        {wh.failure_count > 0 && <Badge variant="warning">{wh.failure_count} failures</Badge>}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 font-mono">{wh.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{wh.events.length} events</span>
                    <Button variant="ghost" size="sm" onClick={() => testWebhook(wh.id)} title="Send test ping">
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleWebhook(wh)}>
                      {wh.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>

                {/* Events */}
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {wh.events.map(ev => (
                      <span key={ev} className="text-xs px-2 py-0.5 rounded-full bg-shield-50 text-shield-700">{ev}</span>
                    ))}
                  </div>
                </div>

                {/* Secret */}
                <div className="px-4 pb-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Secret:</span>
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">{wh.secret.slice(0, 12)}...</code>
                  <button onClick={() => navigator.clipboard.writeText(wh.secret)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Deliveries */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Deliveries</h3>
                    {deliveriesLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
                      </div>
                    ) : deliveries.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No deliveries yet</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {deliveries.map(d => {
                          const Icon = statusIcons[d.status] || Clock;
                          const color = statusColors[d.status] || 'text-slate-400';
                          return (
                            <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                              <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <div>
                                  <span className="font-medium">{d.event_type}</span>
                                  {d.response_status && <span className="text-slate-500 ml-2">HTTP {d.response_status}</span>}
                                  {d.response_time_ms && <span className="text-slate-400 ml-2">{d.response_time_ms}ms</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{new Date(d.created_at).toLocaleString()}</span>
                                {d.status === 'failed' && (
                                  <Button variant="ghost" size="sm" onClick={() => retryDelivery(d.id)} title="Retry">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateWebhookModal
          eventTypes={eventTypes}
          onClose={() => setShowCreate(false)}
          onCreated={fetchWebhooks}
        />
      )}
    </div>
  );
}

function CreateWebhookModal({ eventTypes, onClose, onCreated }: {
  eventTypes: WebhookEventType;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleEvent = (ev: string) => {
    const next = new Set(selectedEvents);
    if (next.has(ev)) next.delete(ev); else next.add(ev);
    setSelectedEvents(next);
  };

  const selectAll = () => {
    setSelectedEvents(new Set(Object.keys(eventTypes)));
  };

  const handleSubmit = async () => {
    if (!name || !url || selectedEvents.size === 0) return;
    setSaving(true);
    try {
      await webhookService.create({ name, url, events: Array.from(selectedEvents) });
      onCreated();
      onClose();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Webhook" size="lg">
      <div className="space-y-4">
        <Input label="Name" placeholder="e.g. CRM Sync, Slack Notifications" value={name} onChange={e => setName(e.target.value)} />
        <Input label="URL" placeholder="https://your-server.com/webhook" value={url} onChange={e => setUrl(e.target.value)} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Events</label>
            <button className="text-xs text-shield-600 hover:underline" onClick={selectAll}>Select All</button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3">
            {Object.entries(eventTypes).map(([key, desc]) => (
              <label key={key} className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEvents.has(key)}
                  onChange={() => toggleEvent(key)}
                  className="mt-0.5 rounded border-slate-300 text-shield-600 focus:ring-shield-500"
                />
                <div>
                  <span className="font-medium text-slate-900">{key}</span>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name || !url || selectedEvents.size === 0}>
            {saving ? 'Creating...' : 'Create Webhook'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
