import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { analyticsService } from '@/services/api/analytics';
import type { AgentPerformanceEntry } from '@/services/api/analytics';
import {
  Users, Target, DollarSign, FileText, ArrowRight,
  BarChart3, Award, Loader2, Building2, MapPin, ShieldCheck,
  Briefcase, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgencyInfo {
  name: string;
  state: string | null;
  city: string | null;
  npn: string | null;
  npn_verified: boolean;
  is_verified: boolean;
}

interface ProductInfo {
  id: number;
  name: string;
  slug: string;
  category: string;
  icon: string | null;
}

interface CarrierInfo {
  carrier_name: string;
  am_best_rating: string | null;
  product_count: number;
}

interface AgencyStats {
  team_members: number;
  total_leads: number;
  total_policies: number;
  total_revenue: number;
  total_applications: number;
  total_commissions: number;
  products: ProductInfo[];
  carriers: CarrierInfo[];
  license_states: string[];
  agency: AgencyInfo;
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
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {stats?.agency?.name ? `${stats.agency.name}` : "Overview of your agency's performance"}
            {stats?.agency?.city && stats?.agency?.state && (
              <span className="ml-1">— {stats.agency.city}, {stats.agency.state}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/agency/settings">
            <Button variant="outline" size="sm">Settings</Button>
          </Link>
          <Link to="/agency/settings">
            <Button variant="shield" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>Manage Team</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team performance table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Team Performance</h2>
                <Link to="/agency/settings" className="text-sm text-shield-600 dark:text-shield-400 hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-shield-400" />
                </div>
              ) : team.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No agent performance data yet. As your team writes business, their metrics will appear here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50">
                        <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Agent</th>
                        <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Leads</th>
                        <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Policies</th>
                        <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {team.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
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
                          <td className="py-3 text-right text-sm font-medium text-savings-600 dark:text-savings-400">
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

          {/* Products Offered */}
          {!loading && stats?.products && stats.products.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Services Offered</h2>
                  <Link to="/agency/settings" className="text-sm text-shield-600 dark:text-shield-400 hover:underline">Manage</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.products.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300">
                      <Briefcase className="w-3.5 h-3.5" />
                      {p.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{stats.products.length} active product{stats.products.length !== 1 ? 's' : ''}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">
          {/* Agency Snapshot */}
          {!loading && stats?.agency && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Agency Snapshot</h2>
                <div className="space-y-3">
                  {stats.agency.npn && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">NPN</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-900">{stats.agency.npn}</span>
                        {stats.agency.npn_verified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Applications</span>
                    <span className="text-sm font-medium text-slate-900">{fmt(stats.total_applications)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total Commissions</span>
                    <span className="text-sm font-medium text-savings-600 dark:text-savings-400">{fmtCurrency(stats.total_commissions)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Verification</span>
                    <Badge variant={stats.agency.is_verified ? 'success' : 'warning'} size="sm">
                      {stats.agency.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Carrier Appointments */}
          {!loading && stats?.carriers && stats.carriers.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Carrier Appointments</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{stats.carriers.length} carrier{stats.carriers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2.5">
                  {stats.carriers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-sm font-medium text-slate-900">{c.carrier_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.am_best_rating && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-confidence-50 dark:bg-confidence-900/30 text-confidence-700 dark:text-confidence-300 font-medium">{c.am_best_rating}</span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500">{c.product_count} product{c.product_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* License States */}
          {!loading && stats?.license_states && stats.license_states.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-shield-600 dark:text-shield-400" />
                  <h2 className="text-lg font-semibold text-slate-900">States of Operation</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stats.license_states.map(s => (
                    <span key={s} className="px-2.5 py-1 text-xs font-bold rounded-md bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300">{s}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Licensed across {stats.license_states.length} state{stats.license_states.length !== 1 ? 's' : ''}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link to="/crm/leads">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-shield-600 dark:text-shield-400" />
              <div>
                <h3 className="font-semibold text-slate-900">Lead Pipeline</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage all agency leads</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/commissions">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-confidence-600 dark:text-confidence-400" />
              <div>
                <h3 className="font-semibold text-slate-900">Commissions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Revenue by agent</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/compliance">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-savings-600 dark:text-savings-400" />
              <div>
                <h3 className="font-semibold text-slate-900">Compliance</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Licenses & CE credits</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/reviews">
          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="font-semibold text-slate-900">Reviews</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Client feedback</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
