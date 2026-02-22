import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { analyticsService } from '@/services/api/analytics';
import {
  Users, Building2, BarChart3, DollarSign,
  ShieldCheck, Target, Loader2,
} from 'lucide-react';

interface AdminStats {
  total_users: number;
  total_agents: number;
  total_agencies: number;
  total_leads: number;
  total_policies: number;
  total_applications: number;
  platform_revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats()
      .then((data) => setStats(data as unknown as AdminStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? '0';
  const fmtCurrency = (n: number | undefined) => {
    const val = n ?? 0;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Insurons administration dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
            </Card>
          ))
        ) : (
          <>
            <StatsCard icon={<Users className="w-5 h-5" />} label="Total Users" value={fmt(stats?.total_users)} />
            <StatsCard icon={<Building2 className="w-5 h-5" />} label="Agencies" value={fmt(stats?.total_agencies)} />
            <StatsCard icon={<Target className="w-5 h-5" />} label="Leads Generated" value={fmt(stats?.total_leads)} />
            <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Policies Bound" value={fmt(stats?.total_policies)} />
            <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Platform Revenue" value={fmtCurrency(stats?.platform_revenue)} variant="savings" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Platform metrics */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Metrics</h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-shield-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-shield-50">
                    <p className="text-sm text-slate-500">Total Agents</p>
                    <p className="text-2xl font-bold text-shield-700 mt-1">{fmt(stats?.total_agents)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-confidence-50">
                    <p className="text-sm text-slate-500">Applications</p>
                    <p className="text-2xl font-bold text-confidence-700 mt-1">{fmt(stats?.total_applications)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-savings-50">
                    <p className="text-sm text-slate-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-savings-700 mt-1">
                      {stats?.total_leads && stats?.total_policies
                        ? `${((stats.total_policies / stats.total_leads) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50">
                    <p className="text-sm text-slate-500">Agencies</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{fmt(stats?.total_agencies)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50">
                    <p className="text-sm text-slate-500">Total Leads</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{fmt(stats?.total_leads)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50">
                    <p className="text-sm text-slate-500">Policies Bound</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1">{fmt(stats?.total_policies)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Admin quick links */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Tools</h2>
            <div className="space-y-2">
              <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Users className="w-5 h-5 text-shield-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">User Management</p>
                  <p className="text-xs text-slate-500">Manage users & roles</p>
                </div>
              </Link>
              <Link to="/admin/agencies" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Building2 className="w-5 h-5 text-confidence-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Agency Management</p>
                  <p className="text-xs text-slate-500">Agencies & agents</p>
                </div>
              </Link>
              <Link to="/admin/analytics" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <BarChart3 className="w-5 h-5 text-savings-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Analytics</p>
                  <p className="text-xs text-slate-500">Platform metrics</p>
                </div>
              </Link>
              <Link to="/admin/plans" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Subscription Plans</p>
                  <p className="text-xs text-slate-500">Pricing & billing</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
