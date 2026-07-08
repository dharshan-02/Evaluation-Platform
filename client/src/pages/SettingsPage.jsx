import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  HiOutlineCog,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineMail
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({
    plagiarismThreshold: 75,
    autoEvaluateSubmissions: true,
    emailNotifications: true,
    maxSubmissionsPerStudent: 3,
  });

  if (user?.role !== 'admin') {
    return (
      <div className="glass p-8 text-center text-rose-500 rounded-2xl max-w-2xl mx-auto mt-10">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page. Admin access required.</p>
      </div>
    );
  }

  const handleSave = () => {
    // Mock save functionality
    toast.success('System settings updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineCog className="w-6 h-6 text-indigo-500" />
            System Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure global platform behavior and defaults. (Mock UI)
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Plagiarism Settings */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <HiOutlineShieldCheck className="w-5 h-5 text-indigo-500" />
            Plagiarism Engine Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Global Similarity Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.plagiarismThreshold}
                onChange={(e) => setSettings({ ...settings, plagiarismThreshold: e.target.value })}
                className="w-full sm:w-1/3 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="text-xs text-slate-500 mt-1">
                Assignments exceeding this similarity percentage will be automatically flagged for faculty review.
              </p>
            </div>
          </div>
        </div>

        {/* Evaluation Settings */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <HiOutlineDatabase className="w-5 h-5 text-emerald-500" />
            Execution & Evaluation Defaults
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoEvaluateSubmissions}
                onChange={(e) => setSettings({ ...settings, autoEvaluateSubmissions: e.target.checked })}
                className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Auto-Evaluate Code Submissions</div>
                <div className="text-xs text-slate-500">Automatically run Docker containers for test cases immediately upon student submission.</div>
              </div>
            </label>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Allowed Submissions Per Assignment
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxSubmissionsPerStudent}
                onChange={(e) => setSettings({ ...settings, maxSubmissionsPerStudent: e.target.value })}
                className="w-full sm:w-1/3 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <HiOutlineMail className="w-5 h-5 text-sky-500" />
            System Notifications
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Enable Email Alerts</div>
                <div className="text-xs text-slate-500">Send email summaries for plagiarism alerts and system health.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
