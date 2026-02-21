import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  Target, FileText, DollarSign, Star, Users, ArrowRight, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Phone,
} from 'lucide-react';

const recentLeads = [
  { id: '1', name: 'John Miller', type: 'Auto Insurance', status: 'new', date: '2 hours ago' },
  { id: '2', name: 'Emily Davis', type: 'Home Insurance', status: 'contacted', date: '5 hours ago' },
  { id: '3', name: 'Robert Wilson', type: 'Life Insurance', status: 'quoted', date: '1 day ago' },
  { id: '4', name: 'Sarah Brown', type: 'Auto + Home Bundle', status: 'new', date: '1 day ago' },
];

const statusColors: Record<string, string> = {
  new: 'bg-shield-100 text-shield-700',
  contacted: 'bg-amber-100 text-amber-700',
  quoted: 'bg-confidence-100 text-confidence-700',
  applied: 'bg-savings-100 text-savings-700',
};

export default function AgentDashboard() {
  const { user } = useAuth();

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
        <StatsCard icon={<Target className="w-5 h-5" />} label="New Leads" value="12" change="+3 today" />
        <StatsCard icon={<FileText className="w-5 h-5" />} label="Active Applications" value="8" />
        <StatsCard icon={<CheckCircle2 className="w-5 h-5" />} label="Policies Bound" value="24" change="+6 this month" />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="MTD Commissions" value="$4,250" variant="savings" />
        <StatsCard icon={<Star className="w-5 h-5" />} label="Rating" value="4.9" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent leads */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Recent Leads</h2>
                <Link to="/crm/leads" className="text-sm text-shield-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-sm font-bold">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{lead.name}</p>
                        <p className="text-sm text-slate-500">{lead.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                      <span className="text-xs text-slate-400">{lead.date}</span>
                      <Button variant="ghost" size="sm"><Phone className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
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
                  <p className="text-sm font-medium text-slate-900">4 leads need follow-up</p>
                  <p className="text-xs text-slate-500">Contacts over 24 hours old</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-shield-50">
                <Clock className="w-5 h-5 text-shield-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">2 applications pending</p>
                  <p className="text-xs text-slate-500">Awaiting client documents</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-savings-50">
                <TrendingUp className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">3 policies up for renewal</p>
                  <p className="text-xs text-slate-500">Within the next 30 days</p>
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
