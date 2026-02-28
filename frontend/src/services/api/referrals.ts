import { api } from './client';

export interface ReferralDashboardResponse {
  code: string;
  referral_url: string;
  stats: {
    total_referrals: number;
    pending: number;
    qualified: number;
    rewarded: number;
    total_earned: number;
  };
  balance: number;
  referrals: {
    id: number;
    referred_name: string;
    status: 'pending' | 'qualified' | 'rewarded' | 'expired';
    created_at: string;
    qualified_at: string | null;
    rewarded_at: string | null;
  }[];
  credits: {
    id: number;
    amount: number;
    type: 'earned' | 'spent' | 'expired' | 'bonus';
    description: string;
    created_at: string;
  }[];
}

export interface LeaderboardEntry {
  name: string;
  referrals: number;
}

export const referralService = {
  async dashboard(): Promise<ReferralDashboardResponse> {
    return api.get<ReferralDashboardResponse>('/referrals/dashboard');
  },

  async validateCode(code: string): Promise<{ valid: boolean; referrer_name?: string; message?: string }> {
    return api.post<{ valid: boolean; referrer_name?: string; message?: string }>('/referrals/validate', { code });
  },

  async leaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    return api.get<{ leaderboard: LeaderboardEntry[] }>('/referrals/leaderboard');
  },
};
