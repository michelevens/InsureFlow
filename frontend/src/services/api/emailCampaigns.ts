import { api } from './client';

export interface EmailTemplate {
  id: number;
  organization_id: number | null;
  name: string;
  subject: string;
  body_html: string;
  category: string;
  is_system: boolean;
  created_at: string;
}

export interface EmailCampaign {
  id: number;
  organization_id: number | null;
  name: string;
  subject: string;
  body_html: string;
  target_segment: Record<string, unknown> | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
}

export interface CampaignAnalytics {
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  status_breakdown: { status: string; count: number }[];
  timeline: { date: string; opens: number; clicks: number }[];
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const emailCampaignService = {
  list: (params?: { status?: string; page?: number }) =>
    api.get<{ data: EmailCampaign[]; last_page: number }>(`/campaigns${qs(params)}`),
  show: (id: number) => api.get<EmailCampaign>(`/campaigns/${id}`),
  create: (data: Partial<EmailCampaign>) => api.post<EmailCampaign>('/campaigns', data),
  update: (id: number, data: Partial<EmailCampaign>) => api.put<EmailCampaign>(`/campaigns/${id}`, data),
  destroy: (id: number) => api.delete(`/campaigns/${id}`),
  send: (id: number) => api.post<{ recipients_count: number }>(`/campaigns/${id}/send`),
  analytics: (id: number) => api.get<CampaignAnalytics>(`/campaigns/${id}/analytics`),

  // Templates
  templates: () => api.get<EmailTemplate[]>('/campaigns/templates'),
  createTemplate: (data: Partial<EmailTemplate>) => api.post<EmailTemplate>('/campaigns/templates', data),
  updateTemplate: (id: number, data: Partial<EmailTemplate>) => api.put<EmailTemplate>(`/campaigns/templates/${id}`, data),
  deleteTemplate: (id: number) => api.delete(`/campaigns/templates/${id}`),
};
