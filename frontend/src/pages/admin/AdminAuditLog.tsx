import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { auditService, type AuditLogEntry } from '@/services/api/audit';
import {
  Shield, Search, ChevronLeft, ChevronRight,
  User, FileText, ClipboardList, Activity, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const eventTypeColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
  login: 'default',
  login_failed: 'warning',
  logout: 'default',
  registered: 'success',
  status_changed: 'info',
  approved: 'success',
  rejected: 'danger',
  signed: 'success',
  submitted: 'info',
};

const entityIcons: Record<string, typeof User> = {
  User: User,
  Application: ClipboardList,
  Policy: Shield,
  Document: FileText,
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    auditService.getAuditLogs({
      event_type: eventTypeFilter || undefined,
      auditable_type: entityTypeFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      per_page: 30,
    })
      .then(res => {
        setLogs(res.data || []);
        setLastPage(res.last_page);
        setTotal(res.total);
      })
      .catch(() => { toast.error('Failed to load audit logs'); })
      .finally(() => setLoading(false));
  }, [page, eventTypeFilter, entityTypeFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="w-6 h-6 text-teal-600" />
          Audit Log
        </h1>
        <p className="text-slate-500 mt-1">Immutable record of all platform activity ({total} entries)</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <Select
              label="Event Type"
              value={eventTypeFilter}
              onChange={e => { setEventTypeFilter(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Events' },
                { value: 'created', label: 'Created' },
                { value: 'updated', label: 'Updated' },
                { value: 'deleted', label: 'Deleted' },
                { value: 'login', label: 'Login' },
                { value: 'login_failed', label: 'Login Failed' },
                { value: 'logout', label: 'Logout' },
                { value: 'registered', label: 'Registered' },
                { value: 'status_changed', label: 'Status Changed' },
                { value: 'approved', label: 'Approved' },
                { value: 'signed', label: 'Signed' },
                { value: 'submitted', label: 'Submitted' },
              ]}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select
              label="Entity Type"
              value={entityTypeFilter}
              onChange={e => { setEntityTypeFilter(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Entities' },
                { value: 'User', label: 'User' },
                { value: 'Application', label: 'Application' },
                { value: 'Policy', label: 'Policy' },
                { value: 'Document', label: 'Document' },
                { value: 'Signature', label: 'Signature' },
                { value: 'Commission', label: 'Commission' },
                { value: 'Lead', label: 'Lead' },
              ]}
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Input
              label="From"
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Input
              label="To"
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEventTypeFilter('');
              setEntityTypeFilter('');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
          >
            <Search className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </Card>

      {/* Audit Log Timeline */}
      <Card>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No audit events found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-0">
              {logs.map((log, i) => {
                const EntityIcon = entityIcons[log.auditable_type] || FileText;
                const badgeVariant = eventTypeColors[log.event_type] || 'default';
                const isExpanded = expandedId === log.id;
                const isLast = i === logs.length - 1;

                return (
                  <div key={log.id} className="flex items-start gap-3">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500">
                        <EntityIcon className="w-3.5 h-3.5" />
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 min-h-[24px] bg-slate-200" />}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={badgeVariant} size="sm">
                            {log.event_type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm font-medium text-slate-700">
                            {log.auditable_type}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            #{log.auditable_id}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {log.actor
                            ? `${log.actor.name} (${log.actor_role})`
                            : log.actor_role}
                          {log.ip_address && (
                            <span className="ml-2 text-slate-400">{log.ip_address}</span>
                          )}
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-2 bg-slate-50 rounded-lg p-3 text-xs space-y-2">
                          {log.old_values && Object.keys(log.old_values).length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-600">Old Values:</span>
                              <pre className="mt-1 bg-white rounded p-2 overflow-x-auto text-slate-700 border border-slate-200">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && Object.keys(log.new_values).length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-600">New Values:</span>
                              <pre className="mt-1 bg-white rounded p-2 overflow-x-auto text-slate-700 border border-slate-200">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-600">Metadata:</span>
                              <pre className="mt-1 bg-white rounded p-2 overflow-x-auto text-slate-700 border border-slate-200">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.user_agent && (
                            <p className="text-slate-400 truncate">
                              <span className="font-semibold text-slate-600">User Agent:</span> {log.user_agent}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Page {page} of {lastPage} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
