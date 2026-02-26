import { api } from './client';

export interface VapidKeyResponse {
  publicKey: string;
}

export const pushService = {
  /** Get the server's VAPID public key for push subscription */
  async getVapidKey(): Promise<VapidKeyResponse> {
    return api.get<VapidKeyResponse>('/push/vapid-key');
  },

  /** Send push subscription to backend */
  async subscribe(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    await api.post('/push/subscribe', {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      },
    });
  },

  /** Remove push subscription from backend */
  async unsubscribe(endpoint: string): Promise<void> {
    await api.post('/push/unsubscribe', { endpoint });
  },
};
