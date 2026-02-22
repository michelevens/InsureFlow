import { api } from './client';

export interface ReportDefinition {
  id: number;
  organization_id: number | null;
  user_id: number;
  name: string;
  description: string | null;
  query_config: Record<string, unknown>;
  schedule: string | null;
  recipients: string[] | null;
  last_run_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReportRun {
  id: number;
  definition_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  file_path: string | null;
  file_format: string;
  row_count: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export type FileFormat = 'csv' | 'pdf' | 'json';

export const reportService = {
  list: () => api.get<ReportDefinition[]>('/reports'),
  show: (id: number) => api.get<ReportDefinition & { recent_runs: ReportRun[] }>(`/reports/${id}`),
  create: (data: Partial<ReportDefinition>) => api.post<ReportDefinition>('/reports', data),
  update: (id: number, data: Partial<ReportDefinition>) => api.put<ReportDefinition>(`/reports/${id}`, data),
  destroy: (id: number) => api.delete(`/reports/${id}`),
  run: (id: number, format: FileFormat = 'csv') => api.post<ReportRun>(`/reports/${id}/run`, { file_format: format }),
  runs: (id: number) => api.get<ReportRun[]>(`/reports/${id}/runs`),
  downloadRun: async (runId: number) => {
    const token = localStorage.getItem('auth_token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${baseUrl}/report-runs/${runId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const fileName = match?.[1] || 'report';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  emailRun: (runId: number, data: { recipients: string[]; message?: string }) =>
    api.post<{ message: string; recipients: string[] }>(`/report-runs/${runId}/email`, data),
};
