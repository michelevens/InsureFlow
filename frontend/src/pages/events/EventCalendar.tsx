import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { eventService } from '@/services/api';
import type { InsuronsEvent } from '@/services/api/events';
import {
  Calendar, MapPin, Video, Users, Plus, Clock, Globe,
} from 'lucide-react';

const typeConfig: Record<string, { label: string; variant: 'info' | 'success' | 'warning'; icon: typeof Video }> = {
  webinar: { label: 'Webinar', variant: 'info', icon: Video },
  in_person: { label: 'In-Person', variant: 'success', icon: MapPin },
  hybrid: { label: 'Hybrid', variant: 'warning', icon: Globe },
};

export default function EventCalendar() {
  const [events, setEvents] = useState<InsuronsEvent[]>([]);
  const [upcoming, setUpcoming] = useState<InsuronsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<InsuronsEvent | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [evts, up] = await Promise.all([
          eventService.list({ status: 'published' }),
          eventService.upcoming(),
        ]);
        setEvents(evts.data);
        setUpcoming(up);
      } catch {
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRegister = async (eventId: number) => {
    try {
      await eventService.register(eventId);
      toast.success('Successfully registered for event');
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: true, registration_count: e.registration_count + 1 } : e));
      setUpcoming(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: true, registration_count: e.registration_count + 1 } : e));
    } catch {
      toast.error('Failed to register for event');
    }
  };

  const handleCancel = async (eventId: number) => {
    try {
      await eventService.cancelRegistration(eventId);
      toast.success('Event registration cancelled');
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: false, registration_count: e.registration_count - 1 } : e));
      setUpcoming(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: false, registration_count: e.registration_count - 1 } : e));
    } catch {
      toast.error('Failed to cancel registration');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events & Webinars</h1>
          <p className="text-slate-500 mt-1">Industry events, training, and networking opportunities</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Create Event
        </Button>
      </div>

      {/* Upcoming spotlight */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-500 uppercase mb-3">Coming Up Next</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcoming.slice(0, 3).map(evt => {
              const tc = typeConfig[evt.type] || typeConfig.webinar;
              return (
                <Card key={evt.id} className="p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={tc.variant}>{tc.label}</Badge>
                    {evt.is_registered && <Badge variant="success">Registered</Badge>}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{evt.title}</h3>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(evt.start_at)}</div>
                    {evt.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.location}</div>}
                    <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {evt.registration_count} registered{evt.max_attendees ? ` / ${evt.max_attendees} max` : ''}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All events */}
      <div>
        <h2 className="text-sm font-medium text-slate-500 uppercase mb-3">All Events</h2>
        {loading ? (
          <Card className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No events scheduled</p>
            <Button variant="shield" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create First Event
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map(evt => {
              const tc = typeConfig[evt.type] || typeConfig.webinar;
              const isPast = new Date(evt.end_at) < new Date();
              return (
                <Card key={evt.id} className={`p-4 ${isPast ? 'opacity-60' : 'hover:shadow-md'} transition-all cursor-pointer`} onClick={() => setSelectedEvent(evt)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-shield-50 flex items-center justify-center">
                        <tc.icon className="w-5 h-5 text-shield-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900">{evt.title}</h3>
                          <Badge variant={tc.variant}>{tc.label}</Badge>
                          {evt.is_registered && <Badge variant="success">Registered</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>{formatDate(evt.start_at)}</span>
                          {evt.location && <span>{evt.location}</span>}
                          <span>{evt.registration_count} attendees</span>
                        </div>
                      </div>
                    </div>
                    {!isPast && (
                      evt.is_registered ? (
                        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); handleCancel(evt.id); }}>Cancel</Button>
                      ) : (
                        <Button variant="shield" size="sm" onClick={e => { e.stopPropagation(); handleRegister(evt.id); }}>Register</Button>
                      )
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <Modal isOpen onClose={() => setSelectedEvent(null)} title={selectedEvent.title} size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={typeConfig[selectedEvent.type]?.variant || 'info'}>{typeConfig[selectedEvent.type]?.label || selectedEvent.type}</Badge>
              <Badge variant={selectedEvent.status === 'published' ? 'success' : 'default'}>{selectedEvent.status}</Badge>
            </div>
            <p className="text-sm text-slate-700">{selectedEvent.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Clock className="w-4 h-4" /> {formatDate(selectedEvent.start_at)} — {formatDate(selectedEvent.end_at)}</div>
              {selectedEvent.location && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4" /> {selectedEvent.location}</div>}
              {selectedEvent.meeting_url && <div className="flex items-center gap-2 text-slate-600"><Video className="w-4 h-4" /> <a href={selectedEvent.meeting_url} target="_blank" rel="noopener noreferrer" className="text-shield-600 hover:underline">Join meeting</a></div>}
              <div className="flex items-center gap-2 text-slate-600"><Users className="w-4 h-4" /> {selectedEvent.registration_count} registered{selectedEvent.max_attendees ? ` / ${selectedEvent.max_attendees}` : ''}</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedEvent(null)}>Close</Button>
              {selectedEvent.is_registered ? (
                <Button variant="outline" onClick={() => { handleCancel(selectedEvent.id); setSelectedEvent(null); }}>Cancel Registration</Button>
              ) : (
                <Button variant="shield" onClick={() => { handleRegister(selectedEvent.id); setSelectedEvent(null); }}>Register Now</Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={(evt) => { setEvents(prev => [evt, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: (e: InsuronsEvent) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'webinar' | 'in_person' | 'hybrid'>('webinar');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !startAt || !endAt) return;
    setSaving(true);
    try {
      const evt = await eventService.create({ title, description, type, start_at: startAt, end_at: endAt, location: location || null, status: 'published' });
      toast.success('Event created successfully');
      onCreated(evt);
    } catch {
      toast.error('Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Create Event" size="md">
      <div className="space-y-4">
        <Input label="Title" placeholder="Product Launch Webinar" value={title} onChange={e => setTitle(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-20 text-sm border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 focus:border-shield-500" placeholder="Event details..." />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2">
            <option value="webinar">Webinar</option>
            <option value="in_person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
          <Input label="End" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
        </div>
        <Input label="Location" placeholder="Optional" value={location} onChange={e => setLocation(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !title || !startAt || !endAt}>
            {saving ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
