import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { 
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineFilter
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'plagiarism':
        return <HiOutlineExclamationCircle className="w-5 h-5 text-rose-500" />;
      case 'assignment':
        return <HiOutlineInformationCircle className="w-5 h-5 text-blue-500" />;
      case 'evaluation':
        return <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <HiOutlineBell className="w-5 h-5 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <HiOutlineBell className="w-6 h-6" />
            </div>
            Notifications & System Alerts
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Real-time updates on assignment deadlines, plagiarism detections, and automated test verdicts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-[var(--color-border)] text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filter === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-2xs' : 'text-slate-400'}`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filter === 'unread' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-2xs' : 'text-slate-400'}`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer text-blue-600 dark:text-sky-400 font-bold"
            >
              <HiOutlineCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List Container */}
      <div className="card-pro overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 font-medium">
            <p>{error}</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center text-[var(--color-text-secondary)]">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <HiOutlineBell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-400">You're completely up to date with your workspace activities!</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            <AnimatePresence>
              {filteredList.map(notification => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 sm:p-5 flex gap-4 cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-transparent hover:bg-[var(--color-bg-hover)]' 
                      : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/30'
                  }`}
                  onClick={() => markAsRead(notification._id, notification.link)}
                >
                  <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 h-fit ${
                    notification.type === 'plagiarism' ? 'bg-rose-500/10' :
                    notification.type === 'assignment' ? 'bg-blue-500/10' :
                    notification.type === 'evaluation' ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <h4 className={`text-sm font-bold truncate ${notification.isRead ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${notification.isRead ? 'text-slate-400' : 'text-[var(--color-text-secondary)] font-medium'}`}>
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="flex items-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 animate-pulse" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
