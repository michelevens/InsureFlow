import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { reportService } from '@/services/api';
import type { ReportDefinition, ReportRun, FileFormat } from '@/services/api/reports';
import {
  FileBarChart, Plus, Play, Download, Trash2, Clock, CheckCircle, XCircle, Loader,
  Mail, FileText, FileJson, FileSpreadsheet,
} from 'lucide-react';

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  pending: { icon: Clock, color: 'text-slate-400 dark:text-slate-500' },
  running: { icon: Loader, color: 'text-blue-500' },
  completed: { icon: CheckCircle, color: 'text-green-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
};

const formatIcons: Record<string, typeof FileText> = {
  csv: FileSpreadsheet,
  pdf: FileText,
  json: FileJson,
};

export default function ReportBuilder() {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [selectedDef, setSelectedDef] = useState<ReportDefinition | null>(null);
  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showRunModal, setShowRunModal] = useState<ReportDefinition | null>(null);
  const [emailRun, setEmailRun] = useState<ReportRun | null>(null);

  const fetchDefinitions = async () => {
    setLoading(true);
    try {
      const data = await reportService.list();
      setDefinitions(data);
    } catch {
      toast.error('Failed to load report definitions');
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

  const deleteDefinition = async (id: number) => {
    try {
      await reportService.destroy(id);
      toast.success('Report definition deleted');
      setDefinitions(prev => prev.filter(d => d.id !== id));
      if (selectedDef?.id === id) { setSelectedDef(null); setRuns([]); }
    } catch {
      toast.error('Failed to delete report definition');
    }
  };

  const handleDownload = async (run: ReportRun) => {
    try {
      await reportService.downloadRun(run.id);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & BI Export</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Build custom reports with scheduled delivery</p>
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
              <p className="text-slate-500 dark:text-slate-400 mb-4">No report definitions yet</p>
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
                  <h3 className="font-bold text-slate-900 dark:text-white">{def.name}</h3>
                  {def.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{def.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {def.schedule && <Badge variant="info">{def.schedule}</Badge>}
                  <Badge variant={def.is_active ? 'success' : 'default'}>{def.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                {def.recipients && def.recipients.length > 0 && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {def.recipients.length} recipient(s)</span>
                )}
                {def.last_run_at && <span>Last run: {new Date(def.last_run_at).toLocaleDateString()}</span>}
                <span>Created: {new Date(def.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <Button variant="shield" size="sm" onClick={e => { e.stopPropagation(); setShowRunModal(def); }}>
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
                <h3 className="font-bold text-slate-900 dark:text-white">Report Runs</h3>
                <Button variant="shield" size="sm" onClick={() => setShowRunModal(selectedDef)}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Run
                </Button>
              </div>
              <div className="space-y-3">
                {runs.map(run => {
                  const sc = statusConfig[run.status] || statusConfig.pending;
                  const FormatIcon = formatIcons[run.file_format] || FileText;
                  return (
                    <div key={run.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <sc.icon className={`w-4 h-4 ${sc.color} ${run.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{run.status}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <FormatIcon className="w-3 h-3" />
                          <span>{run.file_format.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {run.completed_at ? (
                          <span>{run.row_count.toLocaleString()} rows &bull; {new Date(run.completed_at).toLocaleString()}</span>
                        ) : run.started_at ? (
                          <span>Started {new Date(run.started_at).toLocaleString()}</span>
                        ) : (
                          <span>Queued {new Date(run.created_at).toLocaleString()}</span>
                        )}
                      </div>
                      {run.error_message && <p className="text-xs text-red-500 mt-1">{run.error_message}</p>}
                      {run.status === 'completed' && run.file_path && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(run)}>
                            <Download className="w-3.5 h-3.5 mr-1" /> Download
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEmailRun(run)}>
                            <Mail className="w-3.5 h-3.5 mr-1" /> Email
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {runs.length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No runs yet</p>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400 dark:text-slate-500">
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

      {/* Run modal with format selection */}
      {showRunModal && (
        <RunReportModal
          definition={showRunModal}
          onClose={() => setShowRunModal(null)}
          onRun={(run) => {
            setRuns(prev => [run, ...prev]);
            if (!selectedDef || selectedDef.id === showRunModal.id) {
              setSelectedDef(showRunModal);
            }
            setShowRunModal(null);
          }}
        />
      )}

      {/* Email modal */}
      {emailRun && (
        <EmailReportModal
          run={emailRun}
          onClose={() => setEmailRun(null)}
        />
      )}
    </div>
  );
}

function RunReportModal({ definition, onClose, onRun }: { definition: ReportDefinition; onClose: () => void; onRun: (run: ReportRun) => void }) {
  const [format, setFormat] = useState<FileFormat>('csv');
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const run = await reportService.run(definition.id, format);
      toast.success(`Report generated as ${format.toUpperCase()}`);
      onRun(run);
    } catch {
      toast.error('Failed to run report');
    } finally {
      setRunning(false);
    }
  };

  const formats: { value: FileFormat; label: string; desc: string; Icon: typeof FileText }[] = [
    { value: 'csv', label: 'CSV', desc: 'Spreadsheet format, compatible with Excel', Icon: FileSpreadsheet },
    { value: 'pdf', label: 'PDF', desc: 'Printable document with formatted table', Icon: FileText },
    { value: 'json', label: 'JSON', desc: 'Machine-readable data for integrations', Icon: FileJson },
  ];

  return (
    <Modal isOpen onClose={onClose} title={`Run: ${definition.name}`} size="md">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map(f => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  format === f.value
                    ? 'border-shield-500 bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300'
                    : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                }`}
              >
                <f.Icon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleRun} disabled={running}>
            {running ? 'Generating...' : `Generate ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EmailReportModal({ run, onClose }: { run: ReportRun; onClose: () => void }) {
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const emails = recipients.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      toast.error('Enter at least one email address');
      return;
    }

    setSending(true);
    try {
      const result = await reportService.emailRun(run.id, { recipients: emails, message: message || undefined });
      toast.success(result.message);
      onClose();
    } catch {
      toast.error('Failed to send report email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Email Report" size="md">
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-shield-50 dark:bg-shield-900/30 flex items-center justify-center">
            {(() => { const Icon = formatIcons[run.file_format] || FileText; return <Icon className="w-5 h-5 text-shield-600 dark:text-shield-400" />; })()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{run.file_format.toUpperCase()} Report</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{run.row_count.toLocaleString()} rows &bull; {run.completed_at ? new Date(run.completed_at).toLocaleString() : ''}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Recipients</label>
          <Input
            placeholder="email@example.com, another@example.com"
            value={recipients}
            onChange={e => setRecipients(e.target.value)}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Separate multiple emails with commas</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Message (optional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full h-20 text-sm border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-shield-500"
            placeholder="Here's the latest report..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSend} disabled={sending || !recipients.trim()}>
            <Mail className="w-4 h-4 mr-1" />
            {sending ? 'Sending...' : 'Send Report'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateReportModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    const recipients = recipientInput.split(',').map(e => e.trim()).filter(Boolean);
    setSaving(true);
    try {
      await reportService.create({
        name,
        description: description || null,
        query_config: {},
        schedule: schedule || null,
        recipients: recipients.length > 0 ? recipients : null,
      });
      toast.success('Report definition created successfully');
      onCreated();
    } catch {
      toast.error('Failed to create report definition');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Report Definition" size="md">
      <div className="space-y-4">
        <Input label="Report Name" placeholder="Monthly Production Summary" value={name} onChange={e => setName(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-20 text-sm border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-shield-500" placeholder="What this report covers..." />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Schedule (optional)</label>
          <select value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2">
            <option value="">No schedule (run manually)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Email Recipients (optional)</label>
          <Input
            placeholder="email@example.com, another@example.com"
            value={recipientInput}
            onChange={e => setRecipientInput(e.target.value)}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Reports will be emailed to these addresses on schedule</p>
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
