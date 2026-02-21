import { useState } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { Users, Plus, Search, Mail, Phone, Star, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  leads_assigned: number;
  policies_bound: number;
  rating: number;
  joined_at: string;
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '(214) 555-0123', role: 'Senior Agent', status: 'active', leads_assigned: 45, policies_bound: 32, rating: 4.9, joined_at: '2025-03-15' },
  { id: '2', name: 'Michael Chen', email: 'michael@email.com', phone: '(415) 555-0456', role: 'Agent', status: 'active', leads_assigned: 30, policies_bound: 22, rating: 4.8, joined_at: '2025-06-20' },
  { id: '3', name: 'Amanda Rodriguez', email: 'amanda@email.com', phone: '(305) 555-0789', role: 'Agent', status: 'active', leads_assigned: 35, policies_bound: 25, rating: 4.7, joined_at: '2025-08-10' },
  { id: '4', name: 'David Williams', email: 'david@email.com', phone: '(312) 555-0321', role: 'Junior Agent', status: 'active', leads_assigned: 15, policies_bound: 10, rating: 4.5, joined_at: '2025-11-01' },
  { id: '5', name: 'New Recruit', email: 'recruit@email.com', phone: '', role: 'Agent', status: 'invited', leads_assigned: 0, policies_bound: 0, rating: 0, joined_at: '2026-02-18' },
];

export default function AgencyTeam() {
  const [search, setSearch] = useState('');

  const filtered = mockTeam.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
          <p className="text-slate-500 mt-1">Manage your agency's agents and team members</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />}>Invite Agent</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockTeam.filter(m => m.status === 'active').length}</p>
          <p className="text-sm text-slate-500">Active Agents</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-amber-600">{mockTeam.filter(m => m.status === 'invited').length}</p>
          <p className="text-sm text-slate-500">Pending Invites</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{mockTeam.reduce((sum, m) => sum + m.leads_assigned, 0)}</p>
          <p className="text-sm text-slate-500">Total Leads</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-savings-600">{mockTeam.reduce((sum, m) => sum + m.policies_bound, 0)}</p>
          <p className="text-sm text-slate-500">Total Policies</p>
        </Card>
      </div>

      <Input placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />

      {/* Team grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(member => (
          <Card key={member.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-shield flex items-center justify-center text-white font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                </div>
                <Badge variant={member.status === 'active' ? 'success' : member.status === 'invited' ? 'warning' : 'danger'}>
                  {member.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {member.phone}
                  </div>
                )}
                {member.rating > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {member.rating} rating
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{member.leads_assigned}</p>
                  <p className="text-xs text-slate-500">Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-savings-600">{member.policies_bound}</p>
                  <p className="text-xs text-slate-500">Policies</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
