import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge, Button } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { analyticsService } from '@/services/api/analytics';
import { taskService } from '@/services/api/tasks';
import { crmService } from '@/services/api/crm';
import type { Task } from '@/services/api/tasks';
import type { Lead } from '@/types';
import {
  Target, FileText, DollarSign, Star, ArrowRight, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Loader2, ListChecks, Circle,
  Calendar, Phone, Mail, ChevronRight,
} from 'lucide-react';

interface AgentStats {
  total_leads: number;
  new_leads: number;
  applications: number;
  policies_bound: number;
  total_commission: number;
  avg_rating: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: 'New', variant: 'shield' },
  contacted: { label: 'Contacted', variant: 'info' },
  quoted: { label: 'Quoted', variant: 'warning' },
  applied: { label: 'Applied', variant: 'info' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'danger' },
};

function formatDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 10000);

    analyticsService.getDashboardStats()
      .then((data) => setStats(data as unknown as AgentStats))
      .catch(() => { /* fall back to zeros */ })
      .finally(() => { setLoading(false); clearTimeout(timeout); });

    // Load upcoming tasks (due today + overdue)
    taskService.list({ today: true })
      .then(res => setTasks(res.tasks.slice(0, 5)))
      .catch(() => {});

    // Load recent leads
    crmService.getLeads({ status: undefined, search: undefined })
      .then(res => setRecentLeads(res.items.slice(0, 5)))
      .catch(() => {});

    return () => clearTimeout(timeout);
  }, []);

  const fmt = (n: number | undefined) => n?.toLocaleString() ?? '0';
  const fmtCurrency = (n: number | undefined) =>
    `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
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
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
            </Card>
          ))
        ) : (
          <>
            <StatsCard icon={<Target className="w-5 h-5" />} label="New Leads" value={fmt(stats?.new_leads)} />
            <StatsCard icon={<FileText className="w-5 h-5" />} label="Active Applications" value={fmt(stats?.applications)} />
            <StatsCard icon={<CheckCircle2 className="w-5 h-5" />} label="Policies Bound" value={fmt(stats?.policies_bound)} />
            <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Total Commissions" value={fmtCurrency(stats?.total_commission)} variant="savings" />
            <StatsCard icon={<Star className="w-5 h-5" />} label="Rating" value={stats?.avg_rating?.toFixed(1) ?? '0'} />
          </>
        )}
      </div>

      {/* Row 2: Pipeline + Action items */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Pipeline Summary</h2>
                <Link to="/crm/leads" className="text-sm text-shield-600 hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-shield-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-shield-50 text-center">
                    <p className="text-2xl font-bold text-shield-700">{fmt(stats?.new_leads)}</p>
                    <p className="text-sm text-slate-500 mt-1">New</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 text-center">
                    <p className="text-2xl font-bold text-amber-700">{fmt(stats?.total_leads ? stats.total_leads - (stats?.new_leads ?? 0) - (stats?.policies_bound ?? 0) : 0)}</p>
                    <p className="text-sm text-slate-500 mt-1">In Progress</p>
                  </div>
                  <div className="p-4 rounded-xl bg-confidence-50 text-center">
                    <p className="text-2xl font-bold text-confidence-700">{fmt(stats?.applications)}</p>
                    <p className="text-sm text-slate-500 mt-1">Applications</p>
                  </div>
                  <div className="p-4 rounded-xl bg-savings-50 text-center">
                    <p className="text-2xl font-bold text-savings-700">{fmt(stats?.policies_bound)}</p>
                    <p className="text-sm text-slate-500 mt-1">Bound</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Action Items</h2>
            <div className="space-y-3">
              <Link to="/crm/leads" className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{stats?.new_leads ?? 0} leads need follow-up</p>
                  <p className="text-xs text-slate-500">New leads awaiting contact</p>
                </div>
              </Link>
              <Link to="/applications" className="flex items-start gap-3 p-3 rounded-xl bg-shield-50 hover:bg-shield-100 transition-colors">
                <Clock className="w-5 h-5 text-shield-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{stats?.applications ?? 0} applications pending</p>
                  <p className="text-xs text-slate-500">In review or awaiting documents</p>
                </div>
              </Link>
              <Link to="/policies" className="flex items-start gap-3 p-3 rounded-xl bg-savings-50 hover:bg-savings-100 transition-colors">
                <TrendingUp className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{stats?.policies_bound ?? 0} policies bound</p>
                  <p className="text-xs text-slate-500">Lifetime production</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Tasks + Recent Leads */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-shield-600" /> Tasks Due Today
              </h2>
              <Link to="/tasks" className="text-sm text-shield-600 hover:underline">View all</Link>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All caught up! No tasks due today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const done = !!task.completed_at;
                  const overdue = !done && new Date(task.date) < new Date(new Date().toDateString());
                  return (
                    <Link key={task.id} to="/tasks" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${done ? 'opacity-50' : ''}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 text-savings-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${done ? 'line-through text-slate-400' : 'text-slate-900'} truncate`}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(task.date)}</span>
                          {overdue && <Badge variant="danger" className="text-[10px]">Overdue</Badge>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Leads */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-shield-600" /> Recent Leads
              </h2>
              <Link to="/crm/leads" className="text-sm text-shield-600 hover:underline">View all</Link>
            </div>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No leads yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentLeads.map(lead => {
                  const config = statusConfig[lead.status] || statusConfig.new;
                  return (
                    <Link key={lead.id} to="/crm/leads" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-slate-400 capitalize truncate">{lead.insurance_type?.replace(/_/g, ' ')} · {formatDate(lead.created_at)}</p>
                      </div>
                      <Badge variant={config.variant} className="text-[10px] flex-shrink-0">{config.label}</Badge>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {lead.phone && (
                          <button onClick={e => { e.preventDefault(); window.location.href = `tel:${lead.phone}`; }} className="p-1 text-slate-400 hover:text-shield-600">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={e => { e.preventDefault(); window.location.href = `mailto:${lead.email}`; }} className="p-1 text-slate-400 hover:text-shield-600">
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Links row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/commissions" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-shield-300 hover:shadow-sm transition-all">
          <DollarSign className="w-5 h-5 text-savings-600" />
          <span className="text-sm font-medium text-slate-700">Commissions</span>
        </Link>
        <Link to="/reviews" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-shield-300 hover:shadow-sm transition-all">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium text-slate-700">Reviews</span>
        </Link>
        <Link to="/calendar" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-shield-300 hover:shadow-sm transition-all">
          <Calendar className="w-5 h-5 text-shield-600" />
          <span className="text-sm font-medium text-slate-700">Calendar</span>
        </Link>
        <Link to="/tasks" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-shield-300 hover:shadow-sm transition-all">
          <ListChecks className="w-5 h-5 text-teal-600" />
          <span className="text-sm font-medium text-slate-700">All Tasks</span>
        </Link>
      </div>
    </div>
  );
}
