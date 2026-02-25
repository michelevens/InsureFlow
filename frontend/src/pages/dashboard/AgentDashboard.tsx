import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { analyticsService } from '@/services/api/analytics';
import {
  Target, FileText, DollarSign, Star, Users, ArrowRight, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';

interface AgentStats {
  total_leads: number;
  new_leads: number;
  applications: number;
  policies_bound: number;
  total_commission: number;
  avg_rating: number;
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Safety valve: stop loading after 10s even if API hangs
      setLoading(false);
    }, 10000);

    analyticsService.getDashboardStats()
      .then((data) => setStats(data as unknown as AgentStats))
      .catch(() => { /* silently fall back to zeros */ })
      .finally(() => { setLoading(false); clearTimeout(timeout); });

    return () => clearTimeout(timeout);
  }, []);

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? '0';
  const fmtCurrency = (n: number | undefined) =>
    `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name?.split(' ')[0]}. Here's your pipeline overview.</p>
        </div>
        <Link to="/crm/leads">
          <Button variant="shield" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>View All Leads</Button>
        </Link>
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
            <StatsCard icon={<Target className="w-5 h-5" />} label="New Leads" value={fmt(stats?.new_leads)} />
            <StatsCard icon={<FileText className="w-5 h-5" />} label="Active Applications" value={fmt(stats?.applications)} />
            <StatsCard icon={<CheckCircle2 className="w-5 h-5" />} label="Policies Bound" value={fmt(stats?.policies_bound)} />
            <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Total Commissions" value={fmtCurrency(stats?.total_commission)} variant="savings" />
            <StatsCard icon={<Star className="w-5 h-5" />} label="Rating" value={stats?.avg_rating?.toFixed(1) ?? '0'} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline summary */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Pipeline Summary</h2>
                <Link to="/crm/leads" className="text-sm text-shield-600 hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-shield-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-shield-50 text-center">
                    <p className="text-2xl font-bold text-shield-700">{fmt(stats?.new_leads)}</p>
                    <p className="text-sm text-slate-500 mt-1">New Leads</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 text-center">
                    <p className="text-2xl font-bold text-amber-700">{fmt(stats?.total_leads ? stats.total_leads - (stats?.new_leads ?? 0) : 0)}</p>
                    <p className="text-sm text-slate-500 mt-1">In Progress</p>
                  </div>
                  <div className="p-4 rounded-xl bg-confidence-50 text-center">
                    <p className="text-2xl font-bold text-confidence-700">{fmt(stats?.applications)}</p>
                    <p className="text-sm text-slate-500 mt-1">Applications</p>
                  </div>
                  <div className="p-4 rounded-xl bg-savings-50 text-center">
                    <p className="text-2xl font-bold text-savings-700">{fmt(stats?.policies_bound)}</p>
                    <p className="text-sm text-slate-500 mt-1">Bound</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Action items */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Action Items</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{stats?.new_leads ?? 0} leads need follow-up</p>
                  <p className="text-xs text-slate-500">New leads awaiting contact</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-shield-50">
                <Clock className="w-5 h-5 text-shield-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{stats?.applications ?? 0} applications pending</p>
                  <p className="text-xs text-slate-500">In review or awaiting documents</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-savings-50">
                <TrendingUp className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{stats?.policies_bound ?? 0} policies bound</p>
                  <p className="text-xs text-slate-500">Lifetime production</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/commissions" className="flex items-center gap-2 text-sm text-slate-600 hover:text-shield-600">
                  <DollarSign className="w-4 h-4" /> Commission Report
                </Link>
                <Link to="/reviews" className="flex items-center gap-2 text-sm text-slate-600 hover:text-shield-600">
                  <Star className="w-4 h-4" /> My Reviews
                </Link>
                <Link to="/settings" className="flex items-center gap-2 text-sm text-slate-600 hover:text-shield-600">
                  <Users className="w-4 h-4" /> Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
