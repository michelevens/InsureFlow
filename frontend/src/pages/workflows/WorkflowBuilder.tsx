import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Input, Modal, Select, useConfirm } from '@/components/ui';
import {
  Zap, Plus, ToggleLeft, ToggleRight, Trash2, Play, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
  Activity, Settings2, Loader2,
} from 'lucide-react';
import { workflowService, type WorkflowRule, type WorkflowExecution, type WorkflowOptions } from '@/services/api/workflows';
import { toast } from 'sonner';

type Tab = 'rules' | 'executions';

const STATUS_BADGE: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  completed: 'success',
  failed: 'danger',
  running: 'warning',
  pending: 'info',
  skipped: 'info',
};

export default function WorkflowBuilder() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('rules');
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [options, setOptions] = useState<WorkflowOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [ruleExecs, setRuleExecs] = useState<WorkflowExecution[]>([]);
  const [testing, setTesting] = useState<number | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const [rulesRes, optsRes] = await Promise.all([
        workflowService.list(),
        workflowService.options(),
      ]);
      setRules(rulesRes.rules);
      setOptions(optsRes);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchExecutions = useCallback(async () => {
    try {
      const res = await workflowService.executions();
      setExecutions(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (tab === 'executions') fetchExecutions();
  }, [tab, fetchExecutions]);

  const handleToggle = async (rule: WorkflowRule) => {
    try {
      const res = await workflowService.toggle(rule.id);
      setRules(prev => prev.map(r => r.id === rule.id ? res.rule : r));
      toast.success(res.message);
    } catch {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async (rule: WorkflowRule) => {
    const ok = await confirm({
      title: 'Delete Workflow Rule',
      message: `Delete "${rule.name}"? This will also remove all execution history.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await workflowService.destroy(rule.id);
      setRules(prev => prev.filter(r => r.id !== rule.id));
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleTest = async (rule: WorkflowRule) => {
    setTesting(rule.id);
    try {
      const res = await workflowService.test(rule.id);
      const status = (res.result as { status?: string })?.status || 'unknown';
      if (status === 'completed') {
        toast.success('Test execution completed successfully');
      } else {
        toast.info(`Test result: ${status}`);
      }
    } catch {
      toast.error('Test execution failed');
    } finally {
      setTesting(null);
    }
  };

  const handleExpand = async (ruleId: number) => {
    if (expandedRule === ruleId) {
      setExpandedRule(null);
      return;
    }
    setExpandedRule(ruleId);
    try {
      const res = await workflowService.show(ruleId);
      setRuleExecs(res.recent_executions);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Workflow Automation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create rules to automate actions when events happen
          </p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          New Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{rules.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Rules</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{rules.filter(r => r.is_active).length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">{rules.filter(r => !r.is_active).length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Inactive</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{rules.reduce((s, r) => s + r.execution_count, 0)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Executions</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700/50">
        {([['rules', 'Rules', Settings2], ['executions', 'Execution Log', Activity]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-shield-600 text-shield-700 dark:text-shield-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card className="p-12 text-center">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No workflow rules yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Create your first automation rule to get started</p>
              <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                Create Rule
              </Button>
            </Card>
          ) : rules.map(rule => (
            <Card key={rule.id} className="overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                {/* Toggle */}
                <button onClick={() => handleToggle(rule)} className="shrink-0">
                  {rule.is_active ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{rule.name}</h3>
                    <Badge variant={rule.is_active ? 'success' : 'default'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {options?.trigger_events[rule.trigger_event] || rule.trigger_event}
                    </span>
                    <span>{rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}</span>
                    {rule.conditions.length > 0 && (
                      <span>{rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}</span>
                    )}
                    {rule.delay_minutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rule.delay_minutes}m delay
                      </span>
                    )}
                    <span>Ran {rule.execution_count}x</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm" variant="outline"
                    leftIcon={testing === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    onClick={() => handleTest(rule)}
                    disabled={testing === rule.id}
                  >
                    Test
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleExpand(rule.id)}>
                    {expandedRule === rule.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 dark:text-red-300" onClick={() => handleDelete(rule)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedRule === rule.id && (
                <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800 p-4 space-y-3">
                  {rule.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{rule.description}</p>
                  )}

                  {/* Conditions */}
                  {rule.conditions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Conditions</p>
                      <div className="space-y-1">
                        {rule.conditions.map((c, i) => (
                          <div key={i} className="text-sm bg-white dark:bg-slate-900 rounded px-3 py-1.5 border border-slate-200 dark:border-slate-700/50">
                            <span className="font-medium">{options?.condition_fields[c.field] || c.field}</span>
                            {' '}<span className="text-slate-500 dark:text-slate-400">{options?.operators[c.operator] || c.operator}</span>
                            {' '}<span className="font-medium text-shield-700 dark:text-shield-300">{String(c.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Actions</p>
                    <div className="space-y-1">
                      {rule.actions.map((a, i) => (
                        <div key={i} className="text-sm bg-white dark:bg-slate-900 rounded px-3 py-1.5 border border-slate-200 dark:border-slate-700/50">
                          <span className="font-medium">{options?.action_types[a.type]?.label || a.type}</span>
                          {Object.entries(a.config).map(([k, v]) => (
                            <span key={k} className="ml-2 text-slate-500 dark:text-slate-400">{k}: <span className="text-slate-700 dark:text-slate-200">{String(v)}</span></span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Executions */}
                  {ruleExecs.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Recent Executions</p>
                      <div className="space-y-1">
                        {ruleExecs.slice(0, 5).map(exec => (
                          <div key={exec.id} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 rounded px-3 py-1.5 border border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <Badge variant={STATUS_BADGE[exec.status] || 'default'}>{exec.status}</Badge>
                              <span className="text-slate-500 dark:text-slate-400">{new Date(exec.created_at).toLocaleString()}</span>
                            </div>
                            {exec.duration_ms != null && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">{exec.duration_ms}ms</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Executions Tab */}
      {tab === 'executions' && (
        <div className="space-y-2">
          {executions.length === 0 ? (
            <Card className="p-12 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No executions yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Workflow execution history will appear here</p>
            </Card>
          ) : executions.map(exec => (
            <Card key={exec.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {exec.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {exec.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                  {exec.status === 'running' && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
                  {exec.status === 'skipped' && <AlertCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                  {exec.status === 'pending' && <Clock className="w-5 h-5 text-blue-400" />}
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {exec.rule?.name || `Rule #${exec.workflow_rule_id}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {options?.trigger_events[exec.trigger_event] || exec.trigger_event}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <Badge variant={STATUS_BADGE[exec.status] || 'default'}>{exec.status}</Badge>
                  {exec.duration_ms != null && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{exec.duration_ms}ms</span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(exec.created_at).toLocaleString()}</span>
                </div>
              </div>
              {exec.error_message && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded p-2">{exec.error_message}</p>
              )}
              {exec.actions_executed && exec.actions_executed.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {exec.actions_executed.map((a, i) => (
                    <Badge key={i} variant={a.status === 'completed' ? 'success' : 'danger'}>
                      {a.type}: {a.status}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && options && (
        <CreateRuleModal
          options={options}
          onClose={() => setShowCreate(false)}
          onCreated={(rule) => {
            setRules(prev => [rule, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Rule Modal                                                  */
/* ------------------------------------------------------------------ */

function CreateRuleModal({
  options,
  onClose,
  onCreated,
}: {
  options: WorkflowOptions;
  onClose: () => void;
  onCreated: (rule: WorkflowRule) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('');
  const [conditions, setConditions] = useState<{ field: string; operator: string; value: string }[]>([]);
  const [actions, setActions] = useState<{ type: string; config: Record<string, string> }[]>([{ type: '', config: {} }]);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !triggerEvent) {
      toast.error('Name and trigger event are required');
      return;
    }
    if (!actions.some(a => a.type)) {
      toast.error('At least one action is required');
      return;
    }
    setSaving(true);
    try {
      const res = await workflowService.create({
        name,
        description: description || undefined,
        trigger_event: triggerEvent,
        conditions: conditions.filter(c => c.field && c.operator),
        actions: actions.filter(a => a.type).map(a => ({ type: a.type, config: a.config })),
        delay_minutes: delayMinutes,
      });
      toast.success('Workflow rule created!');
      onCreated(res.rule);
    } catch {
      toast.error('Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => setConditions(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  const removeCondition = (idx: number) => setConditions(prev => prev.filter((_, i) => i !== idx));
  const updateCondition = (idx: number, key: string, val: string) =>
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, [key]: val } : c));

  const addAction = () => setActions(prev => [...prev, { type: '', config: {} }]);
  const removeAction = (idx: number) => setActions(prev => prev.filter((_, i) => i !== idx));
  const updateActionType = (idx: number, type: string) =>
    setActions(prev => prev.map((a, i) => i === idx ? { type, config: {} } : a));
  const updateActionConfig = (idx: number, key: string, val: string) =>
    setActions(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, [key]: val } } : a));

  return (
    <Modal isOpen onClose={onClose} title="Create Workflow Rule" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Name & Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Rule Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome new leads" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Delay (minutes)</label>
            <Input type="number" value={delayMinutes} onChange={e => setDelayMinutes(Number(e.target.value))} min={0} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
        </div>

        {/* Trigger Event */}
        <div>
          <Select
            label="When this happens... *"
            value={triggerEvent}
            onChange={e => setTriggerEvent(e.target.value)}
            placeholder="Select a trigger event"
            options={Object.entries(options.trigger_events).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Only if... (conditions)</label>
            <button onClick={addCondition} className="text-xs text-shield-600 dark:text-shield-400 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Condition
            </button>
          </div>
          {conditions.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <Select
                value={c.field}
                onChange={e => updateCondition(i, 'field', e.target.value)}
                className="flex-1"
                placeholder="Field"
                options={Object.entries(options.condition_fields).map(([k, v]) => ({ value: k, label: v }))}
              />
              <Select
                value={c.operator}
                onChange={e => updateCondition(i, 'operator', e.target.value)}
                className="w-36"
                options={Object.entries(options.operators).map(([k, v]) => ({ value: k, label: v }))}
              />
              <Input value={c.value} onChange={e => updateCondition(i, 'value', e.target.value)} placeholder="Value" className="flex-1" />
              <button onClick={() => removeCondition(i)} className="text-red-400 hover:text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Then do... (actions) *</label>
            <button onClick={addAction} className="text-xs text-shield-600 dark:text-shield-400 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Action
            </button>
          </div>
          {actions.map((a, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-2">
              <div className="flex gap-2 items-center mb-2">
                <Select
                  value={a.type}
                  onChange={e => updateActionType(i, e.target.value)}
                  className="flex-1"
                  placeholder="Select action type"
                  options={Object.entries(options.action_types).map(([k, v]) => ({ value: k, label: v.label }))}
                />
                {actions.length > 1 && (
                  <button onClick={() => removeAction(i)} className="text-red-400 hover:text-red-600 dark:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Config fields based on action type */}
              {a.type && options.action_types[a.type]?.config.map(field => (
                <div key={field} className="mb-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400 capitalize">{field.replace(/_/g, ' ')}</label>
                  {field === 'to_role' ? (
                    <Select
                      value={a.config[field] || ''}
                      onChange={e => updateActionConfig(i, field, e.target.value)}
                      placeholder="Select role"
                      options={[{ value: 'agent', label: 'Agent' }, { value: 'agency_owner', label: 'Agency Owner' }, { value: 'consumer', label: 'Consumer' }]}
                    />
                  ) : field === 'entity' ? (
                    <Select
                      value={a.config[field] || ''}
                      onChange={e => updateActionConfig(i, field, e.target.value)}
                      placeholder="Select entity"
                      options={[{ value: 'lead', label: 'Lead' }, { value: 'application', label: 'Application' }, { value: 'policy', label: 'Policy' }, { value: 'claim', label: 'Claim' }]}
                    />
                  ) : field === 'method' ? (
                    <Select
                      value={a.config[field] || 'POST'}
                      onChange={e => updateActionConfig(i, field, e.target.value)}
                      options={[{ value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' }]}
                    />
                  ) : (
                    <Input
                      value={a.config[field] || ''}
                      onChange={e => updateActionConfig(i, field, e.target.value)}
                      placeholder={field === 'message' ? 'Use {{lead_id}}, {{consumer_name}} placeholders' : field}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="shield" onClick={handleSave} isLoading={saving} leftIcon={<Zap className="w-4 h-4" />}>
          Create Rule
        </Button>
      </div>
    </Modal>
  );
}
