import { api } from './client';

export interface Webhook {
  id: number;
  user_id: number;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  deliveries_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  response_time_ms: number | null;
  error_message: string | null;
  status: 'pending' | 'success' | 'failed';
  attempt: number;
  created_at: string;
}

export interface WebhookEventType {
  [key: string]: string;
}

export const webhookService = {
  async list(): Promise<Webhook[]> {
    return api.get<Webhook[]>('/webhooks');
  },

  async create(data: { name: string; url: string; events: string[] }): Promise<Webhook> {
    return api.post<Webhook>('/webhooks', data);
  },

  async update(id: number, data: Partial<{ name: string; url: string; events: string[]; is_active: boolean }>): Promise<Webhook> {
    return api.put<Webhook>(`/webhooks/${id}`, data);
  },

  async remove(id: number): Promise<void> {
    return api.delete(`/webhooks/${id}`);
  },

  async deliveries(id: number): Promise<WebhookDelivery[]> {
    return api.get<WebhookDelivery[]>(`/webhooks/${id}/deliveries`);
  },

  async test(id: number): Promise<WebhookDelivery> {
    return api.post<WebhookDelivery>(`/webhooks/${id}/test`);
  },

  async retry(deliveryId: number): Promise<WebhookDelivery> {
    return api.post<WebhookDelivery>(`/webhook-deliveries/${deliveryId}/retry`);
  },

  async eventTypes(): Promise<WebhookEventType> {
    return api.get<WebhookEventType>('/webhooks/event-types');
  },
};
