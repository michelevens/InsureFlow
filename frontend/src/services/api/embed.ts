import { api } from './client';

export interface EmbedPartner {
  id: number;
  name: string;
  api_key?: string; // only returned on creation
  allowed_domains: string[] | null;
  commission_share_percent: number;
  contact_email: string | null;
  contact_name: string | null;
  is_active: boolean;
  widget_config: Record<string, unknown> | null;
  sessions_count?: number;
  converted_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EmbedSession {
  id: number;
  embed_partner_id: number;
  source_domain: string | null;
  insurance_type: string | null;
  session_token: string;
  quote_data: Record<string, unknown> | null;
  converted_at: string | null;
  created_at: string;
}

export interface EmbedAnalytics {
  total_sessions: number;
  conversions: number;
  conversion_rate: number;
  by_domain: { source_domain: string; total: number; conversions: number }[];
}

export const embedService = {
  async list(): Promise<EmbedPartner[]> {
    return api.get<EmbedPartner[]>('/embed/partners');
  },

  async create(data: {
    name: string;
    allowed_domains?: string[];
    commission_share_percent?: number;
    contact_email?: string;
    contact_name?: string;
    widget_config?: Record<string, unknown>;
  }): Promise<EmbedPartner> {
    return api.post<EmbedPartner>('/embed/partners', data);
  },

  async show(id: number): Promise<EmbedPartner> {
    return api.get<EmbedPartner>(`/embed/partners/${id}`);
  },

  async update(id: number, data: Partial<EmbedPartner>): Promise<EmbedPartner> {
    return api.put<EmbedPartner>(`/embed/partners/${id}`, data);
  },

  async remove(id: number): Promise<void> {
    return api.delete(`/embed/partners/${id}`);
  },

  async regenerateKey(id: number): Promise<{ api_key: string }> {
    return api.post(`/embed/partners/${id}/regenerate-key`, {});
  },

  async sessions(id: number): Promise<EmbedSession[]> {
    return api.get<EmbedSession[]>(`/embed/partners/${id}/sessions`);
  },

  async analytics(id: number): Promise<EmbedAnalytics> {
    return api.get<EmbedAnalytics>(`/embed/partners/${id}/analytics`);
  },

  async widgetCode(id: number): Promise<{ embed_code: string; api_key: string }> {
    return api.get(`/embed/partners/${id}/widget-code`);
  },
};
