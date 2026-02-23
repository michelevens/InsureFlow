import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { Search, ShieldCheck, Ban, Loader2, Users, Plus, Key, Edit, ArrowLeft, X } from 'lucide-react';
import { adminService, type UserListResponse } from '@/services/api/admin';
import { toast } from 'sonner';
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

  // Detail view
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'agent', password: '', agency_id: '' });
  const [saving, setSaving] = useState(false);

  // Reset password
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => { loadUsers(); }, [roleFilter]);

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

  const handleSearch = () => { loadUsers(); };

  const handleToggleStatus = async (user: User) => {
    try {
      const isActive = (user as User & { is_active?: boolean }).is_active !== false;
      await adminService.toggleUserStatus(user.id, !isActive);
      toast.success(isActive ? 'User deactivated' : 'User activated');
      loadUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'agent', password: '', agency_id: '' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: '', agency_id: user.agency_id?.toString() || '' });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      if (editingUser) {
        const data: Partial<User> = { name: form.name, email: form.email, role: form.role as User['role'] };
        await adminService.updateUser(editingUser.id, data);
        toast.success('User updated');
      } else {
        if (!form.password) { toast.error('Password is required for new users'); setSaving(false); return; }
        await adminService.createUser({ name: form.name, email: form.email, role: form.role, password: form.password, agency_id: form.agency_id ? Number(form.agency_id) : undefined });
        toast.success('User created');
      }
      setShowModal(false);
      loadUsers();
    } catch {
      toast.error('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const res = await adminService.resetPassword(user.id);
      setTempPassword(res.temporary_password);
      toast.success('Password reset successfully');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const totalUsers = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);

  // ========== Detail View ==========
  if (selectedUser) {
    const user = selectedUser;
    const isActive = (user as User & { is_active?: boolean }).is_active !== false;
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setTempPassword(''); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
        </Button>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-shield flex items-center justify-center text-white text-xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={roleColors[user.role] as 'default' | 'shield' | 'info' | 'warning' | 'danger'} className="capitalize">
                {user.role.replace('_', ' ')}
              </Badge>
              <Badge variant={isActive ? 'success' : 'danger'}>{isActive ? 'Active' : 'Suspended'}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-900">{user.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Agency ID</p>
              <p className="text-sm font-medium text-slate-900">{user.agency_id || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email Verified</p>
              <p className="text-sm font-medium text-slate-900">{user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString() : 'Not verified'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Joined</p>
              <p className="text-sm font-medium text-slate-900">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />} onClick={() => openEditModal(user)}>Edit</Button>
            <Button variant="outline" size="sm" leftIcon={<Key className="w-4 h-4" />} onClick={() => handleResetPassword(user)}>Reset Password</Button>
            <Button variant={isActive ? 'outline' : 'primary'} size="sm" onClick={() => handleToggleStatus(user)}>
              {isActive ? <Ban className="w-4 h-4 mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>

          {tempPassword && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">Temporary Password:</p>
              <p className="text-lg font-mono font-bold text-amber-900 mt-1">{tempPassword}</p>
              <p className="text-xs text-amber-600 mt-1">Share this with the user. They should change it after logging in.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ========== List View ==========
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform users and roles</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Create User</Button>
      </div>

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

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} leftIcon={<Search className="w-5 h-5" />} />
        </div>
        <div className="w-48">
          <Select options={[
            { value: '', label: 'All Roles' },
            { value: 'consumer', label: 'Consumer' },
            { value: 'agent', label: 'Agent' },
            { value: 'agency_owner', label: 'Agency Owner' },
            { value: 'carrier', label: 'Carrier' },
          ]} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} />
        </div>
      </div>

      {error && (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadUsers}>Retry</Button>
        </Card>
      )}

      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading users...</p>
        </Card>
      )}

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
                      <tr key={user.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
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
                          <Badge variant={isActive ? 'success' : 'danger'}>{isActive ? 'active' : 'suspended'}</Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{user.created_at?.split('T')[0] || '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}><Edit className="w-4 h-4" /></Button>
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

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{editingUser ? 'Edit User' : 'Create User'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500">
                  <option value="consumer">Consumer</option>
                  <option value="agent">Agent</option>
                  <option value="agency_owner">Agency Owner</option>
                  <option value="carrier">Carrier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" />
                </div>
              )}
              {form.role === 'agent' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Agency ID (optional)</label>
                  <Input value={form.agency_id} onChange={e => setForm({ ...form, agency_id: e.target.value })} placeholder="Agency ID number" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSaveUser} disabled={saving}>{saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
