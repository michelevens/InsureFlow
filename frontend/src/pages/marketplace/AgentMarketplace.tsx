import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { marketplaceService, type MarketplaceQuoteRequest } from '@/services/api';
import {
  ShieldCheck, MapPin, Clock, FileText, Loader2, Inbox,
  RefreshCw, Unlock,
} from 'lucide-react';
import { toast } from 'sonner';

const typeLabels: Record<string, string> = {
  auto: 'Auto', homeowners: 'Homeowners', renters: 'Renters',
  life_term: 'Term Life', life_whole: 'Whole Life', life_universal: 'Universal Life',
  health_individual: 'Individual Health', medicare_supplement: 'Medicare Supplement',
  disability_long_term: 'Long-Term Disability', long_term_care: 'Long-Term Care',
  commercial_gl: 'Commercial GL', bop: 'BOP', workers_comp: 'Workers Comp',
  umbrella_personal: 'Personal Umbrella', condo: 'Condo', flood: 'Flood',
};

export default function AgentMarketplace() {
  const [requests, setRequests] = useState<MarketplaceQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceService.listOpenRequests();
      setRequests(res.data);
    } catch {
      toast.error('Failed to load marketplace requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleClaim = async (id: number) => {
    setClaiming(id);
    try {
      const res = await marketplaceService.unlockRequest(id);
      toast.success('Request claimed! Lead created.');
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== id));
      // Navigate to lead
      window.location.href = `/crm/leads?highlight=${res.lead_id}`;
    } catch {
      toast.error('Failed to claim request');
    } finally {
      setClaiming(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insurance Marketplace</h1>
          <p className="text-slate-500 mt-1">Consumers looking for insurance in your area</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRequests} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* Requests */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Open Requests</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            There are no marketplace requests matching your licensed states right now. Check back later or refresh.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {requests.map(req => (
            <Card key={req.id} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge variant="info" size="sm">
                    {typeLabels[req.insurance_type] || req.insurance_type}
                  </Badge>
                  <h3 className="font-semibold text-slate-900 mt-2">
                    {req.first_name} {req.last_name?.charAt(0)}.
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(req.created_at)}
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {req.state} — {req.zip_code}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  {req.coverage_level?.charAt(0).toUpperCase()}{req.coverage_level?.slice(1)} coverage
                </div>
                {req.description && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="line-clamp-2">{req.description}</span>
                  </div>
                )}
              </div>

              <Button
                variant="shield"
                size="sm"
                className="w-full"
                onClick={() => handleClaim(req.id)}
                disabled={claiming === req.id}
                leftIcon={claiming === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              >
                {claiming === req.id ? 'Claiming...' : 'Claim & Create Lead'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
