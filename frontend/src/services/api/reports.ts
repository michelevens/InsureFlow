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

export const reportService = {
  list: () => api.get<ReportDefinition[]>('/reports'),
  show: (id: number) => api.get<ReportDefinition & { recent_runs: ReportRun[] }>(`/reports/${id}`),
  create: (data: Partial<ReportDefinition>) => api.post<ReportDefinition>('/reports', data),
  update: (id: number, data: Partial<ReportDefinition>) => api.put<ReportDefinition>(`/reports/${id}`, data),
  destroy: (id: number) => api.delete(`/reports/${id}`),
  run: (id: number) => api.post<ReportRun>(`/reports/${id}/run`),
  runs: (id: number) => api.get<ReportRun[]>(`/reports/${id}/runs`),
  downloadRun: (runId: number) => api.get<Blob>(`/reports/runs/${runId}/download`),
};
