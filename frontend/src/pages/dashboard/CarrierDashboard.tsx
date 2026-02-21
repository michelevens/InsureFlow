import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  Briefcase, BarChart3, FileText, DollarSign, Users,
  ArrowRight, ShieldCheck, Package,
} from 'lucide-react';

const products = [
  { name: 'Auto Standard', type: 'Auto', applications: 45, bound: 32, premium_volume: '$128,000', status: 'active' },
  { name: 'Home Premium', type: 'Home', applications: 28, bound: 20, premium_volume: '$96,000', status: 'active' },
  { name: 'Life Term 20', type: 'Life', applications: 15, bound: 10, premium_volume: '$45,000', status: 'active' },
  { name: 'Business General', type: 'Business', applications: 12, bound: 8, premium_volume: '$72,000', status: 'active' },
];

export default function CarrierDashboard() {
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
        <StatsCard icon={<Briefcase className="w-5 h-5" />} label="Active Products" value="4" />
        <StatsCard icon={<FileText className="w-5 h-5" />} label="Applications" value="100" change="+22 this month" />
        <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Policies Bound" value="70" change="+15 this month" />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Premium Volume" value="$341K" variant="savings" change="+12%" />
      </div>

      {/* Product performance */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Product Performance</h2>
            <Link to="/carrier/production" className="text-sm text-shield-600 hover:underline">View details</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Product</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Type</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Applications</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Bound</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Premium Volume</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Bind Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="py-3"><Badge variant="outline">{p.type}</Badge></td>
                    <td className="py-3 text-right text-sm text-slate-700">{p.applications}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{p.bound}</td>
                    <td className="py-3 text-right text-sm font-medium text-savings-600">{p.premium_volume}</td>
                    <td className="py-3 text-right text-sm font-medium text-slate-900">
                      {Math.round((p.bound / p.applications) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
