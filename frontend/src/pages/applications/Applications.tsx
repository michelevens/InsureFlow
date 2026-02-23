import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { FileText, Search, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { applicationService, type ApplicationListResponse } from '@/services/api/applications';
import type { Application } from '@/types';

type AppStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'declined' | 'bound';

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<ApplicationListResponse['counts']>({ total: 0, draft: 0, submitted: 0, under_review: 0, approved: 0, declined: 0, bound: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await applicationService.list(statusFilter ? { status: statusFilter } : undefined);
      setApplications(res.items);
      setCounts(res.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter(app => {
    if (!search) return true;
    const q = search.toLowerCase();
    const applicantName = app.applicant_data ? `${app.applicant_data.first_name || ''} ${app.applicant_data.last_name || ''}` : (app.user?.name || '');
    return applicantName.toLowerCase().includes(q) || app.reference.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-500 mt-1">Track insurance applications through the pipeline</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.entries(statusConfig) as [AppStatus, typeof statusConfig[AppStatus]][]).map(([key, config]) => (
          <Card key={key} className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{counts[key as keyof typeof counts] || 0}</p>
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

      {/* Error state */}
      {error && (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadApplications}>Retry</Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading applications...</p>
        </Card>
      )}

      {/* Applications table */}
      {!loading && !error && (
        <Card>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No applications found</p>
            </div>
          ) : (
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
                    const config = statusConfig[app.status as AppStatus] || statusConfig.draft;
                    const applicantName = app.applicant_data
                      ? `${app.applicant_data.first_name || ''} ${app.applicant_data.last_name || ''}`.trim()
                      : (app.user?.name || '-');
                    return (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-sm text-shield-600">{app.reference}</td>
                        <td className="p-4 font-medium text-slate-900">{applicantName}</td>
                        <td className="p-4 text-sm text-slate-700 capitalize">{(app.insurance_type || '').replace(/_/g, ' ')}</td>
                        <td className="p-4 text-sm text-slate-700">{app.carrier_name}</td>
                        <td className="p-4 text-sm font-medium text-slate-900">${app.monthly_premium}/mo</td>
                        <td className="p-4">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{app.submitted_at || app.created_at?.split('T')[0] || '-'}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
