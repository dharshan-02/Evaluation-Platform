import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { 
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineCheck
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'plagiarism':
        return <HiOutlineExclamationCircle className="w-6 h-6 text-rose-500" />;
      case 'assignment':
        return <HiOutlineInformationCircle className="w-6 h-6 text-indigo-500" />;
      case 'evaluation':
        return <HiOutlineCheckCircle className="w-6 h-6 text-emerald-500" />;
      default:
        return <HiOutlineBell className="w-6 h-6 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineBell className="w-6 h-6 text-indigo-500" />
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated on assignment deadlines, plagiarism alerts, and evaluation results.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
          >
            <HiOutlineCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HiOutlineBell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No notifications yet</h3>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
            <AnimatePresence>
              {notifications.map(notification => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 flex gap-4 cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30' 
                      : 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}
                  onClick={() => markAsRead(notification._id, notification.link)}
                >
                  <div className={`mt-1 p-2 rounded-full ${
                    notification.type === 'plagiarism' ? 'bg-rose-500/10' :
                    notification.type === 'assignment' ? 'bg-indigo-500/10' :
                    notification.type === 'evaluation' ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-bold ${notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm ${notification.isRead ? 'text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
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
