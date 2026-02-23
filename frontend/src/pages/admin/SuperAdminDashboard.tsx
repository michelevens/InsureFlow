import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '@/components/ui';
import {
  Building2, Users, ShieldCheck, DollarSign, Settings,
  BarChart3, Activity, FileBarChart, Loader2, Monitor,
} from 'lucide-react';
import { api } from '@/services/api/client';

interface Agency {
  id: number;
  name: string;
  owner?: { name: string } | null;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
}

interface HealthCheck {
  status: string;
  checks: Record<string, { status: string; message: string }>;
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number | string>>({});
  const [totalAgencies, setTotalAgencies] = useState(0);
  const [recentAgencies, setRecentAgencies] = useState<Agency[]>([]);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        api.get('/admin/analytics'),
        api.get('/admin/agencies?per_page=5'),
        api.get('/admin/settings/system-health'),
      ]);

      if (results[0].status === 'fulfilled') {
        const r = results[0].value as Record<string, number | string>;
        setStats(r);
      }
      if (results[1].status === 'fulfilled') {
        const r = results[1].value as { data: Agency[]; total: number };
        setTotalAgencies(r.total ?? 0);
        setRecentAgencies(r.data ?? []);
      }
      if (results[2].status === 'fulfilled') {
        setHealth(results[2].value as HealthCheck);
      } else {
        setHealthError(true);
      }

      setLoading(false);
    })();
  }, []);

  const quickActions = [
    { label: 'Platform Settings', desc: 'Configure platform-wide settings', href: '/admin/platform-settings', icon: <Settings className="w-5 h-5" /> },
    { label: 'User Management', desc: 'Manage users and permissions', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Agency Directory', desc: 'Browse and manage agencies', href: '/admin/agencies', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Subscription Plans', desc: 'Manage pricing and plans', href: '/admin/plans', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Product Catalog', desc: 'Insurance products and lines', href: '/admin/products', icon: <ShieldCheck className="w-5 h-5" /> },
    { label: 'Analytics', desc: 'Platform-wide metrics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Audit Logs', desc: 'Track platform activity', href: '/admin/audit-log', icon: <Activity className="w-5 h-5" /> },
    { label: 'System Health', desc: 'Monitor services and uptime', href: '/admin/platform-settings', icon: <Monitor className="w-5 h-5" /> },
    { label: 'Reports', desc: 'Generate and export reports', href: '/reports', icon: <FileBarChart className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-slate-500 mt-1">SuperAdmin Dashboard</p>
        </div>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading platform data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">SuperAdmin Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Agencies', value: totalAgencies, icon: <Building2 className="w-6 h-6" /> },
          { label: 'Active Users', value: stats.active_users ?? stats.total_users ?? 0, icon: <Users className="w-6 h-6" /> },
          { label: 'Total Policies', value: stats.total_policies ?? 0, icon: <ShieldCheck className="w-6 h-6" /> },
          { label: 'Platform MRR', value: `$${Number(stats.platform_revenue ?? 0).toLocaleString()}`, icon: <DollarSign className="w-6 h-6" /> },
        ].map(s => (
          <Card key={s.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-shield-50 flex items-center justify-center text-shield-600">{s.icon}</div>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map(a => (
            <Link key={a.href + a.label} to={a.href} className="block">
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-shield-50 text-shield-600 flex items-center justify-center group-hover:bg-shield-100 transition-colors">{a.icon}</div>
                  <div>
                    <p className="font-medium text-slate-900">{a.label}</p>
                    <p className="text-xs text-slate-500">{a.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Agencies + System Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Agencies */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Agencies</h2>
              <Link to="/admin/agencies" className="text-sm text-shield-600 hover:text-shield-700 font-medium">View all</Link>
            </div>
            {recentAgencies.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No agencies yet</p>
            ) : (
              <div className="space-y-1">
                {recentAgencies.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.owner?.name ?? 'No owner'}</p>
                    </div>
                    <Badge variant={a.is_verified ? 'success' : 'warning'}>
                      {a.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* System Health */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">System Health</h2>
            {healthError || !health ? (
              <p className="text-sm text-slate-400 text-center py-8">System health check unavailable</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(health.checks).map(([name, check]) => (
                  <div key={name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${check.status === 'ok' ? 'bg-green-500' : check.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <p className="font-medium text-slate-900 capitalize">{name}</p>
                    </div>
                    <span className="text-xs text-slate-500">{check.message}</span>
                  </div>
                ))}
                <div className="pt-3">
                  <Badge variant={health.status === 'healthy' ? 'success' : 'warning'}>
                    {health.status === 'healthy' ? 'All Systems Healthy' : 'Degraded'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
