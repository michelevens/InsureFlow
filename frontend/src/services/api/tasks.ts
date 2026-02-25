import { api } from './client';

export interface Task {
  id: number;
  agent_id: number;
  assigned_by: number | null;
  lead_id: number | null;
  title: string;
  type: 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  agent?: { id: number; name: string };
  lead?: { id: number; first_name: string; last_name: string };
}

export interface TaskCounts {
  total: number;
  pending: number;
  overdue: number;
  completed_today: number;
  due_today: number;
}

export const taskService = {
  async list(params?: { status?: string; priority?: string; overdue?: boolean; today?: boolean }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.overdue) query.set('overdue', '1');
    if (params?.today) query.set('today', '1');
    const qs = query.toString();
    return api.get<{ tasks: Task[]; counts: TaskCounts }>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  async create(payload: { title: string; date: string; priority?: string; notes?: string; lead_id?: number; agent_id?: number }) {
    return api.post<Task>('/tasks', payload);
  },

  async update(id: number, payload: Partial<{ title: string; date: string; priority: string; notes: string; status: string; agent_id: number }>) {
    return api.put<Task>(`/tasks/${id}`, payload);
  },

  async complete(id: number) {
    return api.post<Task>(`/tasks/${id}/complete`);
  },

  async reopen(id: number) {
    return api.post<Task>(`/tasks/${id}/reopen`);
  },

  async remove(id: number) {
    return api.delete<void>(`/tasks/${id}`);
  },
};
