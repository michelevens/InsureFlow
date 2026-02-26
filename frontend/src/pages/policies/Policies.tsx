import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { ShieldCheck, Search, Calendar, DollarSign, AlertCircle, Eye, Download, Loader2 } from 'lucide-react';
import { policyService, type PolicyListResponse } from '@/services/api/policies';
import type { Policy } from '@/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  expiring_soon: { label: 'Expiring Soon', variant: 'warning' },
  expired: { label: 'Expired', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

export default function Policies() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [counts, setCounts] = useState<PolicyListResponse['counts']>({ total: 0, active: 0, expiring_soon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPolicies();
  }, [statusFilter]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await policyService.list(statusFilter ? { status: statusFilter } : undefined);
      setPolicies(res.items);
      setCounts(res.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const filtered = policies.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const holderName = p.user?.name || '';
    return holderName.toLowerCase().includes(q) || p.policy_number.toLowerCase().includes(q) || p.carrier_name.toLowerCase().includes(q);
  });

  const totalPremium = policies.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.monthly_premium || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Policies</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage active and expiring insurance policies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-savings-500" />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{counts.active}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{counts.expiring_soon}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{counts.expired}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expired</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-shield-500" />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">${totalPremium.toLocaleString()}/mo</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Premium</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search by holder, policy number, or carrier..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
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

      {/* Error state */}
      {error && (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadPolicies}>Retry</Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading policies...</p>
        </Card>
      )}

      {/* Policies table */}
      {!loading && !error && (
        <Card>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No policies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Policy #</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Holder</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Carrier</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Premium</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Expiration</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(policy => {
                    const config = statusConfig[policy.status] || statusConfig.active;
                    return (
                      <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                        <td className="p-4 font-mono text-sm text-shield-600 dark:text-shield-400">{policy.policy_number}</td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">{policy.user?.name || '-'}</td>
                        <td className="p-4 text-sm text-slate-700 dark:text-slate-200 capitalize">{(policy.type || '').replace(/_/g, ' ')}</td>
                        <td className="p-4 text-sm text-slate-700 dark:text-slate-200">{policy.carrier_name}</td>
                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">${policy.monthly_premium}/mo</td>
                        <td className="p-4">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{policy.expiration_date}</td>
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
          )}
        </Card>
      )}
    </div>
  );
}
