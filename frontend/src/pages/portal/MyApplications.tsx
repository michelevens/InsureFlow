import { Card, Badge, Button } from '@/components/ui';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FileText, Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface MyApplication {
  id: string;
  reference: string;
  insurance_type: string;
  carrier: string;
  premium: string;
  status: 'submitted' | 'under_review' | 'approved' | 'declined';
  submitted_at: string;
  agent: string;
}

const mockApplications: MyApplication[] = [
  { id: '1', reference: 'APP-2026-001', insurance_type: 'Auto', carrier: 'StateFarm', premium: '$127/mo', status: 'under_review', submitted_at: '2026-02-18', agent: 'Sarah Johnson' },
];

const statusConfig: Record<string, { label: string; variant: 'shield' | 'warning' | 'success' | 'danger'; icon: React.ReactNode }> = {
  submitted: { label: 'Submitted', variant: 'shield', icon: <Clock className="w-4 h-4" /> },
  under_review: { label: 'Under Review', variant: 'warning', icon: <AlertCircle className="w-4 h-4" /> },
  approved: { label: 'Approved', variant: 'success', icon: <CheckCircle2 className="w-4 h-4" /> },
  declined: { label: 'Declined', variant: 'danger', icon: <AlertCircle className="w-4 h-4" /> },
};

export default function MyApplications() {
  if (mockApplications.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Applications</h1>
        <Card>
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No applications yet"
            description="Once you apply for a policy, you can track its progress here"
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
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500 mt-1">Track the status of your insurance applications</p>
      </div>

      <div className="space-y-4">
        {mockApplications.map(app => {
          const config = statusConfig[app.status];
          return (
            <Card key={app.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-shield-600">{app.reference}</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>View Details</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="text-sm font-medium text-slate-900">{app.insurance_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Carrier</p>
                    <p className="text-sm font-medium text-slate-900">{app.carrier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Premium</p>
                    <p className="text-sm font-medium text-slate-900">{app.premium}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Agent</p>
                    <p className="text-sm font-medium text-slate-900">{app.agent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="text-sm font-medium text-slate-900">{app.submitted_at}</p>
                  </div>
                </div>

                {/* Progress tracker */}
                <div className="mt-6 flex items-center gap-2">
                  {['Submitted', 'Under Review', 'Decision', 'Policy Bound'].map((step, i) => {
                    const stepIndex = ['submitted', 'under_review', 'approved', 'bound'].indexOf(app.status);
                    const isCompleted = i <= stepIndex;
                    const isCurrent = i === stepIndex;
                    return (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isCompleted ? 'gradient-shield text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-xs ${isCurrent ? 'font-medium text-shield-700' : 'text-slate-500'}`}>{step}</span>
                        {i < 3 && <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-shield-500' : 'bg-slate-200'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
