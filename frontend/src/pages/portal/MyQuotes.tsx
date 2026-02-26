import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ClipboardList, Clock, Calculator, Loader2, User, Building2, Eye } from 'lucide-react';
import { marketplaceService, type ConsumerScenario, type MarketplaceQuoteRequest } from '@/services/api';
import { toast } from 'sonner';

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const fmtCurrency = (val: string | null) => val ? `$${Number(val).toLocaleString()}` : '—';

const statusVariant: Record<string, 'shield' | 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  viewed: 'info',
  accepted: 'success',
  declined: 'danger',
};

export default function MyQuotes() {
  const [requests, setRequests] = useState<MarketplaceQuoteRequest[]>([]);
  const [scenarios, setScenarios] = useState<ConsumerScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceService.consumerDashboard()
      .then(data => {
        setRequests(data.quote_requests);
        setScenarios(data.scenarios_received);
      })
      .catch(() => { toast.error('Failed to load your quotes'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
      </div>
    );
  }

  if (requests.length === 0 && scenarios.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Quotes</h1>
        <Card>
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No quotes yet"
            description="Submit an insurance request and agents will send you personalized quotes to compare"
            actionLabel="Get Quotes"
            onAction={() => window.location.href = '/insurance/request'}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Quotes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {scenarios.length} quote{scenarios.length !== 1 ? 's' : ''} received from {new Set(scenarios.map(s => s.agent?.id)).size} agent{new Set(scenarios.map(s => s.agent?.id)).size !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/insurance/request">
          <Button variant="shield" size="sm" leftIcon={<Calculator className="w-4 h-4" />}>New Request</Button>
        </Link>
      </div>

      {/* Received Scenarios (Quotes) */}
      {scenarios.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Quotes Received</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {scenarios.map(scenario => (
              <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="info">{typeLabel(scenario.product_type)}</Badge>
                    <Badge variant={statusVariant[scenario.consumer_status] ?? 'default'} size="sm">
                      {scenario.consumer_status?.charAt(0).toUpperCase()}{scenario.consumer_status?.slice(1)}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{scenario.scenario_name}</h3>

                  {(scenario.best_quoted_premium || scenario.target_premium_monthly) && (
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold text-shield-600">
                        {fmtCurrency(scenario.best_quoted_premium || scenario.target_premium_monthly)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">/mo</span>
                    </div>
                  )}

                  <div className="space-y-1 mb-4">
                    {scenario.agent && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {scenario.agent.name}
                      </div>
                    )}
                    {scenario.lead?.agency && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {scenario.lead.agency.name}
                      </div>
                    )}
                    {scenario.sent_to_consumer_at && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        Received {new Date(scenario.sent_to_consumer_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {scenario.consumer_token && (
                    <div className="flex gap-2">
                      <Link to={`/scenarios/${scenario.consumer_token}/view`} className="flex-1">
                        <Button variant="shield" size="sm" className="w-full" rightIcon={<Eye className="w-4 h-4" />}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Requests */}
      {requests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Your Requests</h2>
          <div className="space-y-3">
            {requests.map(req => (
              <Card key={req.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant={req.status === 'pending' ? 'warning' : 'success'}>{req.status}</Badge>
                    <span className="font-medium text-slate-900 dark:text-white">{typeLabel(req.insurance_type)}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{req.state} — {req.zip_code}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
