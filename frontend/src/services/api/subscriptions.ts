import { api } from './client';

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: string;
  annual_price: string;
  target_role: string;
  features: string[] | null;
  limits: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
}

export interface SubscriptionCurrent {
  subscription: {
    id: number;
    user_id: number;
    subscription_plan_id: number;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    billing_cycle: 'monthly' | 'annual';
    current_period_start: string | null;
    current_period_end: string | null;
    canceled_at: string | null;
    plan?: SubscriptionPlan;
  } | null;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface PortalResponse {
  portal_url: string;
}

export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    return api.get<SubscriptionPlan[]>('/subscription-plans');
  },

  async checkout(planId: number, billingCycle: 'monthly' | 'annual'): Promise<CheckoutResponse> {
    return api.post<CheckoutResponse>('/subscriptions/checkout', {
      plan_id: planId,
      billing_cycle: billingCycle,
    });
  },

  async current(): Promise<SubscriptionCurrent> {
    return api.get<SubscriptionCurrent>('/subscriptions/current');
  },

  async cancel(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/subscriptions/cancel', {});
  },

  async resume(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/subscriptions/resume', {});
  },

  async portal(): Promise<PortalResponse> {
    return api.post<PortalResponse>('/subscriptions/portal', {});
  },
};
