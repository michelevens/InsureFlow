import { api } from './client';

export interface TrainingModule {
  id: number;
  organization_id: number | null;
  title: string;
  description: string;
  content_type: 'video' | 'article' | 'quiz' | 'interactive';
  content_url: string | null;
  content_body: string | null;
  duration_minutes: number;
  category: string;
  is_required: boolean;
  order: number;
  completion_count: number;
  avg_score: number | null;
  created_at: string;
}

export interface TrainingCompletion {
  id: number;
  module_id: number;
  user_id: number;
  module_title?: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  time_spent_minutes: number;
}

export interface TrainingProgress {
  total_modules: number;
  completed_modules: number;
  required_remaining: number;
  total_time_spent_minutes: number;
  avg_score: number | null;
  completions: TrainingCompletion[];
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const trainingService = {
  listModules: (params?: { category?: string }) =>
    api.get<TrainingModule[]>(`/training/modules${qs(params)}`),
  getModule: (id: number) => api.get<TrainingModule>(`/training/modules/${id}`),
  createModule: (data: Partial<TrainingModule>) =>
    api.post<TrainingModule>('/training/modules', data),
  updateModule: (id: number, data: Partial<TrainingModule>) =>
    api.put<TrainingModule>(`/training/modules/${id}`, data),
  deleteModule: (id: number) => api.delete(`/training/modules/${id}`),

  getCatalog: (params?: { category?: string }) =>
    api.get<TrainingModule[]>(`/training/catalog${qs(params)}`),
  startModule: (moduleId: number) =>
    api.post<TrainingCompletion>(`/training/modules/${moduleId}/start`),
  completeModule: (moduleId: number, data?: { score?: number }) =>
    api.post<TrainingCompletion>(`/training/modules/${moduleId}/complete`, data),

  getProgress: () => api.get<TrainingProgress>('/training/progress'),
  getCategories: () => api.get<string[]>('/training/categories'),
};
