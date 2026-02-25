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
    api.get<{ data: EmailCampaign[]; last_page: number }>(`/email/campaigns${qs(params)}`),
  show: (id: number) => api.get<EmailCampaign>(`/email/campaigns/${id}`),
  create: (data: Partial<EmailCampaign>) => api.post<EmailCampaign>('/email/campaigns', data),
  update: (id: number, data: Partial<EmailCampaign>) => api.put<EmailCampaign>(`/email/campaigns/${id}`, data),
  destroy: (id: number) => api.delete(`/email/campaigns/${id}`),
  send: (id: number) => api.post<{ recipients_count: number }>(`/email/campaigns/${id}/send`),
  cancel: (id: number) => api.post(`/email/campaigns/${id}/cancel`),
  analytics: (id: number) => api.get<CampaignAnalytics>(`/email/campaigns/${id}/analytics`),
  sends: (id: number) => api.get(`/email/campaigns/${id}/sends`),

  // Templates
  templates: () => api.get<EmailTemplate[]>('/email/templates'),
  createTemplate: (data: Partial<EmailTemplate>) => api.post<EmailTemplate>('/email/templates', data),
  updateTemplate: (id: number, data: Partial<EmailTemplate>) => api.put<EmailTemplate>(`/email/templates/${id}`, data),
  deleteTemplate: (id: number) => api.delete(`/email/templates/${id}`),
};
