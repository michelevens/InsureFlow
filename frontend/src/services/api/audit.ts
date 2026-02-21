import { api } from './client';

export interface AuditLogEntry {
  id: string;
  auditable_type: string;
  auditable_id: string;
  event_type: string;
  actor_id: number | null;
  actor_role: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: { id: number; name: string; role: string };
}

export interface AuditLogFilters {
  auditable_type?: string;
  event_type?: string;
  actor_id?: number;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

export const auditService = {
  getAuditLogs(filters?: AuditLogFilters): Promise<{
    data: AuditLogEntry[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return api.get(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },

  getEntityAuditTrail(entityType: string, entityId: string): Promise<{
    data: AuditLogEntry[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    return api.get(`/audit-logs/${entityType}/${entityId}`);
  },
};
