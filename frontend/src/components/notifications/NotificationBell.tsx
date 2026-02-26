import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, type AppNotification } from '@/services/api/notifications';
import {
  Bell, Target, FileText, ShieldCheck, MessageSquare, DollarSign,
  TrendingUp, UserPlus, CheckCheck, X,
} from 'lucide-react';

const POLL_INTERVAL = 30000;

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
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll unread count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnreadCount(res.count);
      } catch {
        // silent
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationService.getAll()
      .then((res) => setNotifications(res.notifications))
      .catch(() => { /* non-critical: bell dropdown */ })
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = useCallback(async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }
    if (notif.action_url) {
      navigate(notif.action_url);
      setOpen(false);
    }
  }, [navigate]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-700 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 dark:border-slate-700/50">
            <h3 className="font-semibold text-slate-900 dark:text-white dark:text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 dark:text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const IconComponent = iconMap[notif.icon || ''] || Bell;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 ${
                      !notif.read ? 'bg-teal-50/50 dark:bg-teal-900/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      !notif.read ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:bg-slate-800 dark:text-slate-500 dark:text-slate-400'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900 dark:text-white dark:text-white' : 'text-slate-700 dark:text-slate-200 dark:text-slate-300'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 truncate mt-0.5">{notif.body}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700/50 dark:border-slate-700/50 p-2">
              <button
                onClick={() => { navigate('/notifications'); setOpen(false); }}
                className="w-full py-2 text-center text-sm font-medium text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
