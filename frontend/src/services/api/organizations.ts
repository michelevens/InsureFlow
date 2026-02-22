import { api } from './client';

export type OrgType = 'mga' | 'agency' | 'sub_agency';
export type OrgMemberRole = 'owner' | 'admin' | 'manager' | 'member';

export interface Organization {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  type: OrgType;
  level: number;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  branding: { logo_url?: string; primary_color?: string; secondary_color?: string } | null;
  settings: Record<string, unknown> | null;
  is_active: boolean;
  parent?: Organization | null;
  children?: Organization[];
  all_descendants?: Organization[];
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: number;
  organization_id: number;
  user_id: number;
  role: OrgMemberRole;
  permissions: Record<string, boolean> | null;
  is_primary: boolean;
  user?: { id: number; name: string; email: string; role: string };
  created_at: string;
}

export const organizationService = {
  async list(): Promise<Organization[]> {
    return api.get<Organization[]>('/organizations');
  },

  async tree(orgId: number): Promise<Organization> {
    return api.get<Organization>(`/organizations/${orgId}/tree`);
  },

  async create(data: {
    name: string;
    type: OrgType;
    parent_id?: number | null;
    tax_id?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    branding?: Record<string, string>;
    settings?: Record<string, unknown>;
  }): Promise<Organization> {
    return api.post<Organization>('/organizations', data);
  },

  async update(orgId: number, data: Partial<Organization>): Promise<Organization> {
    return api.put<Organization>(`/organizations/${orgId}`, data);
  },

  async remove(orgId: number): Promise<void> {
    return api.delete(`/organizations/${orgId}`);
  },

  async members(orgId: number): Promise<OrgMember[]> {
    return api.get<OrgMember[]>(`/organizations/${orgId}/members`);
  },

  async addMember(orgId: number, data: { user_id: number; role?: OrgMemberRole; permissions?: Record<string, boolean> }): Promise<OrgMember> {
    return api.post<OrgMember>(`/organizations/${orgId}/members`, data);
  },

  async updateMember(orgId: number, memberId: number, data: { role?: OrgMemberRole; permissions?: Record<string, boolean> }): Promise<OrgMember> {
    return api.put<OrgMember>(`/organizations/${orgId}/members/${memberId}`, data);
  },

  async removeMember(orgId: number, memberId: number): Promise<void> {
    return api.delete(`/organizations/${orgId}/members/${memberId}`);
  },
};
