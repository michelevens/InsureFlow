import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FileText, Eye, Clock, CheckCircle2, AlertCircle, Loader2, PenTool } from 'lucide-react';
import { marketplaceService } from '@/services/api';
import { toast } from 'sonner';

interface ConsumerApplication {
  id: number;
  reference: string;
  insurance_type: string;
  carrier_name: string;
  monthly_premium: string;
  status: string;
  signing_token: string | null;
  signed_at: string | null;
  created_at: string;
  agent: { id: number; name: string } | null;
}

const statusConfig: Record<string, { label: string; variant: 'shield' | 'warning' | 'success' | 'danger' | 'info'; icon: React.ReactNode }> = {
  draft: { label: 'Pending Signature', variant: 'warning', icon: <PenTool className="w-4 h-4" /> },
  submitted: { label: 'Submitted', variant: 'shield', icon: <Clock className="w-4 h-4" /> },
  under_review: { label: 'Under Review', variant: 'info', icon: <AlertCircle className="w-4 h-4" /> },
  approved: { label: 'Approved', variant: 'success', icon: <CheckCircle2 className="w-4 h-4" /> },
  declined: { label: 'Declined', variant: 'danger', icon: <AlertCircle className="w-4 h-4" /> },
  bound: { label: 'Policy Bound', variant: 'success', icon: <CheckCircle2 className="w-4 h-4" /> },
};

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function MyApplications() {
  const [applications, setApplications] = useState<ConsumerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceService.consumerDashboard()
      .then(data => {
        setApplications(data.applications as ConsumerApplication[]);
      })
      .catch(() => { toast.error('Failed to load applications'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Applications</h1>
        <Card>
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No applications yet"
            description="Once you accept a quote and sign an application, you can track its progress here"
            actionLabel="View My Quotes"
            onAction={() => window.location.href = '/portal/quotes'}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Applications</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track the status of your insurance applications</p>
      </div>

      <div className="space-y-4">
        {applications.map(app => {
          const config = statusConfig[app.status] || statusConfig.submitted;
          const needsSignature = app.status === 'draft' && app.signing_token && !app.signed_at;

          return (
            <Card key={app.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-shield-600">{app.reference}</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  {needsSignature ? (
                    <Link to={`/applications/${app.signing_token}/sign`}>
                      <Button variant="shield" size="sm" leftIcon={<PenTool className="w-4 h-4" />}>Sign Now</Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>View</Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Type</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{typeLabel(app.insurance_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Carrier</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{app.carrier_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Premium</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {Number(app.monthly_premium) > 0 ? `$${Number(app.monthly_premium).toLocaleString()}/mo` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Agent</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{app.agent?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Progress tracker */}
                <div className="mt-6 flex items-center gap-2">
                  {['Signed', 'Submitted', 'Under Review', 'Decision'].map((step, i) => {
                    const statusOrder = ['draft', 'submitted', 'under_review', 'approved'];
                    const stepIndex = statusOrder.indexOf(app.status);
                    const adjusted = app.status === 'draft' && app.signed_at ? 1 : stepIndex;
                    const isCompleted = i <= adjusted;
                    const isCurrent = i === adjusted;
                    return (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                          isCompleted ? 'gradient-shield text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${isCurrent ? 'font-medium text-shield-700' : 'text-slate-500 dark:text-slate-400'}`}>{step}</span>
                        {i < 3 && <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-shield-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
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
