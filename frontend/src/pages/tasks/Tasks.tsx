import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Input, Select, Modal, Textarea } from '@/components/ui';
import { useConfirm } from '@/components/ui';
import { taskService } from '@/services/api/tasks';
import type { Task, TaskCounts } from '@/services/api/tasks';
import {
  CheckCircle2, Circle, Plus, Calendar,
  Trash2, RotateCcw, ChevronDown, ChevronRight, Flag, User, Search,
} from 'lucide-react';
import { toast } from 'sonner';

const priorityConfig: Record<string, { label: string; variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info'; icon: string }> = {
  urgent: { label: 'Urgent', variant: 'danger', icon: '🔴' },
  high: { label: 'High', variant: 'warning', icon: '🟠' },
  medium: { label: 'Medium', variant: 'info', icon: '🔵' },
  low: { label: 'Low', variant: 'default', icon: '⚪' },
};

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const filterOptions = [
  { value: '', label: 'All Tasks' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'completed', label: 'Completed' },
];

function formatDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(task: Task): boolean {
  if (task.completed_at) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  return new Date(task.date) < new Date(new Date().toDateString());
}

function isDueToday(task: Task): boolean {
  return new Date(task.date).toDateString() === new Date().toDateString();
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, pending: 0, overdue: 0, completed_today: 0, due_today: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const confirm = useConfirm();

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string | boolean> = {};
      if (priorityFilter) params.priority = priorityFilter;
      if (statusFilter === 'overdue') params.overdue = true;
      else if (statusFilter === 'today') params.today = true;
      else if (statusFilter === 'completed') params.status = 'completed';
      else if (statusFilter === 'active') params.status = 'scheduled';

      const res = await taskService.list(params);
      setTasks(res.tasks);
      setCounts(res.counts);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.lead?.first_name?.toLowerCase().includes(q);
  });

  const handleComplete = async (task: Task) => {
    try {
      await taskService.complete(task.id);
      toast.success('Task completed');
      fetchTasks();
    } catch {
      toast.error('Failed to complete task');
    }
  };

  const handleReopen = async (task: Task) => {
    try {
      await taskService.reopen(task.id);
      toast.success('Task reopened');
      fetchTasks();
    } catch {
      toast.error('Failed to reopen task');
    }
  };

  const handleDelete = async (task: Task) => {
    const ok = await confirm({ title: 'Delete Task', message: `Delete "${task.title}"? This cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await taskService.remove(task.id);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage follow-ups, reminders, and workflow tasks</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-shield-600 dark:text-shield-400">{counts.pending}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
        </Card>
        <Card className={`p-4 text-center ${counts.overdue > 0 ? 'ring-2 ring-red-200' : ''}`}>
          <p className={`text-2xl font-bold ${counts.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>{counts.overdue}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.due_today}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Due Today</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-savings-600 dark:text-savings-400">{counts.completed_today}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Done Today</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
        </div>
        <div className="w-44">
          <Select options={filterOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </div>
        <div className="w-44">
          <Select options={priorityOptions} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} />
        </div>
      </div>

      {/* Task list */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {tasks.length === 0 ? 'No tasks yet — create one or set up workflow automation' : 'No tasks match your filters'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(task => {
              const overdue = isOverdue(task);
              const today = isDueToday(task);
              const done = !!task.completed_at;
              const pc = priorityConfig[task.priority] || priorityConfig.medium;
              const expanded = expandedId === task.id;

              return (
                <div key={task.id} className={`p-4 ${overdue ? 'bg-red-50 dark:bg-red-900/30/50' : ''} ${done ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Completion toggle */}
                    <button
                      onClick={() => done ? handleReopen(task) : handleComplete(task)}
                      className={`mt-0.5 flex-shrink-0 transition-colors ${done ? 'text-savings-600 dark:text-savings-400 hover:text-slate-400 dark:text-slate-500' : 'text-slate-300 hover:text-savings-500'}`}
                    >
                      {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>{task.title}</span>
                        <Badge variant={pc.variant} className="text-xs">{pc.icon} {pc.label}</Badge>
                        {overdue && <Badge variant="danger" className="text-xs">Overdue</Badge>}
                        {today && !overdue && !done && <Badge variant="warning" className="text-xs">Due Today</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.date)}
                        </span>
                        {task.agent && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.agent.name}
                          </span>
                        )}
                        {task.lead && (
                          <span className="flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {task.lead.first_name} {task.lead.last_name}
                          </span>
                        )}
                        {done && task.completed_at && (
                          <span className="flex items-center gap-1 text-savings-600 dark:text-savings-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Done {formatDate(task.completed_at)}
                          </span>
                        )}
                      </div>

                      {/* Expanded notes */}
                      {expanded && task.notes && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.notes}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {task.notes && (
                        <Button variant="ghost" size="sm" onClick={() => setExpandedId(expanded ? null : task.id)}>
                          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      )}
                      {done && (
                        <Button variant="ghost" size="sm" onClick={() => handleReopen(task)} title="Reopen">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(task)} className="text-red-500 hover:text-red-700 dark:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCreate && (
        <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={fetchTasks} />
      )}
    </div>
  );
}

// ── Create Task Modal ─────────────────────────────

function CreateTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await taskService.create({ title: title.trim(), date, priority, notes: notes.trim() || undefined });
      toast.success('Task created');
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const createPriorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <Modal isOpen onClose={onClose} title="New Task">
      <div className="space-y-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Follow up with client..." autoFocus />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Due Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Select label="Priority" options={createPriorityOptions} value={priority} onChange={e => setPriority(e.target.value)} />
        </div>
        <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add context..." />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</Button>
        </div>
      </div>
    </Modal>
  );
}
