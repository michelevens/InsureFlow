import { useState, useEffect } from 'react';
import { renewalService } from '@/services/api/renewals';
import type { RenewalOpportunity, RenewalDashboard } from '@/services/api/renewals';
import { Badge } from '@/components/ui';
import {
  RefreshCw, Calendar, DollarSign, AlertTriangle, TrendingUp,
  ChevronRight, Filter, Loader2, CheckCircle, XCircle, Phone,
} from 'lucide-react';

const statusConfig: Record<string, { variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' | 'outline'; label: string }> = {
  upcoming: { variant: 'info', label: 'Upcoming' },
  contacted: { variant: 'shield', label: 'Contacted' },
  requoted: { variant: 'warning', label: 'Requoted' },
  renewed: { variant: 'success', label: 'Renewed' },
  lost: { variant: 'danger', label: 'Lost' },
  expired: { variant: 'outline', label: 'Expired' },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof TrendingUp; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Renewals() {
  const [renewals, setRenewals] = useState<RenewalOpportunity[]>([]);
  const [dashboard, setDashboard] = useState<RenewalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState(90);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [renewalRes, dashRes] = await Promise.all([
        renewalService.getRenewals({
          status: statusFilter || undefined,
          days: daysFilter,
          upcoming_only: !statusFilter || ['upcoming', 'contacted', 'requoted'].includes(statusFilter),
        }),
        renewalService.getDashboard(),
      ]);
      setRenewals(renewalRes.data);
      setDashboard(dashRes);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [statusFilter, daysFilter]);

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await renewalService.updateStatus(id, { status });
      loadData();
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Renewals</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage policy renewals and retain clients</p>
      </div>

      {/* Dashboard stats */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Due in 30 days" value={dashboard.upcoming_30} icon={Calendar} color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
          <StatCard label="Due in 60 days" value={dashboard.upcoming_60} icon={Calendar} color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
          <StatCard label="At Risk" value={dashboard.at_risk} icon={AlertTriangle} color="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
          <StatCard
            label="Retention Rate"
            value={dashboard.retention_rate !== null ? `${dashboard.retention_rate}%` : 'N/A'}
            icon={TrendingUp}
            color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <select
          value={daysFilter}
          onChange={e => setDaysFilter(Number(e.target.value))}
          className="rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
        >
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
          <option value={180}>Next 6 months</option>
          <option value={365}>Next year</option>
        </select>
      </div>

      {/* Renewal list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : renewals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50">
          <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No renewals found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Renewal opportunities appear as policies near expiration</p>
        </div>
      ) : (
        <div className="space-y-3">
          {renewals.map(renewal => {
            const days = daysUntil(renewal.renewal_date);
            const cfg = statusConfig[renewal.status] || statusConfig.upcoming;
            const isUrgent = days <= 14 && !['renewed', 'lost'].includes(renewal.status);

            return (
              <div
                key={renewal.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all ${
                  isUrgent ? 'border-red-200 bg-red-50 dark:bg-red-900/30/30' : 'border-slate-200 dark:border-slate-700/50 hover:border-shield-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <RefreshCw className={`w-5 h-5 ${isUrgent ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {renewal.policy?.policy_number || `Policy #${renewal.policy_id}`}
                        </p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        {isUrgent && <Badge variant="danger">Urgent</Badge>}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {renewal.consumer?.name} &middot; {renewal.policy?.insurance_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(renewal.renewal_date).toLocaleDateString()}
                        <span className={`ml-1 font-medium ${days <= 14 ? 'text-red-600 dark:text-red-400' : days <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          ({days}d)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm mt-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-200 font-medium">${Number(renewal.current_premium).toLocaleString()}</span>
                        {renewal.best_new_premium && (
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            → ${Number(renewal.best_new_premium).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    {!['renewed', 'lost', 'expired'].includes(renewal.status) && (
                      <div className="flex gap-1">
                        {renewal.status === 'upcoming' && (
                          <button
                            onClick={() => handleStatusUpdate(renewal.id, 'contacted')}
                            disabled={updatingId === renewal.id}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            title="Mark as contacted"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusUpdate(renewal.id, 'renewed')}
                          disabled={updatingId === renewal.id}
                          className="p-2 rounded-lg hover:bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          title="Mark as renewed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(renewal.id, 'lost')}
                          disabled={updatingId === renewal.id}
                          className="p-2 rounded-lg hover:bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          title="Mark as lost"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>

                {/* Retention score bar */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Retention</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        renewal.retention_score >= 70 ? 'bg-green-500' :
                        renewal.retention_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${renewal.retention_score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    renewal.retention_score >= 70 ? 'text-green-600 dark:text-green-400' :
                    renewal.retention_score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {renewal.retention_score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
