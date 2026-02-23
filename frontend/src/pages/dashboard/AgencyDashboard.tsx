import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { analyticsService } from '@/services/api/analytics';
import type { AgentPerformanceEntry } from '@/services/api/analytics';
import {
  Users, Target, DollarSign, FileText, ArrowRight,
  BarChart3, Award, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgencyStats {
  team_members: number;
  total_leads: number;
  total_policies: number;
  total_revenue: number;
}

export default function AgencyDashboard() {
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [team, setTeam] = useState<AgentPerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboardStats(),
      analyticsService.getAgentPerformance(3, 10).catch(() => ({ agents: [] })),
    ])
      .then(([s, t]) => {
        setStats(s as unknown as AgencyStats);
        setTeam(t.agents);
      })
      .catch(() => { toast.error('Failed to load agency dashboard'); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? '0';
  const fmtCurrency = (n: number | undefined) =>
    `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
            </Card>
          ))
        ) : (
          <>
            <StatsCard icon={<Users className="w-5 h-5" />} label="Team Members" value={fmt(stats?.team_members)} />
            <StatsCard icon={<Target className="w-5 h-5" />} label="Total Leads" value={fmt(stats?.total_leads)} />
            <StatsCard icon={<FileText className="w-5 h-5" />} label="Policies Bound" value={fmt(stats?.total_policies)} />
            <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Agency Revenue" value={fmtCurrency(stats?.total_revenue)} variant="savings" />
          </>
        )}
      </div>

      {/* Team performance table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Team Performance</h2>
            <Link to="/agency/team" className="text-sm text-shield-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-shield-400" />
            </div>
          ) : team.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No agent performance data yet. As your team writes business, their metrics will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Agent</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Leads</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Policies</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-shield flex items-center justify-center text-white text-xs font-bold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900">{member.lead_count}</td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900">{member.policy_count}</td>
                      <td className="py-3 text-right text-sm font-medium text-savings-600">
                        {member.total_commission ? `$${Number(member.total_commission).toLocaleString()}` : '$0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
