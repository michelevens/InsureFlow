import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Calculator, FileText, ShieldCheck, ClipboardList, ArrowRight, Bell } from 'lucide-react';

export default function ConsumerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h1>
        <p className="text-slate-500 mt-1">Manage your insurance quotes, applications, and policies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<ClipboardList className="w-5 h-5" />} label="Saved Quotes" value="3" />
        <StatsCard icon={<FileText className="w-5 h-5" />} label="Applications" value="1" />
        <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Active Policies" value="2" />
        <StatsCard icon={<Calculator className="w-5 h-5" />} label="Est. Annual Savings" value="$840" variant="savings" />
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
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="No recent activity"
            description="Get started by requesting a free insurance quote"
            actionLabel="Get a Quote"
            onAction={() => window.location.href = '/calculator'}
          />
        </div>
      </Card>
    </div>
  );
}
