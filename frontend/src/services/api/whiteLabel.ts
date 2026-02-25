import { api } from './client';

export interface WhiteLabelConfig {
  id: number;
  organization_id: number | null;
  agency_id: number | null;
  domain: string | null;
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_css: string | null;
  branding: Record<string, unknown> | null;
  is_active: boolean;
  organization?: { id: number; name: string } | null;
  agency?: { id: number; name: string } | null;
  domains?: WhiteLabelDomain[];
  created_at: string;
  updated_at: string;
}

export interface WhiteLabelDomain {
  id: number;
  white_label_config_id: number;
  domain: string;
  ssl_status: 'pending' | 'provisioning' | 'active' | 'failed';
  verified_at: string | null;
  txt_record: string | null;
  created_at: string;
}

export const whiteLabelService = {
  async list(): Promise<WhiteLabelConfig[]> {
    return api.get<WhiteLabelConfig[]>('/white-label');
  },

  async create(data: {
    brand_name: string;
    domain?: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    secondary_color?: string;
    custom_css?: string;
    branding?: Record<string, unknown>;
  }): Promise<WhiteLabelConfig> {
    return api.post<WhiteLabelConfig>('/white-label', data);
  },

  async show(id: number): Promise<WhiteLabelConfig> {
    return api.get<WhiteLabelConfig>(`/white-label/${id}`);
  },

  async update(id: number, data: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> {
    return api.put<WhiteLabelConfig>(`/white-label/${id}`, data);
  },

  async remove(id: number): Promise<void> {
    return api.delete(`/white-label/${id}`);
  },

  async addDomain(configId: number, domain: string): Promise<WhiteLabelDomain> {
    return api.post<WhiteLabelDomain>(`/white-label/${configId}/domains`, { domain });
  },

  async verifyDomain(domainId: number): Promise<WhiteLabelDomain> {
    return api.post<WhiteLabelDomain>(`/white-label/domains/${domainId}/verify`, {});
  },

  async removeDomain(domainId: number): Promise<void> {
    return api.delete(`/white-label/domains/${domainId}`);
  },

  async preview(id: number): Promise<Record<string, unknown>> {
    return api.get(`/white-label/${id}/preview`);
  },
};
