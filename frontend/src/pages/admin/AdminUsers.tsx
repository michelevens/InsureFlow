import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { Search, ShieldCheck, Ban, Mail, Loader2, Users } from 'lucide-react';
import { adminService, type UserListResponse } from '@/services/api/admin';
import type { User } from '@/types';

const roleColors: Record<string, string> = {
  consumer: 'default',
  agent: 'shield',
  agency_owner: 'info',
  carrier: 'warning',
  admin: 'danger',
  superadmin: 'danger',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<UserListResponse['counts']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params: { role?: string; search?: string } = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await adminService.getUsers(params);
      setUsers(res.items);
      setCounts(res.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadUsers();
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const isActive = (user as User & { is_active?: boolean }).is_active !== false;
      await adminService.toggleUserStatus(user.id, !isActive);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const totalUsers = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">Manage platform users and roles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{totalUsers}</p>
          <p className="text-sm text-slate-500">Total Users</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{counts.consumer || 0}</p>
          <p className="text-sm text-slate-500">Consumers</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{counts.agent || 0}</p>
          <p className="text-sm text-slate-500">Agents</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{counts.agency_owner || 0}</p>
          <p className="text-sm text-slate-500">Agencies</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{counts.carrier || 0}</p>
          <p className="text-sm text-slate-500">Carriers</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="w-48">
          <Select
            options={[
              { value: '', label: 'All Roles' },
              { value: 'consumer', label: 'Consumer' },
              { value: 'agent', label: 'Agent' },
              { value: 'agency_owner', label: 'Agency Owner' },
              { value: 'carrier', label: 'Carrier' },
            ]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadUsers}>Retry</Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading users...</p>
        </Card>
      )}

      {/* Users table */}
      {!loading && !error && (
        <Card>
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">User</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Role</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Joined</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(user => {
                    const isActive = (user as User & { is_active?: boolean }).is_active !== false;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-shield flex items-center justify-center text-white text-sm font-bold">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={roleColors[user.role] as 'default' | 'shield' | 'info' | 'warning' | 'danger'} className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={isActive ? 'success' : 'danger'}>
                            {isActive ? 'active' : 'suspended'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{user.created_at?.split('T')[0] || '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(user)}>
                              {isActive ? <Ban className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
