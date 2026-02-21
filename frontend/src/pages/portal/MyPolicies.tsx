import { Card, Badge, Button } from '@/components/ui';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ShieldCheck, Download, Phone, Calendar, DollarSign, FileText } from 'lucide-react';

interface MyPolicy {
  id: string;
  policy_number: string;
  type: string;
  carrier: string;
  premium: string;
  coverage: string;
  effective_date: string;
  expiration_date: string;
  agent: string;
  agent_phone: string;
  status: 'active' | 'expiring_soon';
}

const mockPolicies: MyPolicy[] = [
  { id: '1', policy_number: 'POL-2026-0412', type: 'Auto Insurance', carrier: 'StateFarm', premium: '$127/mo', coverage: '$300,000', effective_date: '2026-01-15', expiration_date: '2027-01-15', agent: 'Sarah Johnson', agent_phone: '(214) 555-0123', status: 'active' },
  { id: '2', policy_number: 'POL-2025-0287', type: 'Home Insurance', carrier: 'Allstate', premium: '$195/mo', coverage: '$500,000', effective_date: '2025-06-01', expiration_date: '2026-06-01', agent: 'Sarah Johnson', agent_phone: '(214) 555-0123', status: 'active' },
];

export default function MyPolicies() {
  if (mockPolicies.length === 0) {
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
        {mockPolicies.map(policy => (
          <Card key={policy.id}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-savings-100 text-savings-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{policy.type}</h3>
                    <p className="text-sm text-slate-500">{policy.carrier} · {policy.policy_number}</p>
                  </div>
                </div>
                <Badge variant={policy.status === 'active' ? 'success' : 'warning'}>
                  {policy.status === 'active' ? 'Active' : 'Expiring Soon'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <DollarSign className="w-3.5 h-3.5" /> Premium
                  </div>
                  <p className="text-sm font-medium text-slate-900">{policy.premium}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Coverage
                  </div>
                  <p className="text-sm font-medium text-slate-900">{policy.coverage}</p>
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
                  <span>Agent: <span className="font-medium text-slate-900">{policy.agent}</span></span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" leftIcon={<Phone className="w-4 h-4" />}>Call Agent</Button>
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Download</Button>
                  <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>File Claim</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
