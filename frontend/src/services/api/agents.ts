import { api } from './client';
import type { AgentProfile, AgentReview } from '@/types';

interface AgentListResponse {
  items: AgentProfile[];
  counts: { total: number; verified: number };
}

interface AgentDetailResponse {
  item: AgentProfile;
  reviews: AgentReview[];
}

interface MatchResponse {
  agents: AgentProfile[];
}

export const agentService = {
  async search(params?: {
    state?: string;
    specialty?: string;
    carrier_id?: number;
    search?: string;
  }): Promise<AgentListResponse> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.carrier_id) query.set('carrier_id', String(params.carrier_id));
    if (params?.search) query.set('search', params.search);
    return api.get<AgentListResponse>(`/marketplace/agents?${query}`);
  },

  async getAgent(id: number): Promise<AgentDetailResponse> {
    return api.get<AgentDetailResponse>(`/marketplace/agents/${id}`);
  },

  async match(data: { insurance_type: string; state: string; carrier_ids?: number[] }): Promise<MatchResponse> {
    return api.post<MatchResponse>('/marketplace/match', data);
  },

  async getReviews(agentId: number): Promise<{ items: AgentReview[] }> {
    return api.get<{ items: AgentReview[] }>(`/marketplace/agents/${agentId}/reviews`);
  },

  async respondToReview(reviewId: number, response: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/agent/reviews/${reviewId}/respond`, { response });
  },
};
