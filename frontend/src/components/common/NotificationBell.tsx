import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationApi } from '../../services/notificationApi';

interface Props { onClose: () => void; }

const typeColors: Record<string, string> = {
  review_assigned: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400',
  comment_reply: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  status_change: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  learning_recommended: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  achievement_unlocked: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
};

const getInitial = (type: string) => {
  switch (type) {
    case 'review_assigned': return 'R';
    case 'comment_reply': return 'C';
    case 'status_change': return 'S';
    case 'learning_recommended': return 'L';
    case 'achievement_unlocked': return 'A';
    default: return 'N';
  }
};

export const NotificationBell = ({ onClose }: Props) => {
  const { notifications, setNotifications, markAsRead, markAllAsRead, setUnreadCount } = useNotificationStore();

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try { const data = await notificationApi.getNotifications(); setNotifications(data.notifications); setUnreadCount(data.unreadCount); } catch {}
  };

  const handleMarkAsRead = async (id: string) => { try { await notificationApi.markAsRead(id); markAsRead(id); } catch {} };
  const handleMarkAllAsRead = async () => { try { await notificationApi.markAllAsRead(); markAllAsRead(); } catch {} };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-12 w-80 bg-white dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border shadow-dropdown z-50 overflow-hidden"
      >
        <div className="p-3.5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
          {notifications.some(n => !n.is_read) && (
            <button onClick={handleMarkAllAsRead} className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm"><p>No notifications yet</p></div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-500/[0.03]' : ''}`}>
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${typeColors[n.type] || 'bg-gray-100 text-gray-600 dark:bg-dark-card dark:text-gray-400'}`}>
                    {getInitial(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                    {n.content && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>}
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkAsRead(n.id)} className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" title="Mark as read" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
};
