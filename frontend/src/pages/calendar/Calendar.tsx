import { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button, Input, Modal, Select } from '@/components/ui';
import { appointmentService } from '@/services/api';
import type { Appointment, AppointmentType, AppointmentStatus, AvailabilitySlot, BlockedDate } from '@/services/api/appointments';
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Video,
  User, Check, X, Ban, Settings2,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const typeLabels: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  review: 'Policy Review',
  follow_up: 'Follow-Up',
  claim: 'Claim Meeting',
  renewal: 'Renewal',
  other: 'Other',
};

const statusConfig: Record<AppointmentStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  no_show: { label: 'No Show', variant: 'warning' },
};

type ViewTab = 'calendar' | 'availability';

export default function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('calendar');

  // Availability state
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [availLoading, setAvailLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const dateFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dateTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${lastDay}`;
      const data = await appointmentService.list({ date_from: dateFrom, date_to: dateTo });
      setAppointments(data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    setAvailLoading(true);
    try {
      const [avail, blocked] = await Promise.all([
        appointmentService.getAvailability(),
        appointmentService.getBlockedDates(),
      ]);
      setAvailability(avail);
      setBlockedDates(blocked);
    } catch {
      // handle error
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [currentMonth, currentYear]);
  useEffect(() => { if (activeTab === 'availability') fetchAvailability(); }, [activeTab]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: { date: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({ date: d, isCurrentMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      days.push({ date: d, isCurrentMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }

    return days;
  }, [currentMonth, currentYear]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [appointments]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const updateStatus = async (id: number, status: AppointmentStatus) => {
    await appointmentService.updateStatus(id, status);
    fetchAppointments();
    setSelectedAppt(null);
  };

  const deleteAppointment = async (id: number) => {
    await appointmentService.remove(id);
    fetchAppointments();
    setSelectedAppt(null);
  };

  const selectedDateAppointments = selectedDate ? (appointmentsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 mt-1">Manage appointments &amp; availability</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'calendar' ? 'bg-white shadow text-slate-900 font-medium' : 'text-slate-500'}`}
            >
              <CalendarDays className="w-4 h-4 inline mr-1" /> Calendar
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'availability' ? 'bg-white shadow text-slate-900 font-medium' : 'text-slate-500'}`}
            >
              <Settings2 className="w-4 h-4 inline mr-1" /> Availability
            </button>
          </div>
          {activeTab === 'calendar' && (
            <Button variant="shield" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Appointment
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>
                <Button variant="ghost" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden">
                  {calendarDays.map((day, i) => {
                    const dayAppts = appointmentsByDate[day.dateStr] || [];
                    const isToday = day.dateStr === todayStr;
                    const isSelected = day.dateStr === selectedDate;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`relative bg-white p-1.5 min-h-[80px] text-left transition-colors hover:bg-shield-50 ${
                          !day.isCurrentMonth ? 'opacity-40' : ''
                        } ${isSelected ? 'ring-2 ring-shield-500 ring-inset' : ''}`}
                      >
                        <span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${
                          isToday ? 'bg-shield-600 text-white' : 'text-slate-700'
                        }`}>
                          {day.date}
                        </span>
                        {dayAppts.length > 0 && (
                          <div className="mt-0.5 space-y-0.5">
                            {dayAppts.slice(0, 2).map(a => (
                              <div key={a.id} className="text-[10px] px-1 py-0.5 rounded bg-shield-50 text-shield-700 truncate">
                                {a.start_time?.slice(0, 5)} {a.title}
                              </div>
                            ))}
                            {dayAppts.length > 2 && (
                              <div className="text-[10px] text-slate-400 px-1">+{dayAppts.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Side panel — selected date or upcoming */}
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
              </h3>
              {selectedDate && (
                <p className="text-sm text-slate-500 mt-0.5">{selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {!selectedDate ? (
                <p className="text-sm text-slate-400 text-center py-8">Click a date to view appointments</p>
              ) : selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No appointments</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowCreate(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Schedule one
                  </Button>
                </div>
              ) : (
                selectedDateAppointments
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(appt => {
                    const sc = statusConfig[appt.status];
                    return (
                      <button
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="w-full text-left bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{appt.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              {appt.start_time?.slice(0, 5)} – {appt.end_time?.slice(0, 5)}
                            </div>
                          </div>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </div>
                        {appt.location && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" /> {appt.location}
                          </div>
                        )}
                        {appt.video_link && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-shield-600">
                            <Video className="w-3 h-3" /> Video meeting
                          </div>
                        )}
                      </button>
                    );
                  })
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Availability tab */
        <AvailabilityManager
          availability={availability}
          blockedDates={blockedDates}
          loading={availLoading}
          onRefresh={fetchAvailability}
        />
      )}

      {/* Appointment detail modal */}
      {selectedAppt && (
        <Modal isOpen onClose={() => setSelectedAppt(null)} title="Appointment Details" size="md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedAppt.title}</h3>
              <Badge variant={statusConfig[selectedAppt.status].variant} className="mt-1">
                {statusConfig[selectedAppt.status].label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400">Type</span>
                <p className="font-medium">{typeLabels[selectedAppt.type]}</p>
              </div>
              <div>
                <span className="text-slate-400">Date</span>
                <p className="font-medium">{new Date(selectedAppt.date + 'T00:00:00').toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-slate-400">Time</span>
                <p className="font-medium">{selectedAppt.start_time?.slice(0, 5)} – {selectedAppt.end_time?.slice(0, 5)}</p>
              </div>
              {selectedAppt.location && (
                <div>
                  <span className="text-slate-400">Location</span>
                  <p className="font-medium">{selectedAppt.location}</p>
                </div>
              )}
            </div>

            {selectedAppt.consumer && (
              <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
                <User className="w-4 h-4 text-slate-400" />
                <span>{selectedAppt.consumer.name}</span>
                <span className="text-slate-400">({selectedAppt.consumer.email})</span>
              </div>
            )}

            {selectedAppt.lead && (
              <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
                <User className="w-4 h-4 text-slate-400" />
                <span>{selectedAppt.lead.first_name} {selectedAppt.lead.last_name}</span>
                <span className="text-slate-400">(Lead)</span>
              </div>
            )}

            {selectedAppt.video_link && (
              <a href={selectedAppt.video_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-shield-600 hover:underline">
                <Video className="w-4 h-4" /> Join video meeting
              </a>
            )}

            {selectedAppt.notes && (
              <div>
                <span className="text-sm text-slate-400">Notes</span>
                <p className="text-sm mt-1">{selectedAppt.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {selectedAppt.status === 'scheduled' && (
                <Button variant="shield" size="sm" onClick={() => updateStatus(selectedAppt.id, 'confirmed')}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Confirm
                </Button>
              )}
              {(selectedAppt.status === 'scheduled' || selectedAppt.status === 'confirmed') && (
                <>
                  <Button variant="primary" size="sm" onClick={() => updateStatus(selectedAppt.id, 'completed')}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Complete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus(selectedAppt.id, 'no_show')}>
                    <Ban className="w-3.5 h-3.5 mr-1" /> No Show
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => updateStatus(selectedAppt.id, 'cancelled')}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => deleteAppointment(selectedAppt.id)}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateAppointmentModal
          defaultDate={selectedDate || todayStr}
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchAppointments(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

/* ---------- Availability Manager ---------- */

function AvailabilityManager({ availability, blockedDates, loading, onRefresh }: {
  availability: AvailabilitySlot[];
  blockedDates: BlockedDate[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [schedule, setSchedule] = useState<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    if (availability.length > 0) {
      setSchedule(availability.map(s => ({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_active: s.is_active })));
    } else {
      // Default schedule: Mon-Fri 9-5
      setSchedule(
        Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          start_time: '09:00',
          end_time: '17:00',
          is_active: i >= 1 && i <= 5,
        }))
      );
    }
  }, [availability]);

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await appointmentService.setAvailability(schedule);
      onRefresh();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) return;
    await appointmentService.blockDate({ blocked_date: newBlockedDate, reason: blockReason || undefined });
    setNewBlockedDate('');
    setBlockReason('');
    onRefresh();
  };

  const removeBlockedDate = async (id: number) => {
    await appointmentService.unblockDate(id);
    onRefresh();
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
      {/* Weekly schedule */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Weekly Schedule</h3>
        <div className="space-y-3">
          {schedule.map((slot, idx) => (
            <div key={slot.day_of_week} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-28">
                <input
                  type="checkbox"
                  checked={slot.is_active}
                  onChange={() => {
                    const next = [...schedule];
                    next[idx] = { ...next[idx], is_active: !next[idx].is_active };
                    setSchedule(next);
                  }}
                  className="rounded border-slate-300 text-shield-600 focus:ring-shield-500"
                />
                <span className={`text-sm font-medium ${slot.is_active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {FULL_DAYS[slot.day_of_week]}
                </span>
              </label>
              {slot.is_active && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={e => {
                      const next = [...schedule];
                      next[idx] = { ...next[idx], start_time: e.target.value };
                      setSchedule(next);
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={e => {
                      const next = [...schedule];
                      next[idx] = { ...next[idx], end_time: e.target.value };
                      setSchedule(next);
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="shield" onClick={saveSchedule} disabled={saving}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </Card>

      {/* Blocked dates */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Blocked Dates</h3>
        <p className="text-sm text-slate-500 mb-4">Block specific dates when you're unavailable (vacations, holidays, etc.)</p>

        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={newBlockedDate}
            onChange={e => setNewBlockedDate(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Reason (optional)"
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            className="flex-1"
          />
          <Button variant="shield" onClick={addBlockedDate} disabled={!newBlockedDate}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {blockedDates.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No blocked dates</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {blockedDates
              .sort((a, b) => a.blocked_date.localeCompare(b.blocked_date))
              .map(bd => (
                <div key={bd.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{new Date(bd.blocked_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {bd.reason && <span className="text-slate-400 ml-2">— {bd.reason}</span>}
                  </div>
                  <button onClick={() => removeBlockedDate(bd.id)} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Create Appointment Modal ---------- */

function CreateAppointmentModal({ defaultDate, onClose, onCreated }: {
  defaultDate: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !startTime || !endTime) return;
    setSaving(true);
    try {
      await appointmentService.create({
        agent_id: 0, // backend resolves from auth
        title,
        type,
        date,
        start_time: startTime,
        end_time: endTime,
        location: location || undefined,
        video_link: videoLink || undefined,
        notes: notes || undefined,
      });
      onCreated();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Appointment" size="md">
      <div className="space-y-4">
        <Input label="Title" placeholder="e.g. Policy review with John" value={title} onChange={e => setTitle(e.target.value)} />

        <Select
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as AppointmentType)}
          options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
        />

        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>

        <Input label="Location" placeholder="Office, virtual, address..." value={location} onChange={e => setLocation(e.target.value)} />
        <Input label="Video Link" placeholder="https://zoom.us/..." value={videoLink} onChange={e => setVideoLink(e.target.value)} />
        <Input label="Notes" placeholder="Any additional details..." value={notes} onChange={e => setNotes(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !title || !date}>
            {saving ? 'Creating...' : 'Create Appointment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
