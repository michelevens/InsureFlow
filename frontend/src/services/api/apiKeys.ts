import { api } from './client';

export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  request_count: number;
  created_at: string;
}

export interface ApiKeyCreateResponse {
  api_key: ApiKey;
  plain_text_key: string;
}

export interface ApiUsageLog {
  id: number;
  api_key_id: number;
  endpoint: string;
  method: string;
  response_status: number;
  response_time_ms: number;
  ip_address: string;
  created_at: string;
}

export interface ApiUsageStats {
  total_requests: number;
  avg_response_time_ms: number;
  error_rate: number;
  requests_by_day: { date: string; count: number }[];
  top_endpoints: { endpoint: string; count: number }[];
  status_breakdown: { status: number; count: number }[];
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const apiKeyService = {
  list: () => api.get<ApiKey[]>('/api-keys'),
  create: (data: { name: string; permissions: string[]; rate_limit?: number; expires_at?: string }) =>
    api.post<ApiKeyCreateResponse>('/api-keys', data),
  update: (id: number, data: Partial<{ name: string; permissions: string[]; rate_limit: number; is_active: boolean }>) =>
    api.put<ApiKey>(`/api-keys/${id}`, data),
  revoke: (id: number) => api.delete(`/api-keys/${id}`),
  regenerate: (id: number) => api.post<ApiKeyCreateResponse>(`/api-keys/${id}/regenerate`),

  getUsage: (id: number, params?: { period?: string }) =>
    api.get<ApiUsageStats>(`/api-keys/${id}/usage${qs(params)}`),
  getUsageLogs: (id: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiUsageLog[]>(`/api-keys/${id}/logs${qs(params)}`),

  getPermissions: () => api.get<string[]>('/api-keys/permissions'),
};
