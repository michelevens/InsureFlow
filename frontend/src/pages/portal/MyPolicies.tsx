import { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ShieldCheck, Download, Phone, Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';
import { policyService } from '@/services/api/policies';
import type { Policy } from '@/types';

export default function MyPolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await policyService.list();
      setPolicies(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Policies</h1>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading your policies...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Policies</h1>
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadPolicies}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Policies</h1>
        <Card>
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8" />}
            title="No active policies"
            description="Once your application is approved, your active policies will appear here"
            actionLabel="Get a Quote"
            onAction={() => window.location.href = '/calculator'}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Policies</h1>
        <p className="text-slate-500 mt-1">View and manage your active insurance policies</p>
      </div>

      <div className="space-y-4">
        {policies.map(policy => (
          <Card key={policy.id}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-savings-100 text-savings-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 capitalize">{(policy.type || '').replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-slate-500">{policy.carrier_name} · {policy.policy_number}</p>
                  </div>
                </div>
                <Badge variant={policy.status === 'active' ? 'success' : policy.status === 'expiring_soon' ? 'warning' : 'danger'}>
                  {policy.status === 'active' ? 'Active' : policy.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <DollarSign className="w-3.5 h-3.5" /> Premium
                  </div>
                  <p className="text-sm font-medium text-slate-900">${policy.monthly_premium}/mo</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Coverage
                  </div>
                  <p className="text-sm font-medium text-slate-900">{policy.coverage_limit || '-'}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Effective
                  </div>
                  <p className="text-sm font-medium text-slate-900">{policy.effective_date}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Expires
                  </div>
                  <p className="text-sm font-medium text-slate-900">{policy.expiration_date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {policy.agent && <span>Agent: <span className="font-medium text-slate-900">{policy.agent.first_name} {policy.agent.last_name}</span></span>}
                </div>
                <div className="flex gap-2">
                  {policy.agent?.phone ? (
                    <a href={`tel:${policy.agent.phone}`}>
                      <Button variant="outline" size="sm" leftIcon={<Phone className="w-4 h-4" />}>Call Agent</Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" leftIcon={<Phone className="w-4 h-4" />} onClick={() => window.location.href = '/messages'}>
                      Message Agent
                    </Button>
                  )}
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`
                        <html><head><title>Policy ${policy.policy_number}</title>
                        <style>body{font-family:sans-serif;max-width:700px;margin:40px auto;padding:20px}
                        h1{color:#102a43}table{width:100%;border-collapse:collapse;margin-top:20px}
                        td,th{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}
                        th{background:#f8fafc;font-weight:600}</style></head><body>
                        <h1>Insurance Policy Summary</h1>
                        <table><tr><th>Policy Number</th><td>${policy.policy_number}</td></tr>
                        <tr><th>Type</th><td>${(policy.type || '').replace(/_/g, ' ')}</td></tr>
                        <tr><th>Carrier</th><td>${policy.carrier_name}</td></tr>
                        <tr><th>Monthly Premium</th><td>$${policy.monthly_premium}</td></tr>
                        <tr><th>Coverage Limit</th><td>${policy.coverage_limit || 'N/A'}</td></tr>
                        <tr><th>Effective Date</th><td>${policy.effective_date}</td></tr>
                        <tr><th>Expiration Date</th><td>${policy.expiration_date}</td></tr>
                        <tr><th>Status</th><td>${policy.status}</td></tr></table>
                        <p style="margin-top:30px;color:#64748b;font-size:12px">Generated from Insurons &middot; insurons.com</p>
                        </body></html>`);
                      win.document.close();
                      win.print();
                    }
                  }}>Download</Button>
                  <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}
                    onClick={() => window.location.href = `/claims?policy_id=${policy.id}`}>
                    File Claim
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
