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
  HiOutlineEye,
  HiOutlineSearch,
  HiOutlineFilter
} from 'react-icons/hi';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/audit?limit=100');
        setLogs(data.data || []);
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
      <div className="card-pro p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-rose-500/80 font-medium">Compliance audit trails are restricted to system administrators.</p>
      </div>
    );
  }

  const getActionIcon = (action) => {
    if (action.includes('LOGIN')) return <HiOutlineLogin className="w-4 h-4 text-sky-500" />;
    if (action.includes('DELETED') || action.includes('DEACTIVATED')) return <HiOutlineTrash className="w-4 h-4 text-rose-500" />;
    if (action.includes('UPDATED')) return <HiOutlinePencilAlt className="w-4 h-4 text-amber-500" />;
    if (action.includes('SCAN') || action.includes('PLAGIARISM')) return <HiOutlineShieldCheck className="w-4 h-4 text-indigo-500" />;
    return <HiOutlineClipboardList className="w-4 h-4 text-emerald-500" />;
  };

  const filteredLogs = logs.filter(log => {
    const matchesQuery = !searchQuery || 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action?.toLowerCase().includes(selectedAction.toLowerCase());
    return matchesQuery && matchesAction;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-sm">
              <HiOutlineClipboardList className="w-6 h-6" />
            </div>
            Security & Compliance Audit Logs
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Immutable system audit trail tracking authentication, assignment mutations, and security events.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 font-medium text-sm">
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card-pro p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['all', 'login', 'scan', 'create', 'update', 'delete'].map((act) => (
            <button
              key={act}
              onClick={() => setSelectedAction(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                selectedAction === act
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search action, user, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 text-xs sm:text-sm outline-none"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="card-pro overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
              <thead className="bg-[var(--color-bg-secondary)] text-[10px] uppercase text-[var(--color-text-muted)] font-black tracking-widest border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-3.5">Action Event</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-[var(--color-text-secondary)] font-medium text-xs">
                      No matching audit events registered.
                    </td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="font-bold text-xs text-[var(--color-text-primary)]">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <div className="font-bold text-xs text-[var(--color-text-primary)]">{log.user.name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)]">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-medium">System Automated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--color-text-secondary)] font-medium">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] max-w-xs truncate font-mono">
                      {log.details || 'Event logged'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-sky-300"
                      >
                        <HiOutlineEye className="w-3.5 h-3.5" /> Inspect
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--color-border)]"
            >
              <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">Audit Event Details</h3>
                  <p className="text-xs text-slate-400">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--color-border)]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Action Code</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Actor</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System Daemon'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">IP Address</span>
                    <span className="font-mono text-slate-500">{selectedLog.ipAddress || '127.0.0.1'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Log Record ID</span>
                    <span className="font-mono text-slate-500">{selectedLog._id}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1">Payload / Event Metadata:</span>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-[var(--color-border)] flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogsPage;
