import { api } from './client';

export interface InsuronsEvent {
  id: number;
  organization_id: number | null;
  host_id: number;
  host_name?: string;
  title: string;
  description: string;
  type: 'webinar' | 'in_person' | 'hybrid';
  location: string | null;
  meeting_url: string | null;
  start_at: string;
  end_at: string;
  max_attendees: number | null;
  registration_count: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  is_registered?: boolean;
  created_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  user_name?: string;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: string;
  attended_at: string | null;
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const eventService = {
  list: (params?: { status?: string; type?: string; page?: number }) =>
    api.get<{ data: InsuronsEvent[]; last_page: number }>(`/events${qs(params)}`),
  show: (id: number) => api.get<InsuronsEvent>(`/events/${id}`),
  create: (data: Partial<InsuronsEvent>) => api.post<InsuronsEvent>('/events', data),
  update: (id: number, data: Partial<InsuronsEvent>) => api.put<InsuronsEvent>(`/events/${id}`, data),
  destroy: (id: number) => api.delete(`/events/${id}`),
  register: (eventId: number) => api.post<EventRegistration>(`/events/${eventId}/register`),
  cancelRegistration: (eventId: number) => api.post(`/events/${eventId}/cancel-registration`),
  markAttended: (eventId: number, userIds: number[]) =>
    api.post(`/events/${eventId}/mark-attended`, { user_ids: userIds }),
  upcoming: () => api.get<InsuronsEvent[]>('/events/upcoming'),
};
