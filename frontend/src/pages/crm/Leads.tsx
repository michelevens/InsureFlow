import { useState } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import {
  Target, Search, Filter, Phone, Mail, Clock, ArrowRight, Plus,
  ChevronDown, User, MapPin, Calendar,
} from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'quoted' | 'applied' | 'won' | 'lost';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  insurance_type: string;
  status: LeadStatus;
  source: string;
  created_at: string;
  location: string;
  value: string;
}

const mockLeads: Lead[] = [
  { id: '1', name: 'John Miller', email: 'john@email.com', phone: '(555) 123-4567', insurance_type: 'Auto', status: 'new', source: 'Website', created_at: '2 hours ago', location: 'Dallas, TX', value: '$1,200' },
  { id: '2', name: 'Emily Davis', email: 'emily@email.com', phone: '(555) 234-5678', insurance_type: 'Home', status: 'contacted', source: 'Referral', created_at: '5 hours ago', location: 'Austin, TX', value: '$2,400' },
  { id: '3', name: 'Robert Wilson', email: 'robert@email.com', phone: '(555) 345-6789', insurance_type: 'Life', status: 'quoted', source: 'Website', created_at: '1 day ago', location: 'Houston, TX', value: '$3,600' },
  { id: '4', name: 'Sarah Brown', email: 'sarah@email.com', phone: '(555) 456-7890', insurance_type: 'Auto + Home', status: 'applied', source: 'Marketplace', created_at: '2 days ago', location: 'San Antonio, TX', value: '$4,800' },
  { id: '5', name: 'James Taylor', email: 'james@email.com', phone: '(555) 567-8901', insurance_type: 'Business', status: 'new', source: 'Website', created_at: '3 days ago', location: 'Fort Worth, TX', value: '$6,000' },
  { id: '6', name: 'Jennifer Martinez', email: 'jennifer@email.com', phone: '(555) 678-9012', insurance_type: 'Health', status: 'won', source: 'Referral', created_at: '5 days ago', location: 'El Paso, TX', value: '$2,100' },
  { id: '7', name: 'David Anderson', email: 'david@email.com', phone: '(555) 789-0123', insurance_type: 'Umbrella', status: 'lost', source: 'Website', created_at: '1 week ago', location: 'Plano, TX', value: '$1,800' },
];

const statusConfig: Record<LeadStatus, { label: string; variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: 'New', variant: 'shield' },
  contacted: { label: 'Contacted', variant: 'info' },
  quoted: { label: 'Quoted', variant: 'warning' },
  applied: { label: 'Applied', variant: 'info' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'danger' },
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'applied', label: 'Applied' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export default function Leads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockLeads.filter(lead => {
    if (search && !lead.name.toLowerCase().includes(search.toLowerCase()) && !lead.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && lead.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: mockLeads.length,
    new: mockLeads.filter(l => l.status === 'new').length,
    active: mockLeads.filter(l => ['contacted', 'quoted', 'applied'].includes(l.status)).length,
    won: mockLeads.filter(l => l.status === 'won').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
          <p className="text-slate-500 mt-1">Manage and track your insurance leads</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
          <p className="text-sm text-slate-500">Total Leads</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-shield-600">{counts.new}</p>
          <p className="text-sm text-slate-500">New</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-confidence-600">{counts.active}</p>
          <p className="text-sm text-slate-500">In Progress</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-savings-600">{counts.won}</p>
          <p className="text-sm text-slate-500">Won</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
        </div>
        <div className="w-48">
          <Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </div>
      </div>

      {/* Lead list */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Lead</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Insurance</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Source</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Value</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(lead => {
                const config = statusConfig[lead.status];
                return (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-sm font-bold">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-700">{lead.insurance_type}</td>
                    <td className="p-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{lead.source}</td>
                    <td className="p-4 text-sm font-medium text-slate-900">{lead.value}</td>
                    <td className="p-4 text-sm text-slate-500">{lead.created_at}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm"><Phone className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>
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
