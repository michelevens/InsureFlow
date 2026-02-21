import { api } from './client';

export interface LeadScoreFactors {
  profile_completeness: { score: number; max: number };
  coverage_amount: { score: number; max: number };
  engagement_recency: { score: number; max: number };
  engagement_frequency: { score: number; max: number };
  pipeline_stage: { score: number; max: number };
  source_quality: { score: number; max: number };
}

export interface LeadScore {
  id: number;
  insurance_profile_id: number;
  score: number;
  factors: LeadScoreFactors;
  model_version: string;
  updated_at: string;
  insurance_profile?: {
    id: number;
    insurance_type: string;
    stage: string;
    consumer_id: number;
    coverage_amount: number;
    created_at: string;
  };
}

export const leadScoringService = {
  async getScore(profileId: number): Promise<LeadScore> {
    return api.get<LeadScore>(`/profiles/${profileId}/score`);
  },

  async trackEngagement(data: {
    insurance_profile_id: number;
    event_type: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await api.post('/engagement/track', data);
  },

  async getTopLeads(limit = 20): Promise<LeadScore[]> {
    return api.get<LeadScore[]>(`/lead-scores/top?limit=${limit}`);
  },

  async rescoreAll(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/lead-scores/rescore');
  },
};
