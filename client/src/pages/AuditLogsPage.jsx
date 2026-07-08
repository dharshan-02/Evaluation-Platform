import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
  HiOutlineLogin,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineShieldCheck,
  HiX,
  HiOutlineEye
} from 'react-icons/hi';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/audit?limit=100');
        setLogs(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="glass p-8 text-center text-rose-500 rounded-2xl max-w-2xl mx-auto mt-10">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page. Admin access required.</p>
      </div>
    );
  }

  const getActionIcon = (action) => {
    if (action.includes('LOGIN')) return <HiOutlineLogin className="w-5 h-5 text-sky-500" />;
    if (action.includes('DELETED') || action.includes('DEACTIVATED')) return <HiOutlineTrash className="w-5 h-5 text-rose-500" />;
    if (action.includes('UPDATED')) return <HiOutlinePencilAlt className="w-5 h-5 text-amber-500" />;
    if (action.includes('SCAN') || action.includes('PLAGIARISM')) return <HiOutlineShieldCheck className="w-5 h-5 text-indigo-500" />;
    return <HiOutlineClipboardList className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineClipboardList className="w-6 h-6 text-indigo-500" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System-wide activity log for security and compliance monitoring.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-slate-500">No logs found.</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {getActionIcon(log.action)}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{log.user.name}</div>
                          <div className="text-xs text-slate-500">{log.user.email}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">System / Unauthenticated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                      >
                        <HiOutlineEye className="w-4 h-4" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Modal View */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedLog.action}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {format(new Date(selectedLog.timestamp), 'PPpp')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">User / Actor</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedLog.user ? selectedLog.user.name : 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{selectedLog.user ? selectedLog.user.email : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Network & Client</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold text-slate-900 dark:text-white">IP:</span> {selectedLog.ipAddress || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate mt-1" title={selectedLog.userAgent}>{selectedLog.userAgent || 'Unknown Agent'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Action Description</h3>
                  <p className="text-slate-600 dark:text-slate-400">{selectedLog.details}</p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Metadata Payload</h3>
                  <div className="bg-[#1e1e1e] p-4 rounded-xl overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogsPage;
