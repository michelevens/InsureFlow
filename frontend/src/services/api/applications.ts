import { api } from './client';
import type { Application } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
  counts: {
    total: number;
    draft: number;
    submitted: number;
    under_review: number;
    approved: number;
    declined: number;
    bound: number;
  };
}

export const applicationService = {
  async list(params?: { status?: string; search?: string }): Promise<ApplicationListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const raw = await api.get<PaginatedResponse<Application>>(`/applications${qs ? `?${qs}` : ''}`);
    const items = raw.data || [];
    return {
      items,
      total: raw.total || items.length,
      counts: {
        total: raw.total || items.length,
        draft: items.filter(a => a.status === 'draft').length,
        submitted: items.filter(a => a.status === 'submitted').length,
        under_review: items.filter(a => a.status === 'under_review').length,
        approved: items.filter(a => a.status === 'approved').length,
        declined: items.filter(a => a.status === 'declined').length,
        bound: items.filter(a => a.status === 'bound').length,
      },
    };
  },

  async get(id: number): Promise<Application> {
    return api.get<Application>(`/applications/${id}`);
  },

  async create(data: { carrier_product_id: number; insurance_type: string; carrier_name: string; monthly_premium: number; applicant_data?: Record<string, string> }): Promise<Application> {
    return api.post<Application>('/applications', data);
  },

  async update(id: number, data: Partial<Application>): Promise<Application> {
    return api.put<Application>(`/applications/${id}`, data);
  },

  async submit(id: number): Promise<Application> {
    return api.post<Application>(`/applications/${id}/submit`);
  },

  async updateStatus(id: number, status: string, notes?: string): Promise<Application> {
    return api.put<Application>(`/applications/${id}/status`, { status, decision_notes: notes });
  },

  async uploadDocument(id: number, formData: FormData): Promise<{ message: string }> {
    return api.upload<{ message: string }>(`/applications/${id}/documents`, formData);
  },
};
