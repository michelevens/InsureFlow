import { api } from './client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string | null;
  action_url: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export const notificationService = {
  async getAll(unreadOnly = false): Promise<{ notifications: AppNotification[] }> {
    const q = unreadOnly ? '?unread_only=1' : '';
    return api.get(`/notifications${q}`);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return api.get('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<void> {
    return api.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    return api.post('/notifications/mark-all-read');
  },
};
