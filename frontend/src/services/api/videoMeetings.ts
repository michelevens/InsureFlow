import { api } from './client';

export type MeetingStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'system' | 'external';
export type PreferredProvider = 'system' | 'custom';

export interface VideoMeeting {
  id: number;
  appointment_id: number | null;
  host_user_id: number;
  guest_user_id: number | null;
  title: string;
  status: MeetingStatus;
  meeting_type: MeetingType;
  external_service: string | null;
  external_url: string | null;
  meeting_token: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  metadata: Record<string, unknown> | null;
  host?: { id: number; name: string; email: string };
  guest?: { id: number; name: string; email: string };
  appointment?: { id: number; title: string; date: string };
  created_at: string;
  updated_at: string;
}

export interface VideoMeetingSetting {
  id: number;
  user_id: number;
  preferred_provider: PreferredProvider;
  custom_service: string | null;
  custom_meeting_link: string | null;
  auto_record: boolean;
  waiting_room_enabled: boolean;
  early_join_minutes: number;
}

export interface MeetingLink {
  meeting_type: MeetingType;
  url: string;
  external_service: string | null;
}

export const videoMeetingService = {
  async list(params?: { status?: string; from?: string; to?: string }): Promise<VideoMeeting[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const qs = query.toString();
    return api.get<VideoMeeting[]>(`/meetings${qs ? `?${qs}` : ''}`);
  },

  async show(id: number): Promise<VideoMeeting> {
    return api.get<VideoMeeting>(`/meetings/${id}`);
  },

  async showByToken(token: string): Promise<VideoMeeting> {
    return api.get<VideoMeeting>(`/meetings/token/${token}`);
  },

  async create(data: {
    title: string;
    guest_user_id?: number | null;
    appointment_id?: number | null;
    scheduled_at?: string;
    meeting_type?: MeetingType;
    external_url?: string;
  }): Promise<VideoMeeting> {
    return api.post<VideoMeeting>('/meetings', data);
  },

  async start(id: number): Promise<VideoMeeting> {
    return api.post<VideoMeeting>(`/meetings/${id}/start`);
  },

  async end(id: number): Promise<VideoMeeting> {
    return api.post<VideoMeeting>(`/meetings/${id}/end`);
  },

  async cancel(id: number): Promise<VideoMeeting> {
    return api.post<VideoMeeting>(`/meetings/${id}/cancel`);
  },

  async getLink(id: number): Promise<MeetingLink> {
    return api.get<MeetingLink>(`/meetings/${id}/link`);
  },

  async getSettings(): Promise<VideoMeetingSetting> {
    return api.get<VideoMeetingSetting>('/meetings/settings');
  },

  async updateSettings(data: Partial<Omit<VideoMeetingSetting, 'id' | 'user_id'>>): Promise<VideoMeetingSetting> {
    return api.put<VideoMeetingSetting>('/meetings/settings', data);
  },
};
