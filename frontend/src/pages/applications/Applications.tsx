import { useState } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { FileText, Search, Clock, CheckCircle2, XCircle, AlertCircle, Eye, ArrowRight } from 'lucide-react';

type AppStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'declined' | 'bound';

interface Application {
  id: string;
  reference: string;
  applicant: string;
  insurance_type: string;
  carrier: string;
  premium: string;
  status: AppStatus;
  submitted_at: string;
}

const mockApplications: Application[] = [
  { id: '1', reference: 'APP-2026-001', applicant: 'John Miller', insurance_type: 'Auto', carrier: 'StateFarm', premium: '$127/mo', status: 'submitted', submitted_at: '2026-02-20' },
  { id: '2', reference: 'APP-2026-002', applicant: 'Emily Davis', insurance_type: 'Home', carrier: 'Allstate', premium: '$195/mo', status: 'under_review', submitted_at: '2026-02-19' },
  { id: '3', reference: 'APP-2026-003', applicant: 'Robert Wilson', insurance_type: 'Life', carrier: 'MetLife', premium: '$85/mo', status: 'approved', submitted_at: '2026-02-18' },
  { id: '4', reference: 'APP-2026-004', applicant: 'Sarah Brown', insurance_type: 'Auto + Home', carrier: 'Progressive', premium: '$310/mo', status: 'bound', submitted_at: '2026-02-15' },
  { id: '5', reference: 'APP-2026-005', applicant: 'James Taylor', insurance_type: 'Business', carrier: 'Hartford', premium: '$450/mo', status: 'declined', submitted_at: '2026-02-14' },
  { id: '6', reference: 'APP-2026-006', applicant: 'Lisa Park', insurance_type: 'Auto', carrier: 'Geico', premium: '$98/mo', status: 'draft', submitted_at: '2026-02-20' },
];

const statusConfig: Record<AppStatus, { label: string; variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'default', icon: <FileText className="w-3.5 h-3.5" /> },
  submitted: { label: 'Submitted', variant: 'shield', icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: 'Under Review', variant: 'warning', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  approved: { label: 'Approved', variant: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  declined: { label: 'Declined', variant: 'danger', icon: <XCircle className="w-3.5 h-3.5" /> },
  bound: { label: 'Bound', variant: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'bound', label: 'Bound' },
];

export default function Applications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockApplications.filter(app => {
    if (search && !app.applicant.toLowerCase().includes(search.toLowerCase()) && !app.reference.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && app.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-500 mt-1">Track insurance applications through the pipeline</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card key={key} className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">
              {mockApplications.filter(a => a.status === key).length}
            </p>
            <p className="text-xs text-slate-500 capitalize">{config.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search by name or reference..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
        </div>
        <div className="w-48">
          <Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </div>
      </div>

      {/* Applications table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Reference</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Applicant</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Carrier</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Premium</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(app => {
                const config = statusConfig[app.status];
                return (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-sm text-shield-600">{app.reference}</td>
                    <td className="p-4 font-medium text-slate-900">{app.applicant}</td>
                    <td className="p-4 text-sm text-slate-700">{app.insurance_type}</td>
                    <td className="p-4 text-sm text-slate-700">{app.carrier}</td>
                    <td className="p-4 text-sm font-medium text-slate-900">{app.premium}</td>
                    <td className="p-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{app.submitted_at}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
