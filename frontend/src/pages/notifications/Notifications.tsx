import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { notificationService, type AppNotification } from '@/services/api/notifications';
import {
  Bell, Target, FileText, ShieldCheck, MessageSquare, DollarSign,
  TrendingUp, UserPlus, CheckCheck, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, typeof Bell> = {
  target: Target,
  'file-text': FileText,
  'shield-check': ShieldCheck,
  'message-square': MessageSquare,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'user-plus': UserPlus,
  'clipboard-list': FileText,
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    setLoading(true);
    notificationService.getAll(filter === 'unread')
      .then((res) => setNotifications(res.notifications))
      .catch(() => { toast.error('Failed to load notifications'); })
      .finally(() => setLoading(false));
  }, [filter]);

  const handleClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
      } catch {
        // silent
      }
    }
    if (notif.action_url) navigate(notif.action_url);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Bell className="w-6 h-6 text-teal-600" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Stay updated on your insurance activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="shield" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'unread' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> Unread
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here as activity happens'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const IconComponent = iconMap[notif.icon || ''] || Bell;
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-4 p-5 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  !notif.read ? 'bg-teal-50/40' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !notif.read ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{notif.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
