import { useState } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { Users, Search, Shield, ShieldCheck, Ban, MoreVertical, Mail } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  created_at: string;
  last_login: string;
}

const mockUsers: UserRow[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', role: 'agent', status: 'active', created_at: '2025-06-15', last_login: '2 hours ago' },
  { id: '2', name: 'Michael Chen', email: 'michael@email.com', role: 'agent', status: 'active', created_at: '2025-08-20', last_login: '1 day ago' },
  { id: '3', name: 'John Miller', email: 'john@email.com', role: 'consumer', status: 'active', created_at: '2026-01-10', last_login: '5 hours ago' },
  { id: '4', name: 'Emily Davis', email: 'emily@email.com', role: 'consumer', status: 'active', created_at: '2026-01-15', last_login: '3 days ago' },
  { id: '5', name: 'Pacific Shield Insurance', email: 'admin@pacificshield.com', role: 'agency_owner', status: 'active', created_at: '2025-09-01', last_login: '6 hours ago' },
  { id: '6', name: 'StateFarm Rep', email: 'rep@statefarm.com', role: 'carrier', status: 'active', created_at: '2025-07-01', last_login: '1 week ago' },
  { id: '7', name: 'Bad Actor', email: 'spam@test.com', role: 'consumer', status: 'suspended', created_at: '2026-02-01', last_login: 'Never' },
];

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

  const filtered = mockUsers.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">Manage platform users and roles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockUsers.length}</p>
          <p className="text-sm text-slate-500">Total Users</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockUsers.filter(u => u.role === 'consumer').length}</p>
          <p className="text-sm text-slate-500">Consumers</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockUsers.filter(u => u.role === 'agent').length}</p>
          <p className="text-sm text-slate-500">Agents</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockUsers.filter(u => u.role === 'agency_owner').length}</p>
          <p className="text-sm text-slate-500">Agencies</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockUsers.filter(u => u.role === 'carrier').length}</p>
          <p className="text-sm text-slate-500">Carriers</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
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

      {/* Users table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">User</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Role</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Joined</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Last Login</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(user => (
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
                    <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{user.created_at}</td>
                  <td className="p-4 text-sm text-slate-500">{user.last_login}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm">
                        {user.status === 'active' ? <Ban className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
