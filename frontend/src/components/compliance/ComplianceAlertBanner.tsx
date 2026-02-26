import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { complianceService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const DISMISS_KEY = 'compliance_alert_dismissed';

export function ComplianceAlertBanner() {
  const { user } = useAuth();
  const [overdueCount, setOverdueCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');

  const isAgentRole = user?.role === 'agent' || user?.role === 'agency_owner';

  useEffect(() => {
    if (!isAgentRole || dismissed) return;

    complianceService.getAlerts()
      .then(data => {
        setOverdueCount(data.overdue_count);
        setExpiringCount(data.expiring_count);
      })
      .catch(() => { /* silently fail — banner is non-critical */ });
  }, [isAgentRole, dismissed]);

  if (!isAgentRole || dismissed || (overdueCount === 0 && expiringCount === 0)) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-4 ${
      overdueCount > 0
        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'
        : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
    }`}>
      <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
        overdueCount > 0 ? 'text-red-500' : 'text-amber-500'
      }`} />
      <div className="flex-1 text-sm">
        {overdueCount > 0 && (
          <span className="font-medium text-red-700 dark:text-red-300">
            {overdueCount} overdue compliance item{overdueCount !== 1 ? 's' : ''}
          </span>
        )}
        {overdueCount > 0 && expiringCount > 0 && (
          <span className="text-slate-500 dark:text-slate-400"> and </span>
        )}
        {expiringCount > 0 && (
          <span className="font-medium text-amber-700 dark:text-amber-300">
            {expiringCount} expiring soon
          </span>
        )}
        <span className="text-slate-500 dark:text-slate-400"> — </span>
        <Link to="/compliance" className="font-semibold text-shield-600 dark:text-shield-400 hover:underline">
          View Compliance
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
