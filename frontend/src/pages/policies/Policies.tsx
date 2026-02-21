import { useState } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { ShieldCheck, Search, Calendar, DollarSign, AlertCircle, Eye, Download } from 'lucide-react';

interface Policy {
  id: string;
  policy_number: string;
  holder: string;
  type: string;
  carrier: string;
  premium: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'cancelled';
  effective_date: string;
  expiration_date: string;
}

const mockPolicies: Policy[] = [
  { id: '1', policy_number: 'POL-2026-0412', holder: 'John Miller', type: 'Auto', carrier: 'StateFarm', premium: '$127/mo', status: 'active', effective_date: '2026-01-15', expiration_date: '2027-01-15' },
  { id: '2', policy_number: 'POL-2026-0389', holder: 'Emily Davis', type: 'Home', carrier: 'Allstate', premium: '$195/mo', status: 'active', effective_date: '2025-12-01', expiration_date: '2026-12-01' },
  { id: '3', policy_number: 'POL-2025-0287', holder: 'Robert Wilson', type: 'Life', carrier: 'MetLife', premium: '$85/mo', status: 'expiring_soon', effective_date: '2025-03-10', expiration_date: '2026-03-10' },
  { id: '4', policy_number: 'POL-2025-0156', holder: 'Sarah Brown', type: 'Auto', carrier: 'Progressive', premium: '$142/mo', status: 'expired', effective_date: '2025-01-01', expiration_date: '2026-01-01' },
  { id: '5', policy_number: 'POL-2026-0501', holder: 'James Taylor', type: 'Business', carrier: 'Hartford', premium: '$450/mo', status: 'active', effective_date: '2026-02-01', expiration_date: '2027-02-01' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  expiring_soon: { label: 'Expiring Soon', variant: 'warning' },
  expired: { label: 'Expired', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

export default function Policies() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockPolicies.filter(p => {
    if (search && !p.holder.toLowerCase().includes(search.toLowerCase()) && !p.policy_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Policies</h1>
        <p className="text-slate-500 mt-1">Manage active and expiring insurance policies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-savings-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{mockPolicies.filter(p => p.status === 'active').length}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{mockPolicies.filter(p => p.status === 'expiring_soon').length}</p>
              <p className="text-sm text-slate-500">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-xl font-bold text-slate-900">{mockPolicies.filter(p => p.status === 'expired').length}</p>
              <p className="text-sm text-slate-500">Expired</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-shield-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">$999/mo</p>
              <p className="text-sm text-slate-500">Total Premium</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search by holder or policy number..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
        </div>
        <div className="w-48">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'expired', label: 'Expired' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Policies table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Policy #</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Holder</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Carrier</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Premium</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Expiration</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(policy => {
                const config = statusConfig[policy.status];
                return (
                  <tr key={policy.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-sm text-shield-600">{policy.policy_number}</td>
                    <td className="p-4 font-medium text-slate-900">{policy.holder}</td>
                    <td className="p-4 text-sm text-slate-700">{policy.type}</td>
                    <td className="p-4 text-sm text-slate-700">{policy.carrier}</td>
                    <td className="p-4 text-sm font-medium text-slate-900">{policy.premium}</td>
                    <td className="p-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{policy.expiration_date}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
