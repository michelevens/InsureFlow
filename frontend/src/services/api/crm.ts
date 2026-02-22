import { api } from './client';
import type { Lead } from '@/types';

export interface LeadCounts {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  applied: number;
  won: number;
  lost: number;
}

export interface LeadListResponse {
  items: Lead[];
  counts: LeadCounts;
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  user_id: number;
  type: 'call' | 'email' | 'sms' | 'note' | 'quote_sent' | 'application_submitted' | 'status_change' | 'meeting';
  description: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

// Raw backend response (paginated leads + status counts)
interface BackendLeadListResponse {
  leads: {
    data: Lead[];
    meta?: { total?: number };
  };
  counts: Record<string, number>;
}

export const crmService = {
  async getLeads(params?: { status?: string; search?: string }): Promise<LeadListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const raw = await api.get<BackendLeadListResponse>(`/crm/leads?${query}`);

    // Normalize paginated response into flat list
    const items = raw.leads?.data ?? [];
    const c = raw.counts ?? {};
    const total = Object.values(c).reduce((sum, n) => sum + n, 0);

    return {
      items,
      counts: {
        total,
        new: c.new ?? 0,
        contacted: c.contacted ?? 0,
        quoted: c.quoted ?? 0,
        applied: c.applied ?? 0,
        won: c.won ?? 0,
        lost: c.lost ?? 0,
      },
    };
  },

  async getLead(id: number): Promise<Lead & { activities: LeadActivity[] }> {
    return api.get<Lead & { activities: LeadActivity[] }>(`/crm/leads/${id}`);
  },

  async createLead(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    insurance_type: string;
    source?: string;
    estimated_value?: number;
    notes?: string;
  }): Promise<Lead> {
    return api.post<Lead>('/crm/leads', data);
  },

  async updateLead(id: number, data: Partial<Lead>): Promise<Lead> {
    return api.put<Lead>(`/crm/leads/${id}`, data);
  },

  async logActivity(leadId: number, data: { type: string; description: string }): Promise<LeadActivity> {
    return api.post<LeadActivity>(`/crm/leads/${leadId}/activity`, data);
  },
};
