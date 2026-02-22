import { api } from './client';
import type { Lead } from '@/types';

interface LeadListResponse {
  items: Lead[];
  counts: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    quoted: number;
    applied: number;
    won: number;
    lost: number;
  };
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  user_id: number;
  type: 'call' | 'email' | 'sms' | 'note' | 'quote_sent' | 'application_submitted';
  description: string;
  created_at: string;
}

export const crmService = {
  async getLeads(params?: { status?: string; search?: string }): Promise<LeadListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return api.get<LeadListResponse>(`/crm/leads?${query}`);
  },

  async getLead(id: number): Promise<{ item: Lead; activities: LeadActivity[] }> {
    return api.get<{ item: Lead; activities: LeadActivity[] }>(`/crm/leads/${id}`);
  },

  async updateLead(id: number, data: Partial<Lead>): Promise<{ message: string; item: Lead }> {
    return api.put<{ message: string; item: Lead }>(`/crm/leads/${id}`, data);
  },

  async logActivity(leadId: number, data: { type: string; description: string }): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/crm/leads/${leadId}/activity`, data);
  },
};
