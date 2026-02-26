import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { recruitmentService } from '@/services/api';
import type { JobPosting, JobApplication } from '@/services/api/recruitment';
import {
  Briefcase, Plus, MapPin, Users, Eye, Trash2,
} from 'lucide-react';

type Tab = 'postings' | 'applications' | 'browse';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'default',
  published: 'success',
  closed: 'danger',
  submitted: 'info',
  reviewing: 'warning',
  interview: 'info',
  offered: 'success',
  hired: 'success',
  rejected: 'danger',
};

export default function RecruitmentDashboard() {
  const [tab, setTab] = useState<Tab>('postings');
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [publicJobs, setPublicJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'postings') {
          const data = await recruitmentService.listPostings();
          setPostings(data);
        } else if (tab === 'browse') {
          const data = await recruitmentService.browseJobs();
          setPublicJobs(data);
        }
      } catch {
        toast.error('Failed to load recruitment data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const loadApplications = async (posting: JobPosting) => {
    setSelectedPosting(posting);
    try {
      const data = await recruitmentService.listApplications(posting.id);
      setApplications(data);
    } catch {
      setApplications([]);
    }
  };

  const deletePosting = async (id: number) => {
    try {
      await recruitmentService.deletePosting(id);
      toast.success('Job posting deleted');
      setPostings(prev => prev.filter(p => p.id !== id));
      if (selectedPosting?.id === id) setSelectedPosting(null);
    } catch {
      toast.error('Failed to delete job posting');
    }
  };

  const updateAppStatus = async (appId: number, status: string) => {
    try {
      await recruitmentService.updateApplication(appId, { status });
      toast.success(`Application status updated to ${status}`);
      if (selectedPosting) loadApplications(selectedPosting);
    } catch {
      toast.error('Failed to update application status');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'postings', label: 'My Job Postings' },
    { key: 'applications', label: 'Applications' },
    { key: 'browse', label: 'Job Board' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruitment</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Recruit, review, and hire insurance agents</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Post Job
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 text-center ${
              tab === t.key ? 'bg-white dark:bg-slate-900 text-shield-700 dark:text-shield-300 shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : tab === 'postings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {postings.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">No job postings yet</p>
                <Button variant="shield" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create First Posting
                </Button>
              </Card>
            ) : postings.map(posting => (
              <Card key={posting.id} className={`p-4 cursor-pointer transition-all ${selectedPosting?.id === posting.id ? 'ring-2 ring-shield-500' : 'hover:shadow-md'}`} onClick={() => loadApplications(posting)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{posting.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {posting.location}</span>
                      {posting.is_remote && <Badge variant="info">Remote</Badge>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {posting.applications_count} applicants</span>
                    </div>
                  </div>
                  <Badge variant={statusColors[posting.status]}>{posting.status}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); loadApplications(posting); }}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Apps
                  </Button>
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deletePosting(posting.id); }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Applications panel */}
          <div>
            {selectedPosting ? (
              <Card className="p-5 sticky top-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{selectedPosting.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{applications.length} applications</p>
                <div className="space-y-3">
                  {applications.map(app => (
                    <div key={app.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{app.applicant_name}</span>
                        <Badge variant={statusColors[app.status]}>{app.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{app.applicant_email}</p>
                      {app.experience && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{app.experience.years}y exp • {app.experience.specialties?.join(', ')}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {['reviewing', 'interview', 'offered', 'hired', 'rejected'].filter(s => s !== app.status).slice(0, 3).map(s => (
                          <button
                            key={s}
                            onClick={() => updateAppStatus(app.id, s)}
                            className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-shield-300 capitalize"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No applications yet</p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center text-slate-400 dark:text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a posting to view applications</p>
              </Card>
            )}
          </div>
        </div>
      ) : tab === 'browse' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicJobs.map(job => (
            <Card key={job.id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{job.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{job.agency_name}</p>
                </div>
                {job.is_remote && <Badge variant="info">Remote</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                {job.compensation?.type && <span>{job.compensation.type}</span>}
              </div>
              {job.requirements && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.requirements.slice(0, 3).map((r, i) => (
                    <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{r}</span>
                  ))}
                </div>
              )}
              <Button variant="shield" size="sm" className="w-full">Apply Now</Button>
            </Card>
          ))}
          {publicJobs.length === 0 && (
            <Card className="p-12 text-center col-span-2">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No open positions available</p>
            </Card>
          )}
        </div>
      ) : null}

      {/* Create modal */}
      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); recruitmentService.listPostings().then(setPostings); }}
        />
      )}
    </div>
  );
}

function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title) return;
    setSaving(true);
    try {
      await recruitmentService.createPosting({ title, description, location, is_remote: isRemote, status: 'published' } as Partial<JobPosting>);
      toast.success('Job posting published successfully');
      onCreated();
    } catch {
      toast.error('Failed to create job posting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Post a Job" size="md">
      <div className="space-y-4">
        <Input label="Job Title" placeholder="Licensed Insurance Agent" value={title} onChange={e => setTitle(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full h-24 text-sm border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-shield-500"
            placeholder="Describe the role and what you're looking for..."
          />
        </div>
        <Input label="Location" placeholder="New York, NY" value={location} onChange={e => setLocation(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={isRemote} onChange={e => setIsRemote(e.target.checked)} className="rounded border-slate-300" />
          Remote friendly
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !title}>
            {saving ? 'Publishing...' : 'Publish Job'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
