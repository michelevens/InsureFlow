import { api } from './client';

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: string | number | string[] | null;
}

export interface WorkflowAction {
  type: string;
  config: Record<string, string | number | boolean>;
}

export interface WorkflowRule {
  id: number;
  agency_id: number | null;
  created_by: number;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  delay_minutes: number;
  is_active: boolean;
  priority: number;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: { id: number; name: string };
  executions_count?: number;
}

export interface WorkflowExecution {
  id: number;
  workflow_rule_id: number;
  agency_id: number | null;
  trigger_event: string;
  trigger_data: Record<string, unknown> | null;
  actions_executed: { type: string; status: string; message?: string }[] | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  rule?: { id: number; name: string; trigger_event: string };
}

export interface WorkflowOptions {
  trigger_events: Record<string, string>;
  action_types: Record<string, { label: string; config: string[] }>;
  operators: Record<string, string>;
  condition_fields: Record<string, string>;
}

export const workflowService = {
  async list(): Promise<{ rules: WorkflowRule[] }> {
    return api.get('/workflows');
  },

  async show(id: number): Promise<{ rule: WorkflowRule; recent_executions: WorkflowExecution[] }> {
    return api.get(`/workflows/${id}`);
  },

  async create(data: {
    name: string;
    description?: string;
    trigger_event: string;
    conditions?: WorkflowCondition[];
    actions: WorkflowAction[];
    delay_minutes?: number;
    priority?: number;
    is_active?: boolean;
  }): Promise<{ rule: WorkflowRule }> {
    return api.post('/workflows', data);
  },

  async update(id: number, data: Partial<WorkflowRule>): Promise<{ rule: WorkflowRule }> {
    return api.put(`/workflows/${id}`, data);
  },

  async destroy(id: number): Promise<void> {
    return api.delete(`/workflows/${id}`);
  },

  async toggle(id: number): Promise<{ rule: WorkflowRule; message: string }> {
    return api.post(`/workflows/${id}/toggle`);
  },

  async test(id: number, context?: Record<string, unknown>): Promise<{ result: Record<string, unknown> }> {
    return api.post(`/workflows/${id}/test`, { context });
  },

  async executions(page?: number): Promise<{ data: WorkflowExecution[]; current_page: number; last_page: number }> {
    return api.get(`/workflows/executions${page ? `?page=${page}` : ''}`);
  },

  async options(): Promise<WorkflowOptions> {
    return api.get('/workflows/options');
  },
};

export interface CommissionSplit {
  id: number;
  commission_id: number;
  agent_id: number;
  split_percentage: string;
  split_amount: string;
  role: 'primary' | 'secondary' | 'referral' | 'override';
  notes: string | null;
  created_at: string;
  agent?: { id: number; name: string };
}

export const commissionSplitService = {
  async list(commissionId: number): Promise<{ splits: CommissionSplit[] }> {
    return api.get(`/commissions/${commissionId}/splits`);
  },

  async create(commissionId: number, data: {
    agent_id: number;
    split_percentage: number;
    role?: string;
    notes?: string;
  }): Promise<{ split: CommissionSplit }> {
    return api.post(`/commissions/${commissionId}/splits`, data);
  },

  async update(commissionId: number, splitId: number, data: {
    split_percentage?: number;
    role?: string;
    notes?: string;
  }): Promise<{ split: CommissionSplit }> {
    return api.put(`/commissions/${commissionId}/splits/${splitId}`, data);
  },

  async destroy(commissionId: number, splitId: number): Promise<void> {
    return api.delete(`/commissions/${commissionId}/splits/${splitId}`);
  },
};
