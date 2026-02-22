import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { reportService } from '@/services/api';
import type { ReportDefinition, ReportRun } from '@/services/api/reports';
import {
  FileBarChart, Plus, Play, Download, Trash2, Clock, CheckCircle, XCircle, Loader,
} from 'lucide-react';

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  pending: { icon: Clock, color: 'text-slate-400' },
  running: { icon: Loader, color: 'text-blue-500' },
  completed: { icon: CheckCircle, color: 'text-green-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
};

export default function ReportBuilder() {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [selectedDef, setSelectedDef] = useState<ReportDefinition | null>(null);
  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchDefinitions = async () => {
    setLoading(true);
    try {
      const data = await reportService.list();
      setDefinitions(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDefinitions(); }, []);

  const viewRuns = async (def: ReportDefinition) => {
    setSelectedDef(def);
    try {
      const data = await reportService.runs(def.id);
      setRuns(data);
    } catch {
      setRuns([]);
    }
  };

  const runReport = async (defId: number) => {
    try {
      const run = await reportService.run(defId);
      setRuns(prev => [run, ...prev]);
    } catch {
      // handle error
    }
  };

  const deleteDefinition = async (id: number) => {
    try {
      await reportService.destroy(id);
      setDefinitions(prev => prev.filter(d => d.id !== id));
      if (selectedDef?.id === id) { setSelectedDef(null); setRuns([]); }
    } catch {
      // handle error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & BI Export</h1>
          <p className="text-slate-500 mt-1">Build custom reports with scheduled delivery</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Definitions */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
            </Card>
          ) : definitions.length === 0 ? (
            <Card className="p-12 text-center">
              <FileBarChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No report definitions yet</p>
              <Button variant="shield" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create First Report
              </Button>
            </Card>
          ) : definitions.map(def => (
            <Card
              key={def.id}
              className={`p-4 cursor-pointer transition-all ${selectedDef?.id === def.id ? 'ring-2 ring-shield-500' : 'hover:shadow-md'}`}
              onClick={() => viewRuns(def)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">{def.name}</h3>
                  {def.description && <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {def.schedule && <Badge variant="info">{def.schedule}</Badge>}
                  <Badge variant={def.is_active ? 'success' : 'default'}>{def.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {def.last_run_at && <span>Last run: {new Date(def.last_run_at).toLocaleDateString()}</span>}
                <span>Created: {new Date(def.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                <Button variant="shield" size="sm" onClick={e => { e.stopPropagation(); runReport(def.id); }}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Run Now
                </Button>
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteDefinition(def.id); }}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Runs panel */}
        <div>
          {selectedDef ? (
            <Card className="p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Report Runs</h3>
                <Button variant="shield" size="sm" onClick={() => runReport(selectedDef.id)}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Run
                </Button>
              </div>
              <div className="space-y-3">
                {runs.map(run => {
                  const sc = statusConfig[run.status] || statusConfig.pending;
                  return (
                    <div key={run.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <sc.icon className={`w-4 h-4 ${sc.color} ${run.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="text-sm font-medium text-slate-900 capitalize">{run.status}</span>
                        </div>
                        <span className="text-xs text-slate-400">{run.file_format.toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {run.completed_at ? (
                          <span>{run.row_count.toLocaleString()} rows • {new Date(run.completed_at).toLocaleString()}</span>
                        ) : run.started_at ? (
                          <span>Started {new Date(run.started_at).toLocaleString()}</span>
                        ) : (
                          <span>Queued {new Date(run.created_at).toLocaleString()}</span>
                        )}
                      </div>
                      {run.error_message && <p className="text-xs text-red-500 mt-1">{run.error_message}</p>}
                      {run.status === 'completed' && run.file_path && (
                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => reportService.downloadRun(run.id)}>
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                      )}
                    </div>
                  );
                })}
                {runs.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No runs yet</p>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              <FileBarChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a report to view runs</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateReportModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchDefinitions(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateReportModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      await reportService.create({
        name,
        description: description || null,
        query_config: {},
        schedule: schedule || null,
      });
      onCreated();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Report Definition" size="md">
      <div className="space-y-4">
        <Input label="Report Name" placeholder="Monthly Production Summary" value={name} onChange={e => setName(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-20 text-sm border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 focus:border-shield-500" placeholder="What this report covers..." />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Schedule (optional)</label>
          <select value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2">
            <option value="">No schedule (run manually)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name}>
            {saving ? 'Creating...' : 'Create Report'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
