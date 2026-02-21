import { api } from './client';
import type { Application } from '@/types';

interface ApplicationListResponse {
  items: Application[];
  counts: {
    total: number;
    draft: number;
    submitted: number;
    underwriting: number;
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
    return api.get<ApplicationListResponse>(`/applications?${query}`);
  },

  async get(id: number): Promise<{ item: Application }> {
    return api.get<{ item: Application }>(`/applications/${id}`);
  },

  async create(data: { quote_id: number; personal_info: Record<string, string> }): Promise<{ message: string; item: Application }> {
    return api.post<{ message: string; item: Application }>('/applications', data);
  },

  async update(id: number, data: Partial<Application>): Promise<{ message: string; item: Application }> {
    return api.put<{ message: string; item: Application }>(`/applications/${id}`, data);
  },

  async submit(id: number): Promise<{ message: string; item: Application }> {
    return api.post<{ message: string; item: Application }>(`/applications/${id}/submit`);
  },

  async updateStatus(id: number, status: string, notes?: string): Promise<{ message: string; item: Application }> {
    return api.put<{ message: string; item: Application }>(`/applications/${id}/status`, { status, decision_notes: notes });
  },

  async uploadDocument(id: number, formData: FormData): Promise<{ message: string }> {
    return api.upload<{ message: string }>(`/applications/${id}/documents`, formData);
  },
};
