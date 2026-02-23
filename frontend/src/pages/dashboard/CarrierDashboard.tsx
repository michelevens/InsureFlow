import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { analyticsService } from '@/services/api/analytics';
import {
  Briefcase, BarChart3, FileText, DollarSign, Users,
  ArrowRight, ShieldCheck, Package, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CarrierStats {
  active_products: number;
  total_applications: number;
  total_policies: number;
  premium_volume: number;
}

export default function CarrierDashboard() {
  const [stats, setStats] = useState<CarrierStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats()
      .then((data) => setStats(data as unknown as CarrierStats))
      .catch(() => { toast.error('Failed to load dashboard stats'); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? '0';
  const fmtCurrency = (n: number | undefined) => {
    const val = n ?? 0;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor product performance and production metrics</p>
        </div>
        <Link to="/carrier/products">
          <Button variant="shield" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>Manage Products</Button>
        </Link>
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
            <StatsCard icon={<Briefcase className="w-5 h-5" />} label="Active Products" value={fmt(stats?.active_products)} />
            <StatsCard icon={<FileText className="w-5 h-5" />} label="Applications" value={fmt(stats?.total_applications)} />
            <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Policies Bound" value={fmt(stats?.total_policies)} />
            <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Premium Volume" value={fmtCurrency(stats?.premium_volume)} variant="savings" />
          </>
        )}
      </div>

      {/* Platform overview */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Platform Overview</h2>
            <Link to="/carrier/production" className="text-sm text-shield-600 hover:underline">View details</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-shield-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-shield-50 text-center">
                <p className="text-2xl font-bold text-shield-700">{fmt(stats?.active_products)}</p>
                <p className="text-sm text-slate-500 mt-1">Products</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 text-center">
                <p className="text-2xl font-bold text-amber-700">{fmt(stats?.total_applications)}</p>
                <p className="text-sm text-slate-500 mt-1">Applications</p>
              </div>
              <div className="p-4 rounded-xl bg-savings-50 text-center">
                <p className="text-2xl font-bold text-savings-700">{fmt(stats?.total_policies)}</p>
                <p className="text-sm text-slate-500 mt-1">Policies</p>
              </div>
              <div className="p-4 rounded-xl bg-confidence-50 text-center">
                <p className="text-2xl font-bold text-confidence-700">
                  {stats?.total_applications && stats?.total_policies
                    ? `${Math.round((stats.total_policies / stats.total_applications) * 100)}%`
                    : '0%'}
                </p>
                <p className="text-sm text-slate-500 mt-1">Bind Rate</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/carrier/products">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-shield-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Products</h3>
                <p className="text-sm text-slate-500">Manage insurance products</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/carrier/production">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-confidence-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Production Report</h3>
                <p className="text-sm text-slate-500">Detailed analytics</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/applications">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-savings-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Agent Network</h3>
                <p className="text-sm text-slate-500">View appointed agents</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
