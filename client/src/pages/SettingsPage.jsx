import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { 
  HiOutlineCog,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineMail,
  HiOutlineCheckCircle,
  HiOutlineColorSwatch,
  HiOutlineTerminal,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineSave
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  plagiarismThreshold: 70,
  webPlagiarismCheck: true,
  astNormalization: true,
  autoEvaluateSubmissions: true,
  defaultTimeout: 10,
  defaultMemoryLimit: 256,
  networkIsolation: true,
  maxSubmissionsPerStudent: 5,
  emailNotifications: true,
  realtimeAlerts: true,
  defaultLanguage: 'python',
  animationSpeed: 'normal',
  codeFontFamily: 'Fira Code',
};

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('plagiarism');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('evalhub_system_settings');
      if (stored) {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="card-pro p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-rose-500/80 font-medium">Administrator privileges are required to configure global system parameters.</p>
      </div>
    );
  }

  const handleSave = () => {
    try {
      localStorage.setItem('evalhub_system_settings', JSON.stringify(settings));
      setSavedSuccess(true);
      toast.success('System settings saved successfully!');
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all system settings back to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('evalhub_system_settings', JSON.stringify(DEFAULT_SETTINGS));
      toast.success('Settings restored to factory defaults');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `evalhub_settings_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Configuration exported as JSON');
  };

  const tabs = [
    { id: 'plagiarism', label: 'Plagiarism Engine', icon: HiOutlineShieldCheck },
    { id: 'execution', label: 'Docker Sandbox', icon: HiOutlineTerminal },
    { id: 'preferences', label: 'Workspace & UI', icon: HiOutlineColorSwatch },
    { id: 'notifications', label: 'Notifications', icon: HiOutlineMail },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-sm">
              <HiOutlineCog className="w-6 h-6 animate-spin-slow" />
            </div>
            System Configuration
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Configure automated evaluation heuristics, Docker sandboxing, similarity thresholds, and UI behavior.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            title="Export settings JSON"
          >
            <HiOutlineDownload className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleReset}
            className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-rose-500"
            title="Reset to defaults"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-xs flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {savedSuccess ? <HiOutlineCheckCircle className="w-4 h-4 text-emerald-300" /> : <HiOutlineSave className="w-4 h-4" />}
            {savedSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative cursor-pointer shrink-0 ${
                isActive
                  ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-blue-950/40'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="settingsActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'plagiarism' && (
          <motion.div
            key="plagiarism"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card-pro p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-5 h-5 text-indigo-500" />
                  Similarity Threshold Tuning
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Submissions with similarity scores surpassing this threshold are flagged automatically for instructor review.
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-[var(--color-border)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    Flagging Threshold: <span className="text-blue-600 dark:text-sky-400 font-extrabold text-base">{settings.plagiarismThreshold}%</span>
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    settings.plagiarismThreshold > 75 
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                      : settings.plagiarismThreshold > 50
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {settings.plagiarismThreshold > 75 ? 'Strict Mode' : settings.plagiarismThreshold > 50 ? 'Standard' : 'Permissive'}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={settings.plagiarismThreshold}
                  onChange={(e) => setSettings({ ...settings, plagiarismThreshold: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>20% (High false positives)</span>
                  <span>50% (Recommended)</span>
                  <span>95% (Exact clones only)</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-500/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.astNormalization}
                    onChange={(e) => setSettings({ ...settings, astNormalization: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">AST & Token Normalization</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Strip comments, whitespaces, and normalize variable identifiers before Winnowing fingerprint calculation.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-500/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.webPlagiarismCheck}
                    onChange={(e) => setSettings({ ...settings, webPlagiarismCheck: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Public Web Plagiarism Search</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Enable searching public code repositories and GitHub gist endpoints for match candidates.</p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'execution' && (
          <motion.div
            key="execution"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card-pro p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <HiOutlineTerminal className="w-5 h-5 text-emerald-500" />
                  Docker Sandbox Isolation
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Configure limits applied to every containerized code compilation and execution run.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                    Default Execution Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={settings.defaultTimeout}
                    onChange={(e) => setSettings({ ...settings, defaultTimeout: Number(e.target.value) })}
                    className="input-field w-full px-4 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Prevents infinite loops or frozen student processes.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                    Default Memory Limit (MB)
                  </label>
                  <input
                    type="number"
                    min="64"
                    max="1024"
                    step="64"
                    value={settings.defaultMemoryLimit}
                    onChange={(e) => setSettings({ ...settings, defaultMemoryLimit: Number(e.target.value) })}
                    className="input-field w-full px-4 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Maximum RAM allocated per student test run.</p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/30 hover:border-emerald-500/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.autoEvaluateSubmissions}
                    onChange={(e) => setSettings({ ...settings, autoEvaluateSubmissions: e.target.checked })}
                    className="mt-1 w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Immediate Auto-Evaluation</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Automatically trigger Docker test runner as soon as a student submits code.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/30 hover:border-emerald-500/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.networkIsolation}
                    onChange={(e) => setSettings({ ...settings, networkIsolation: e.target.checked })}
                    className="mt-1 w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Network Isolation Flag (--network none)</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Denies outbound internet access from student code containers to prevent malicious calls.</p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card-pro p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <HiOutlineColorSwatch className="w-5 h-5 text-blue-500" />
                  Workspace & Editor Customization
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Adjust default language templates, typography, and animation fluidity.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                    Default Coding Language
                  </label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                    className="input-field w-full px-4 py-2.5 text-sm"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="c_cpp">C++ (GCC)</option>
                    <option value="java">Java 17 (OpenJDK)</option>
                    <option value="go">Go 1.21</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                    Interface Theme Mode
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => theme !== 'light' && toggleTheme()}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'light' 
                          ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      ☀️ Light Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => theme !== 'dark' && toggleTheme()}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        theme === 'dark' 
                          ? 'bg-blue-950/60 border-sky-400 text-sky-300 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      🌙 Dark Mode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card-pro p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <HiOutlineMail className="w-5 h-5 text-sky-500" />
                  Alerts & Dispatch Channels
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Manage real-time WebSocket events and automated email alerts.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/30 hover:border-sky-500/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="mt-1 w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Email Dispatch on High Similarity (&gt;75%)</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Send instant email notifications to course faculty whenever a suspicious submission is registered.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/30 hover:border-sky-500/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.realtimeAlerts}
                    onChange={(e) => setSettings({ ...settings, realtimeAlerts: e.target.checked })}
                    className="mt-1 w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Real-Time In-App Toasts & Sound</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Play subtle audio chime and trigger toast notifications for incoming review marks and peer comments.</p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
