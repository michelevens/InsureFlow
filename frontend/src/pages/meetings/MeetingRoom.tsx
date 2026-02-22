import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { videoMeetingService } from '@/services/api/videoMeetings';
import type { VideoMeeting } from '@/services/api/videoMeetings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Video, VideoOff, Mic, MicOff, Phone, Monitor, MessageSquare,
  Users, Settings2, Maximize, Minimize, Copy, ArrowLeft,
} from 'lucide-react';

type RoomPhase = 'loading' | 'waiting' | 'session' | 'external' | 'ended';

export default function MeetingRoom() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<VideoMeeting | null>(null);
  const [phase, setPhase] = useState<RoomPhase>('loading');

  useEffect(() => {
    if (!meetingId) return;
    (async () => {
      try {
        const m = await videoMeetingService.show(Number(meetingId));
        setMeeting(m);
        if (m.meeting_type === 'external') {
          setPhase('external');
        } else if (m.status === 'in_progress') {
          setPhase('session');
        } else if (m.status === 'completed' || m.status === 'cancelled') {
          setPhase('ended');
        } else {
          setPhase('waiting');
        }
      } catch {
        toast.error('Meeting not found');
        navigate('/meetings');
      }
    })();
  }, [meetingId]);

  const handleStart = async () => {
    if (!meeting) return;
    try {
      const updated = await videoMeetingService.start(meeting.id);
      setMeeting(updated);
      setPhase('session');
    } catch {
      toast.error('Failed to start meeting');
    }
  };

  const handleEnd = async () => {
    if (!meeting) return;
    try {
      const updated = await videoMeetingService.end(meeting.id);
      setMeeting(updated);
      setPhase('ended');
      toast.success('Meeting ended');
    } catch {
      toast.error('Failed to end meeting');
    }
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <Card className="p-8">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Meeting Ended</h2>
          <p className="text-slate-500 mb-1">{meeting?.title}</p>
          {meeting?.started_at && meeting?.ended_at && (
            <p className="text-sm text-slate-400 mb-6">
              Duration: {formatDuration(new Date(meeting.started_at), new Date(meeting.ended_at))}
            </p>
          )}
          <Button variant="shield" onClick={() => navigate('/meetings')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Meetings
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'external' && meeting) {
    return <EmbeddedSession meeting={meeting} onBack={() => navigate('/meetings')} />;
  }

  if (phase === 'waiting' && meeting) {
    return <WaitingRoom meeting={meeting} userId={user?.id} onStart={handleStart} onBack={() => navigate('/meetings')} />;
  }

  if (phase === 'session' && meeting) {
    return <VideoSession meeting={meeting} onEnd={handleEnd} onBack={() => navigate('/meetings')} />;
  }

  return null;
}

/* ---------- Waiting Room ---------- */

function WaitingRoom({ meeting, userId, onStart, onBack }: {
  meeting: VideoMeeting;
  userId?: number;
  onStart: () => void;
  onBack: () => void;
}) {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isHost = userId === meeting.host_user_id;

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: cameraOn, audio: micOn });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        toast.error('Could not access camera/mic');
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = cameraOn; });
  }, [cameraOn]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = micOn; });
  }, [micOn]);

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to meetings
      </button>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{meeting.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {meeting.scheduled_at
              ? `Scheduled for ${new Date(meeting.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
              : 'Ready to start'}
          </p>
        </div>

        {/* Preview */}
        <div className="relative bg-slate-900 aspect-video">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`} />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-white text-2xl font-bold">
                {meeting.host?.name?.charAt(0) || 'U'}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 p-4 bg-slate-50">
          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-red-500 text-white'}`}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMicOn(!micOn)}
            className={`p-3 rounded-full transition-colors ${micOn ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-red-500 text-white'}`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <div className="w-px h-8 bg-slate-300 mx-2" />

          {isHost ? (
            <Button variant="shield" onClick={onStart} className="px-6">
              Start Meeting
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Waiting for host to start...
            </div>
          )}
        </div>
      </Card>

      {meeting.guest && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Participants:</span>
            <span className="text-slate-600">{meeting.host?.name} (Host)</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600">{meeting.guest.name}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------- Video Session ---------- */

function VideoSession({ meeting, onEnd, onBack }: {
  meeting: VideoMeeting;
  onEnd: () => void;
  onBack: () => void;
}) {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        toast.error('Could not access camera/mic');
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    const start = meeting.started_at ? new Date(meeting.started_at).getTime() : Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(diff / 60).toString().padStart(2, '0');
      const secs = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [meeting.started_at]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = cameraOn; });
  }, [cameraOn]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = micOn; });
  }, [micOn]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{ minHeight: 'calc(100vh - 12rem)' }}>
      {/* Main video area (remote participant placeholder) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {meeting.guest?.name?.charAt(0) || 'G'}
          </div>
          <p className="text-white text-lg font-medium">{meeting.guest?.name || 'Participant'}</p>
          <p className="text-slate-400 text-sm mt-1">Connected</p>
        </div>
      </div>

      {/* Local video (picture-in-picture) */}
      <div className="absolute bottom-20 right-4 w-48 rounded-xl overflow-hidden shadow-lg border-2 border-slate-700">
        <video ref={localVideoRef} autoPlay muted playsInline className={`w-full aspect-video object-cover ${!cameraOn ? 'hidden' : ''}`} />
        {!cameraOn && (
          <div className="w-full aspect-video bg-slate-800 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-bold">
              You
            </div>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-white font-medium">{meeting.title}</h3>
          <Badge variant="success">Live</Badge>
        </div>
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <Clock className="w-4 h-4" />
          {elapsed}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-t from-black/60 to-transparent">
        <button
          onClick={() => setCameraOn(!cameraOn)}
          className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'}`}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setMicOn(!micOn)}
          className={`p-3 rounded-full transition-colors ${micOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'}`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" title="Screen share (coming soon)">
          <Monitor className="w-5 h-5" />
        </button>

        <button className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" title="Chat (coming soon)">
          <MessageSquare className="w-5 h-5" />
        </button>

        <button onClick={toggleFullscreen} className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" title="Fullscreen">
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        <div className="w-px h-8 bg-white/20 mx-2" />

        <button onClick={onEnd} className="px-5 py-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 font-medium">
          <Phone className="w-5 h-5 rotate-[135deg]" /> End
        </button>
      </div>
    </div>
  );
}

/* ---------- Embedded Session (External) ---------- */

function EmbeddedSession({ meeting, onBack }: { meeting: VideoMeeting; onBack: () => void }) {
  const handleOpenExternal = () => {
    if (meeting.external_url) {
      window.open(meeting.external_url, '_blank');
    }
  };

  const copyLink = async () => {
    if (meeting.external_url) {
      await navigator.clipboard.writeText(meeting.external_url);
      toast.success('Link copied');
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to meetings
      </button>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{meeting.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {meeting.external_service ? `via ${meeting.external_service}` : 'External meeting'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-1" /> Copy Link
            </Button>
            <Button variant="shield" size="sm" onClick={handleOpenExternal}>
              Open in New Tab
            </Button>
          </div>
        </div>

        {/* Embedded iframe if possible, otherwise fallback */}
        {meeting.external_url && canEmbed(meeting.external_url) ? (
          <iframe
            src={meeting.external_url}
            className="w-full border-0"
            style={{ height: 'calc(100vh - 16rem)' }}
            allow="camera; microphone; fullscreen; display-capture"
            title="Video Meeting"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Video className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">External Meeting</h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
              This meeting uses {meeting.external_service || 'an external service'} which cannot be embedded.
              Click below to open it in a new tab.
            </p>
            <Button variant="shield" onClick={handleOpenExternal}>
              Open {meeting.external_service || 'Meeting'} in New Tab
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatDuration(start: Date, end: Date): string {
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function canEmbed(url: string): boolean {
  // Jitsi, Whereby, and Daily.co support embedding
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('jitsi') || host.includes('whereby') || host.includes('daily.co');
  } catch {
    return false;
  }
}
