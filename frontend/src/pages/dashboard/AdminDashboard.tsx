import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  Users, Building2, BarChart3, DollarSign,
  ShieldCheck, Target,
} from 'lucide-react';

const recentActivity = [
  { type: 'user', text: 'New agent registered: Michael Chen', time: '2 hours ago' },
  { type: 'policy', text: 'Policy #INS-4521 bound via Sarah Johnson', time: '3 hours ago' },
  { type: 'lead', text: '15 new consumer leads generated', time: '5 hours ago' },
  { type: 'payment', text: 'Commission payout processed: $12,400', time: '1 day ago' },
  { type: 'user', text: 'New agency onboarded: Pacific Shield Insurance', time: '1 day ago' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">InsureFlow administration dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard icon={<Users className="w-5 h-5" />} label="Total Users" value="2,847" change="+124 this month" />
        <StatsCard icon={<Building2 className="w-5 h-5" />} label="Agencies" value="156" change="+8" />
        <StatsCard icon={<Target className="w-5 h-5" />} label="Leads Generated" value="4,521" change="+892 this month" />
        <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Policies Bound" value="1,235" change="+187" />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Platform Revenue" value="$84.5K" variant="savings" change="+22%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-shield-100 text-shield-600 flex items-center justify-center flex-shrink-0">
                      {item.type === 'user' && <Users className="w-4 h-4" />}
                      {item.type === 'policy' && <ShieldCheck className="w-4 h-4" />}
                      {item.type === 'lead' && <Target className="w-4 h-4" />}
                      {item.type === 'payment' && <DollarSign className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
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
