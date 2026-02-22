import { api } from './client';

export type AppointmentType = 'consultation' | 'review' | 'follow_up' | 'claim' | 'renewal' | 'other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: number;
  agent_id: number;
  consumer_id: number | null;
  lead_id: number | null;
  title: string;
  type: AppointmentType;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  location: string | null;
  video_link: string | null;
  notes: string | null;
  agent?: { id: number; name: string; email: string };
  consumer?: { id: number; name: string; email: string };
  lead?: { id: number; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: number;
  agent_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedDate {
  id: number;
  agent_id: number;
  blocked_date: string;
  reason: string | null;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export const appointmentService = {
  async list(params?: { date_from?: string; date_to?: string; status?: string }): Promise<Appointment[]> {
    const query = new URLSearchParams();
    if (params?.date_from) query.set('date_from', params.date_from);
    if (params?.date_to) query.set('date_to', params.date_to);
    if (params?.status) query.set('status', params.status);
    return api.get<Appointment[]>(`/appointments?${query}`);
  },

  async create(data: {
    agent_id: number;
    consumer_id?: number | null;
    lead_id?: number | null;
    title: string;
    type?: AppointmentType;
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    video_link?: string;
    notes?: string;
  }): Promise<Appointment> {
    return api.post<Appointment>('/appointments', data);
  },

  async show(id: number): Promise<Appointment> {
    return api.get<Appointment>(`/appointments/${id}`);
  },

  async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
    return api.put<Appointment>(`/appointments/${id}`, data);
  },

  async updateStatus(id: number, status: AppointmentStatus, notes?: string): Promise<Appointment> {
    return api.put<Appointment>(`/appointments/${id}/status`, { status, notes });
  },

  async remove(id: number): Promise<void> {
    return api.delete(`/appointments/${id}`);
  },

  async getAvailability(agentId?: number): Promise<AvailabilitySlot[]> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return api.get<AvailabilitySlot[]>(`/availability${query}`);
  },

  async setAvailability(schedule: { day_of_week: number; start_time: string; end_time: string; is_active?: boolean }[]): Promise<AvailabilitySlot[]> {
    return api.post<AvailabilitySlot[]>('/availability', { schedule });
  },

  async getBlockedDates(agentId?: number): Promise<BlockedDate[]> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return api.get<BlockedDate[]>(`/blocked-dates${query}`);
  },

  async blockDate(data: { blocked_date: string; reason?: string }): Promise<BlockedDate> {
    return api.post<BlockedDate>('/blocked-dates', data);
  },

  async unblockDate(id: number): Promise<void> {
    return api.delete(`/blocked-dates/${id}`);
  },

  async availableSlots(agentId: number, date: string, durationMinutes?: number): Promise<{ slots: TimeSlot[]; blocked?: boolean; no_availability?: boolean }> {
    const query = new URLSearchParams({ agent_id: String(agentId), date });
    if (durationMinutes) query.set('duration_minutes', String(durationMinutes));
    return api.get(`/available-slots?${query}`);
  },
};
