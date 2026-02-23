import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { analyticsService } from '@/services/api/analytics';
import { Calculator, FileText, ShieldCheck, ClipboardList, ArrowRight, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface ConsumerStats {
  quotes: number;
  applications: number;
  active_policies: number;
  total_premium: number;
}

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ConsumerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats()
      .then((data) => setStats(data as unknown as ConsumerStats))
      .catch(() => { toast.error('Failed to load dashboard stats'); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? '0';
  const fmtCurrency = (n: number | undefined) =>
    `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h1>
        <p className="text-slate-500 mt-1">Manage your insurance quotes, applications, and policies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
            </Card>
          ))
        ) : (
          <>
            <StatsCard icon={<ClipboardList className="w-5 h-5" />} label="Saved Quotes" value={fmt(stats?.quotes)} />
            <StatsCard icon={<FileText className="w-5 h-5" />} label="Applications" value={fmt(stats?.applications)} />
            <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Active Policies" value={fmt(stats?.active_policies)} />
            <StatsCard icon={<Calculator className="w-5 h-5" />} label="Monthly Premium" value={fmtCurrency(stats?.total_premium)} variant="savings" />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/calculator">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-shield-100 text-shield-600 flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              Get New Quote
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-slate-500">Compare rates from 50+ carriers instantly</p>
          </Card>
        </Link>
        <Link to="/portal/quotes">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-confidence-100 text-confidence-600 flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              View My Quotes
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-slate-500">Review and compare your saved quotes</p>
          </Card>
        </Link>
        <Link to="/marketplace">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-savings-100 text-savings-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              Find an Agent
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-slate-500">Connect with a licensed insurance expert</p>
          </Card>
        </Link>
      </div>

      {/* Recent activity */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {stats && (stats.quotes > 0 || stats.applications > 0 || stats.active_policies > 0) ? (
            <div className="space-y-3">
              {stats.active_policies > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-savings-50">
                  <ShieldCheck className="w-5 h-5 text-savings-600" />
                  <p className="text-sm text-slate-700">You have <strong>{stats.active_policies}</strong> active {stats.active_policies === 1 ? 'policy' : 'policies'}</p>
                </div>
              )}
              {stats.quotes > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-shield-50">
                  <ClipboardList className="w-5 h-5 text-shield-600" />
                  <p className="text-sm text-slate-700">You have <strong>{stats.quotes}</strong> saved {stats.quotes === 1 ? 'quote' : 'quotes'}</p>
                </div>
              )}
              {stats.applications > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-confidence-50">
                  <FileText className="w-5 h-5 text-confidence-600" />
                  <p className="text-sm text-slate-700">You have <strong>{stats.applications}</strong> pending {stats.applications === 1 ? 'application' : 'applications'}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Bell className="w-8 h-8" />}
              title="No recent activity"
              description="Get started by requesting a free insurance quote"
              actionLabel="Get a Quote"
              onAction={() => window.location.href = '/calculator'}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
