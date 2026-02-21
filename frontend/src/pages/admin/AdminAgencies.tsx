import { useState } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Building2, Search, Star, Eye } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  owner: string;
  agents: number;
  city: string;
  state: string;
  rating: number;
  status: 'active' | 'pending' | 'suspended';
  policies_bound: number;
  created_at: string;
}

const mockAgencies: Agency[] = [
  { id: '1', name: 'Johnson Insurance Group', owner: 'Sarah Johnson', agents: 4, city: 'Dallas', state: 'TX', rating: 4.9, status: 'active', policies_bound: 245, created_at: '2025-03-15' },
  { id: '2', name: 'Pacific Shield Insurance', owner: 'Michael Chen', agents: 6, city: 'San Francisco', state: 'CA', rating: 4.8, status: 'active', policies_bound: 312, created_at: '2025-05-20' },
  { id: '3', name: 'TrustBridge Insurance', owner: 'Amanda Rodriguez', agents: 3, city: 'Miami', state: 'FL', rating: 4.7, status: 'active', policies_bound: 178, created_at: '2025-07-10' },
  { id: '4', name: 'Midwest Coverage Co.', owner: 'David Park', agents: 2, city: 'Chicago', state: 'IL', rating: 4.5, status: 'pending', policies_bound: 45, created_at: '2026-01-28' },
  { id: '5', name: 'Lone Star Insurance', owner: 'Robert Martinez', agents: 5, city: 'Austin', state: 'TX', rating: 4.6, status: 'active', policies_bound: 198, created_at: '2025-06-01' },
];

export default function AdminAgencies() {
  const [search, setSearch] = useState('');

  const filtered = mockAgencies.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agency Management</h1>
        <p className="text-slate-500 mt-1">Manage insurance agencies on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockAgencies.length}</p>
          <p className="text-sm text-slate-500">Total Agencies</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-savings-600">{mockAgencies.filter(a => a.status === 'active').length}</p>
          <p className="text-sm text-slate-500">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-amber-600">{mockAgencies.filter(a => a.status === 'pending').length}</p>
          <p className="text-sm text-slate-500">Pending Approval</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockAgencies.reduce((sum, a) => sum + a.agents, 0)}</p>
          <p className="text-sm text-slate-500">Total Agents</p>
        </Card>
      </div>

      {/* Search */}
      <Input placeholder="Search agencies..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />

      {/* Agencies table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Agency</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Owner</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Location</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Agents</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Policies</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Rating</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(agency => (
                <tr key={agency.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-shield-100 text-shield-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-900">{agency.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">{agency.owner}</td>
                  <td className="p-4 text-sm text-slate-500">{agency.city}, {agency.state}</td>
                  <td className="p-4 text-right text-sm font-medium text-slate-900">{agency.agents}</td>
                  <td className="p-4 text-right text-sm font-medium text-slate-900">{agency.policies_bound}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-slate-700">{agency.rating}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={agency.status === 'active' ? 'success' : agency.status === 'pending' ? 'warning' : 'danger'}>
                      {agency.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
