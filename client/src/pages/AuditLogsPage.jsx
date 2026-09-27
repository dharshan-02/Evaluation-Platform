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
      <div className="glass-panel p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
        <p className="mt-2 text-rose-500/80 font-medium">You do not have permission to view this page. Admin access required.</p>
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <HiOutlineClipboardList className="w-8 h-8 text-indigo-500" />
            Audit Logs
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            System-wide activity log for security and compliance monitoring.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 font-medium">
          {error}
        </div>
      )}

      <div className="glass-panel p-6 shadow-xs">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
              <thead className="bg-[var(--color-bg-secondary)] text-[10px] uppercase text-[var(--color-text-muted)] font-black tracking-widest border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-[var(--color-text-secondary)] font-medium">No logs found.</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                        {getActionIcon(log.action)}
                      </div>
                      <span className="font-bold text-[var(--color-text-primary)]">{log.action.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <>
                          <div className="font-bold text-[var(--color-text-primary)]">{log.user.name}</div>
                          <div className="text-xs font-medium text-[var(--color-text-muted)] mt-0.5">{log.user.email}</div>
                        </>
                      ) : (
                        <span className="text-[var(--color-text-muted)] italic font-medium">System / Unauthenticated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-text-secondary)]">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] font-medium max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-bg-primary)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">
                      {selectedLog.action}
                    </h2>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-0.5">
                      {format(new Date(selectedLog.timestamp), 'PPpp')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] rounded-xl transition-colors"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">User / Actor</p>
                    <p className="font-bold text-[var(--color-text-primary)]">{selectedLog.user ? selectedLog.user.name : 'Unknown'}</p>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-0.5">{selectedLog.user ? selectedLog.user.email : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Network & Client</p>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]"><span className="font-bold text-[var(--color-text-primary)]">IP:</span> {selectedLog.ipAddress || 'Unknown'}</p>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] truncate mt-1" title={selectedLog.userAgent}>{selectedLog.userAgent || 'Unknown Agent'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Action Description</h3>
                  <p className="text-[var(--color-text-secondary)] font-medium text-sm">{selectedLog.details}</p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Metadata Payload</h3>
                  <div className="bg-[#111111] p-4 rounded-xl border border-[var(--color-border)] overflow-x-auto shadow-inner">
                    <pre className="text-xs text-emerald-400 font-mono">
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
