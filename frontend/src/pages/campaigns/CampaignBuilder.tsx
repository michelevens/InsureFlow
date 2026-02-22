import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { emailCampaignService } from '@/services/api';
import type { EmailCampaign, CampaignAnalytics } from '@/services/api/emailCampaigns';
import {
  Mail, Plus, Send, BarChart3, Trash2,
} from 'lucide-react';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'default',
  scheduled: 'info',
  sending: 'warning',
  sent: 'success',
  cancelled: 'danger',
};

export default function CampaignBuilder() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const result = await emailCampaignService.list();
      setCampaigns(result.data);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const viewAnalytics = async (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      try {
        const data = await emailCampaignService.analytics(campaign.id);
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      }
    } else {
      setAnalytics(null);
    }
  };

  const sendCampaign = async (id: number) => {
    try {
      await emailCampaignService.send(id);
      toast.success('Campaign sent successfully');
      fetchCampaigns();
    } catch {
      toast.error('Failed to send campaign');
    }
  };

  const deleteCampaign = async (id: number) => {
    try {
      await emailCampaignService.destroy(id);
      toast.success('Campaign deleted');
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (selectedCampaign?.id === id) { setSelectedCampaign(null); setAnalytics(null); }
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="text-slate-500 mt-1">Create and send targeted email campaigns</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
            </Card>
          ) : campaigns.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No campaigns yet</p>
              <Button variant="shield" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create First Campaign
              </Button>
            </Card>
          ) : campaigns.map(campaign => (
            <Card
              key={campaign.id}
              className={`p-4 cursor-pointer transition-all ${selectedCampaign?.id === campaign.id ? 'ring-2 ring-shield-500' : 'hover:shadow-md'}`}
              onClick={() => viewAnalytics(campaign)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">{campaign.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{campaign.subject}</p>
                </div>
                <Badge variant={statusColors[campaign.status]}>{campaign.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {campaign.sent_count > 0 && <span>Sent: {campaign.sent_count}</span>}
                {campaign.open_count > 0 && <span>Opens: {campaign.open_count}</span>}
                {campaign.click_count > 0 && <span>Clicks: {campaign.click_count}</span>}
                <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                {campaign.status === 'draft' && (
                  <Button variant="shield" size="sm" onClick={e => { e.stopPropagation(); sendCampaign(campaign.id); }}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Send
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); viewAnalytics(campaign); }}>
                  <BarChart3 className="w-3.5 h-3.5 mr-1" /> Stats
                </Button>
                {campaign.status === 'draft' && (
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteCampaign(campaign.id); }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Analytics panel */}
        <div>
          {selectedCampaign ? (
            <Card className="p-5 sticky top-4">
              <h3 className="font-bold text-slate-900 mb-1">{selectedCampaign.name}</h3>
              <Badge variant={statusColors[selectedCampaign.status]} className="mb-4">{selectedCampaign.status}</Badge>

              {analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-shield-600">{(analytics.open_rate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Open Rate</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-shield-600">{(analytics.click_rate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Click Rate</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-red-500">{(analytics.bounce_rate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Bounce</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Delivery Status</p>
                    <div className="space-y-1">
                      {analytics.status_breakdown.map(s => (
                        <div key={s.status} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 capitalize">{s.status}</span>
                          <span className="font-medium text-slate-900">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400">
                    {selectedCampaign.status === 'draft' ? 'Send campaign to see analytics' : 'Loading analytics...'}
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a campaign to view analytics</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchCampaigns(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !subject) return;
    setSaving(true);
    try {
      await emailCampaignService.create({ name, subject, body_html: bodyHtml });
      toast.success('Campaign created successfully');
      onCreated();
    } catch {
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Campaign" size="md">
      <div className="space-y-4">
        <Input label="Campaign Name" placeholder="Spring Renewal Reminder" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Subject Line" placeholder="Your policy renewal is coming up" value={subject} onChange={e => setSubject(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Email Body (HTML)</label>
          <textarea
            value={bodyHtml}
            onChange={e => setBodyHtml(e.target.value)}
            className="w-full h-32 text-sm font-mono border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 focus:border-shield-500"
            placeholder="<h1>Hello {{name}}</h1><p>Your policy renewal...</p>"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name || !subject}>
            {saving ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
