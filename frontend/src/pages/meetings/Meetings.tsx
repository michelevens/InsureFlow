import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input, Modal, Select } from '@/components/ui';
import { videoMeetingService } from '@/services/api/videoMeetings';
import type { VideoMeeting, MeetingStatus, VideoMeetingSetting, PreferredProvider } from '@/services/api/videoMeetings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Video, Plus, Play, Square, X, Clock, User, Link2, Settings2,
  ExternalLink, Copy, Monitor, Globe,
} from 'lucide-react';

const statusConfig: Record<MeetingStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  waiting: { label: 'Waiting', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

type ViewTab = 'meetings' | 'settings';

export default function Meetings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<VideoMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('meetings');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<VideoMeeting | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const data = await videoMeetingService.list(statusFilter ? { status: statusFilter } : undefined);
      setMeetings(data);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeetings(); }, [statusFilter]);

  const handleStart = async (id: number) => {
    try {
      await videoMeetingService.start(id);
      toast.success('Meeting started');
      fetchMeetings();
    } catch {
      toast.error('Failed to start meeting');
    }
  };

  const handleEnd = async (id: number) => {
    try {
      await videoMeetingService.end(id);
      toast.success('Meeting ended');
      fetchMeetings();
      setSelectedMeeting(null);
    } catch {
      toast.error('Failed to end meeting');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await videoMeetingService.cancel(id);
      toast.success('Meeting cancelled');
      fetchMeetings();
      setSelectedMeeting(null);
    } catch {
      toast.error('Failed to cancel meeting');
    }
  };

  const joinMeeting = async (meeting: VideoMeeting) => {
    if (meeting.meeting_type === 'external' && meeting.external_url) {
      window.open(meeting.external_url, '_blank');
    } else {
      navigate(`/meetings/${meeting.id}/room`);
    }
  };

  const copyMeetingLink = async (meeting: VideoMeeting) => {
    try {
      const link = await videoMeetingService.getLink(meeting.id);
      await navigator.clipboard.writeText(link.url);
      toast.success('Meeting link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const upcoming = meetings.filter(m => m.status === 'scheduled' || m.status === 'waiting');
  const active = meetings.filter(m => m.status === 'in_progress');
  const past = meetings.filter(m => m.status === 'completed' || m.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Video Meetings</h1>
          <p className="text-slate-500 mt-1">Schedule and manage video consultations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'meetings' ? 'bg-white shadow text-slate-900 font-medium' : 'text-slate-500'}`}
            >
              <Video className="w-4 h-4 inline mr-1" /> Meetings
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'settings' ? 'bg-white shadow text-slate-900 font-medium' : 'text-slate-500'}`}
            >
              <Settings2 className="w-4 h-4 inline mr-1" /> Settings
            </button>
          </div>
          {activeTab === 'meetings' && (
            <Button variant="shield" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Meeting
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'meetings' ? (
        <>
          {/* Filter */}
          <div className="flex gap-2">
            {['', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  statusFilter === s ? 'bg-shield-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === '' ? 'All' : statusConfig[s as MeetingStatus]?.label || s}
              </button>
            ))}
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
            </Card>
          ) : meetings.length === 0 ? (
            <Card className="p-12 text-center">
              <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No meetings found</h3>
              <p className="text-sm text-slate-500 mb-4">Schedule a video meeting with a client or colleague</p>
              <Button variant="shield" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> Schedule Meeting
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Active meetings */}
              {active.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Now</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {active.map(m => (
                      <MeetingCard key={m.id} meeting={m} userId={user?.id} onJoin={joinMeeting} onEnd={handleEnd} onSelect={setSelectedMeeting} onCopy={copyMeetingLink} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.map(m => (
                      <MeetingCard key={m.id} meeting={m} userId={user?.id} onJoin={joinMeeting} onStart={handleStart} onSelect={setSelectedMeeting} onCopy={copyMeetingLink} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past */}
              {past.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Past</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {past.map(m => (
                      <MeetingCard key={m.id} meeting={m} userId={user?.id} onSelect={setSelectedMeeting} onCopy={copyMeetingLink} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <MeetingSettings />
      )}

      {/* Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          userId={user?.id}
          onClose={() => setSelectedMeeting(null)}
          onJoin={joinMeeting}
          onStart={handleStart}
          onEnd={handleEnd}
          onCancel={handleCancel}
          onCopy={copyMeetingLink}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateMeetingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchMeetings(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

/* ---------- Meeting Card ---------- */

function MeetingCard({ meeting, userId, onJoin, onStart, onEnd, onSelect, onCopy }: {
  meeting: VideoMeeting;
  userId?: number;
  onJoin?: (m: VideoMeeting) => void;
  onStart?: (id: number) => void;
  onEnd?: (id: number) => void;
  onSelect: (m: VideoMeeting) => void;
  onCopy: (m: VideoMeeting) => void;
}) {
  const sc = statusConfig[meeting.status];
  const isHost = userId === meeting.host_user_id;
  const isActive = meeting.status === 'in_progress';
  const isScheduled = meeting.status === 'scheduled' || meeting.status === 'waiting';

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${isActive ? 'ring-2 ring-green-400' : ''}`} onClick={() => onSelect(meeting)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {meeting.meeting_type === 'external' ? (
            <Globe className="w-5 h-5 text-blue-500" />
          ) : (
            <Monitor className="w-5 h-5 text-shield-600" />
          )}
          <h3 className="font-medium text-slate-900 text-sm">{meeting.title}</h3>
        </div>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </div>

      {meeting.scheduled_at && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Clock className="w-3.5 h-3.5" />
          {new Date(meeting.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      )}

      {meeting.guest && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <User className="w-3.5 h-3.5" />
          {meeting.guest.name}
        </div>
      )}

      {meeting.external_service && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <ExternalLink className="w-3 h-3" />
          {meeting.external_service}
        </div>
      )}

      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {isActive && onJoin && (
          <Button variant="shield" size="sm" onClick={() => onJoin(meeting)}>
            <Play className="w-3.5 h-3.5 mr-1" /> Join
          </Button>
        )}
        {isScheduled && isHost && onStart && (
          <Button variant="shield" size="sm" onClick={() => onStart(meeting.id)}>
            <Play className="w-3.5 h-3.5 mr-1" /> Start
          </Button>
        )}
        {isActive && isHost && onEnd && (
          <Button variant="danger" size="sm" onClick={() => onEnd(meeting.id)}>
            <Square className="w-3.5 h-3.5 mr-1" /> End
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onCopy(meeting)}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

/* ---------- Meeting Detail Modal ---------- */

function MeetingDetailModal({ meeting, userId, onClose, onJoin, onStart, onEnd, onCancel, onCopy }: {
  meeting: VideoMeeting;
  userId?: number;
  onClose: () => void;
  onJoin: (m: VideoMeeting) => void;
  onStart: (id: number) => void;
  onEnd: (id: number) => void;
  onCancel: (id: number) => void;
  onCopy: (m: VideoMeeting) => void;
}) {
  const sc = statusConfig[meeting.status];
  const isHost = userId === meeting.host_user_id;
  const isActive = meeting.status === 'in_progress';
  const isScheduled = meeting.status === 'scheduled' || meeting.status === 'waiting';

  return (
    <Modal isOpen onClose={onClose} title="Meeting Details" size="md">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{meeting.title}</h3>
          <Badge variant={sc.variant} className="mt-1">{sc.label}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-400">Type</span>
            <p className="font-medium capitalize">{meeting.meeting_type}</p>
          </div>
          {meeting.scheduled_at && (
            <div>
              <span className="text-slate-400">Scheduled</span>
              <p className="font-medium">{new Date(meeting.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          )}
          {meeting.started_at && (
            <div>
              <span className="text-slate-400">Started</span>
              <p className="font-medium">{new Date(meeting.started_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          )}
          {meeting.ended_at && (
            <div>
              <span className="text-slate-400">Ended</span>
              <p className="font-medium">{new Date(meeting.ended_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          )}
          {meeting.external_service && (
            <div>
              <span className="text-slate-400">Service</span>
              <p className="font-medium capitalize">{meeting.external_service}</p>
            </div>
          )}
        </div>

        {meeting.host && (
          <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
            <User className="w-4 h-4 text-slate-400" />
            <span>{meeting.host.name}</span>
            <span className="text-slate-400">(Host)</span>
          </div>
        )}

        {meeting.guest && (
          <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
            <User className="w-4 h-4 text-slate-400" />
            <span>{meeting.guest.name}</span>
            <span className="text-slate-400">(Guest)</span>
          </div>
        )}

        {meeting.external_url && (
          <a href={meeting.external_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-shield-600 hover:underline">
            <Link2 className="w-4 h-4" /> External meeting link
          </a>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {isActive && (
            <Button variant="shield" size="sm" onClick={() => onJoin(meeting)}>
              <Play className="w-3.5 h-3.5 mr-1" /> Join
            </Button>
          )}
          {isScheduled && isHost && (
            <Button variant="shield" size="sm" onClick={() => onStart(meeting.id)}>
              <Play className="w-3.5 h-3.5 mr-1" /> Start
            </Button>
          )}
          {isActive && isHost && (
            <Button variant="danger" size="sm" onClick={() => onEnd(meeting.id)}>
              <Square className="w-3.5 h-3.5 mr-1" /> End
            </Button>
          )}
          {isScheduled && isHost && (
            <Button variant="danger" size="sm" onClick={() => onCancel(meeting.id)}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onCopy(meeting)}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Meeting Settings ---------- */

function MeetingSettings() {
  const [, setSettings] = useState<VideoMeetingSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<PreferredProvider>('system');
  const [customService, setCustomService] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [earlyJoin, setEarlyJoin] = useState(5);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await videoMeetingService.getSettings();
        setSettings(s);
        setProvider(s.preferred_provider);
        setCustomService(s.custom_service || '');
        setCustomLink(s.custom_meeting_link || '');
        setWaitingRoom(s.waiting_room_enabled);
        setEarlyJoin(s.early_join_minutes);
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await videoMeetingService.updateSettings({
        preferred_provider: provider,
        custom_service: provider === 'custom' ? customService : null,
        custom_meeting_link: provider === 'custom' ? customLink : null,
        waiting_room_enabled: waitingRoom,
        early_join_minutes: earlyJoin,
      });
      setSettings(updated);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Meeting Provider</h3>
        <p className="text-sm text-slate-500 mb-4">
          Choose between the built-in system video or use your own external meeting link (Zoom, Google Meet, Teams, etc.)
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="radio" name="provider" value="system" checked={provider === 'system'} onChange={() => setProvider('system')}
              className="mt-0.5 rounded-full border-slate-300 text-shield-600 focus:ring-shield-500" />
            <div>
              <p className="font-medium text-slate-900 flex items-center gap-2"><Monitor className="w-4 h-4 text-shield-600" /> System Video</p>
              <p className="text-sm text-slate-500 mt-0.5">Built-in video meeting — no external account needed</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="radio" name="provider" value="custom" checked={provider === 'custom'} onChange={() => setProvider('custom')}
              className="mt-0.5 rounded-full border-slate-300 text-shield-600 focus:ring-shield-500" />
            <div>
              <p className="font-medium text-slate-900 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Custom Provider</p>
              <p className="text-sm text-slate-500 mt-0.5">Use your own Zoom, Google Meet, Teams, or other meeting link</p>
            </div>
          </label>
        </div>

        {provider === 'custom' && (
          <div className="space-y-3 mb-6 pl-4 border-l-2 border-shield-200">
            <Select
              label="Service"
              value={customService}
              onChange={e => setCustomService(e.target.value)}
              options={[
                { value: '', label: 'Select service...' },
                { value: 'zoom', label: 'Zoom' },
                { value: 'google-meet', label: 'Google Meet' },
                { value: 'teams', label: 'Microsoft Teams' },
                { value: 'webex', label: 'Webex' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              label="Default Meeting Link"
              placeholder="https://zoom.us/j/..."
              value={customLink}
              onChange={e => setCustomLink(e.target.value)}
            />
          </div>
        )}

        <Button variant="shield" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Meeting Preferences</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 text-sm">Waiting Room</p>
              <p className="text-xs text-slate-500">Guests wait until the host admits them</p>
            </div>
            <input type="checkbox" checked={waitingRoom} onChange={() => setWaitingRoom(!waitingRoom)}
              className="rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Early Join (minutes)</label>
            <p className="text-xs text-slate-500 mb-2">How early participants can join before the scheduled time</p>
            <select
              value={earlyJoin}
              onChange={e => setEarlyJoin(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={0}>No early join</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Create Meeting Modal ---------- */

function CreateMeetingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingType, setMeetingType] = useState<'system' | 'external'>('system');
  const [externalUrl, setExternalUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title) return;
    setSaving(true);
    try {
      await videoMeetingService.create({
        title,
        scheduled_at: scheduledAt || undefined,
        meeting_type: meetingType,
        external_url: meetingType === 'external' ? externalUrl : undefined,
      });
      toast.success('Meeting scheduled');
      onCreated();
    } catch {
      toast.error('Failed to create meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Video Meeting" size="md">
      <div className="space-y-4">
        <Input label="Title" placeholder="e.g. Policy review with John" value={title} onChange={e => setTitle(e.target.value)} />

        <Input label="Scheduled Time" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMeetingType('system')}
              className={`p-3 rounded-xl border text-left transition-colors ${
                meetingType === 'system' ? 'border-shield-500 bg-shield-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Monitor className={`w-5 h-5 mb-1 ${meetingType === 'system' ? 'text-shield-600' : 'text-slate-400'}`} />
              <p className="font-medium text-sm">System Video</p>
              <p className="text-xs text-slate-500">Built-in meeting</p>
            </button>
            <button
              onClick={() => setMeetingType('external')}
              className={`p-3 rounded-xl border text-left transition-colors ${
                meetingType === 'external' ? 'border-shield-500 bg-shield-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Globe className={`w-5 h-5 mb-1 ${meetingType === 'external' ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="font-medium text-sm">External Link</p>
              <p className="text-xs text-slate-500">Zoom, Meet, Teams...</p>
            </button>
          </div>
        </div>

        {meetingType === 'external' && (
          <Input label="Meeting URL" placeholder="https://zoom.us/j/..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !title}>
            {saving ? 'Creating...' : 'Create Meeting'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
