import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  Users, Target, DollarSign, FileText, ArrowRight,
  BarChart3, Award,
} from 'lucide-react';

const teamMembers = [
  { name: 'Sarah Johnson', role: 'Senior Agent', leads: 12, policies: 24, commission: '$4,250', status: 'active' },
  { name: 'Michael Chen', role: 'Agent', leads: 8, policies: 15, commission: '$2,800', status: 'active' },
  { name: 'Amanda Rodriguez', role: 'Agent', leads: 10, policies: 18, commission: '$3,100', status: 'active' },
  { name: 'David Williams', role: 'Junior Agent', leads: 5, policies: 8, commission: '$1,400', status: 'active' },
];

export default function AgencyDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agency Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your agency's performance</p>
        </div>
        <Link to="/agency/team">
          <Button variant="shield" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>Manage Team</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Users className="w-5 h-5" />} label="Team Members" value="4" />
        <StatsCard icon={<Target className="w-5 h-5" />} label="Total Leads" value="35" change="+8 this week" />
        <StatsCard icon={<FileText className="w-5 h-5" />} label="Policies Bound" value="65" change="+12 this month" />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Agency Revenue" value="$11,550" variant="savings" change="+18%" />
      </div>

      {/* Team performance table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Team Performance</h2>
            <Link to="/agency/team" className="text-sm text-shield-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Agent</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Role</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Leads</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Policies</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamMembers.map((member, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-shield flex items-center justify-center text-white text-xs font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-500">{member.role}</td>
                    <td className="py-3 text-right text-sm font-medium text-slate-900">{member.leads}</td>
                    <td className="py-3 text-right text-sm font-medium text-slate-900">{member.policies}</td>
                    <td className="py-3 text-right text-sm font-medium text-savings-600">{member.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/crm/leads">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-shield-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Lead Pipeline</h3>
                <p className="text-sm text-slate-500">Manage all agency leads</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/commissions">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-confidence-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Commission Report</h3>
                <p className="text-sm text-slate-500">Revenue breakdown by agent</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/reviews">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-savings-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Agency Reviews</h3>
                <p className="text-sm text-slate-500">Client feedback & ratings</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
