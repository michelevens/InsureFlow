import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Badge } from '@/components/ui';
import { marketplaceService, type PublicScenarioView as ScenarioData } from '@/services/api';
import {
  ShieldCheck, CheckCircle2, XCircle, Loader2, AlertCircle,
  Shield, User, Building2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const coverageLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const formatCurrency = (val: string | null) => val ? `$${Number(val).toLocaleString()}` : '—';

export default function ScenarioPublicView() {
  const { token } = useParams<{ token: string }>();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    if (!token) return;
    marketplaceService.viewScenario(token)
      .then(data => {
        setScenario(data);
        if (data.consumer_status === 'accepted' || data.consumer_status === 'declined') {
          setResponded(data.consumer_status as 'accepted' | 'declined');
        }
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!token) return;
    setResponding(true);
    try {
      await marketplaceService.respondToScenario(token, action);
      setResponded(action === 'accept' ? 'accepted' : 'declined');
      toast.success(action === 'accept' ? 'Quote accepted! Your agent will prepare the application.' : 'Quote declined.');
    } catch {
      toast.error('Failed to respond. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Quote Not Found</h1>
          <p className="text-slate-500">This quote link may have expired or is invalid.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-shield-600" />
            <span className="text-xl font-bold text-slate-900">Insurons</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Responded banner */}
        {responded && (
          <Card className={`p-4 ${responded === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              {responded === 'accepted' ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-slate-500" />
              )}
              <div>
                <p className="font-semibold text-slate-900">
                  {responded === 'accepted' ? 'You accepted this quote' : 'You declined this quote'}
                </p>
                <p className="text-sm text-slate-500">
                  {responded === 'accepted'
                    ? 'Your agent will prepare the application for signing. Check your email.'
                    : 'This quote has been declined. You can continue reviewing other options.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quote Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{scenario.scenario_name}</h1>
              <p className="text-slate-500 mt-1">
                {scenario.product_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Quote
              </p>
            </div>
            <Badge variant={scenario.consumer_status === 'accepted' ? 'success' : scenario.consumer_status === 'declined' ? 'default' : 'info'}>
              {scenario.consumer_status.charAt(0).toUpperCase() + scenario.consumer_status.slice(1)}
            </Badge>
          </div>

          {/* Agent/Agency info */}
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg">
            {scenario.agent && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{scenario.agent.name}</span>
              </div>
            )}
            {scenario.lead?.agency && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{scenario.lead.agency.name}</span>
                {scenario.lead.agency.city && scenario.lead.agency.state && (
                  <span className="text-xs text-slate-400">({scenario.lead.agency.city}, {scenario.lead.agency.state})</span>
                )}
              </div>
            )}
          </div>

          {/* Premium */}
          {(scenario.best_quoted_premium || scenario.target_premium_monthly) && (
            <div className="mt-4 p-4 bg-savings-50 rounded-lg text-center">
              <p className="text-sm text-savings-600 font-medium">Estimated Monthly Premium</p>
              <p className="text-3xl font-bold text-savings-700 mt-1">
                {formatCurrency(scenario.best_quoted_premium || scenario.target_premium_monthly)}<span className="text-lg font-normal">/mo</span>
              </p>
            </div>
          )}
        </Card>

        {/* Coverages */}
        {scenario.coverages.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-shield-600" />
              <h2 className="text-lg font-semibold text-slate-900">Coverage Details</h2>
            </div>
            <div className="space-y-2">
              {scenario.coverages.filter(c => c.is_included).map(cov => (
                <div key={cov.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{coverageLabel(cov.coverage_type)}</p>
                    <p className="text-xs text-slate-400">{cov.coverage_category}</p>
                  </div>
                  <div className="text-right">
                    {cov.limit_amount && <p className="text-sm font-medium text-slate-900">{formatCurrency(cov.limit_amount)} limit</p>}
                    {cov.deductible_amount && <p className="text-xs text-slate-500">{formatCurrency(cov.deductible_amount)} deductible</p>}
                    {cov.benefit_amount && <p className="text-sm font-medium text-slate-900">{formatCurrency(cov.benefit_amount)} benefit</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Insured Objects */}
        {scenario.insured_objects && scenario.insured_objects.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-shield-600" />
              <h2 className="text-lg font-semibold text-slate-900">Insured Items</h2>
            </div>
            <div className="space-y-2">
              {scenario.insured_objects.map(obj => (
                <div key={obj.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-900">{obj.name}</span>
                  <span className="text-xs text-slate-500">{obj.object_type} {obj.relationship ? `(${obj.relationship})` : ''}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        {scenario.notes && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Agent Notes</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{scenario.notes}</p>
          </Card>
        )}

        {/* Action Buttons */}
        {!responded && (
          <div className="flex gap-3">
            <Button
              variant="shield"
              className="flex-1"
              onClick={() => handleRespond('accept')}
              disabled={responding}
              leftIcon={responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              Accept This Quote
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleRespond('decline')}
              disabled={responding}
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
