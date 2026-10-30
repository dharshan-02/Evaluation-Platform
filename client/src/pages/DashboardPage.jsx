import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineDownload,
  HiOutlinePlus,
  HiOutlineCode,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineLightningBolt
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api, { getBaseUrl } from '../lib/api';

// Stagger animation for cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/**
 * Stats Card component with glowing accent bar & hover depth
 */
const StatsCard = ({ icon: Icon, label, value, gradient, accentColor, onClick }) => (
  <motion.div
    variants={itemVariants}
    onClick={onClick}
    className="card-pro p-6 group cursor-pointer transition-all duration-300 relative overflow-hidden"
  >
    {/* Ambient Glow Orb */}
    <div 
      className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 group-hover:opacity-35 transition-opacity duration-500 group-hover:scale-125 pointer-events-none"
      style={{ background: accentColor }}
    />

    {/* Top accent line */}
    <div
      className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 group-hover:h-[3px] transition-all duration-300"
      style={{ background: gradient || accentColor }}
    />

    <div className="flex items-center justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
          {label}
        </p>
        <p className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
          {value}
        </p>
      </div>
      <div
        className="w-13 h-13 rounded-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 shadow-xs"
        style={{ background: 'var(--color-bg-hover)' }}
      >
        <Icon className="w-6 h-6 relative z-10 transition-colors" style={{ color: accentColor }} />
      </div>
    </div>
  </motion.div>
);

/**
 * Student Dashboard
 */
const StudentDashboard = ({ data }) => {
  const navigate = useNavigate();

  const handleDownloadTranscript = () => {
    window.open(`${getBaseUrl()}/api/users/me/report?token=${localStorage.getItem('token')}`, '_blank');
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Quick Action Banner */}
      <motion.div variants={itemVariants} className="card-pro p-6 sm:p-7 relative overflow-hidden bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 border-blue-500/20">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-sky-300 mb-2">
              <HiOutlineLightningBolt className="w-3.5 h-3.5" /> Fast Track
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight">
              Ready to code and submit your next solution?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 font-medium">
              Solve LeetCode-style assignments in Monaco Editor with live Docker test runs and AI hints.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/assignments')}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <HiOutlineCode className="w-4 h-4" />
              Start Coding
            </button>
            <button
              onClick={handleDownloadTranscript}
              className="btn-secondary flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <HiOutlineDownload className="w-4 h-4" />
              Transcript PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={HiOutlineDocumentText}
          label="Active Assignments"
          value={data?.stats?.activeAssignments || 0}
          accentColor="#2563EB"
          onClick={() => navigate('/assignments')}
        />
        <StatsCard
          icon={HiOutlineCloudUpload}
          label="My Submissions"
          value={data?.stats?.mySubmissions || 0}
          accentColor="#0EA5E9"
          onClick={() => navigate('/submissions')}
        />
        <StatsCard
          icon={HiOutlineCheckCircle}
          label="Evaluated"
          value={data?.stats?.evaluatedSubmissions || 0}
          accentColor="#10B981"
          onClick={() => navigate('/submissions?status=evaluated')}
        />
        <StatsCard
          icon={HiOutlineClock}
          label="Pending Execution"
          value={data?.stats?.pendingSubmissions || 0}
          accentColor="#F59E0B"
          onClick={() => navigate('/submissions?status=pending')}
        />
      </div>

      {/* Recent Submissions & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <HiOutlineCloudUpload className="w-5 h-5 text-blue-500" />
              Recent Submissions
            </h3>
            <button 
              onClick={() => navigate('/submissions')}
              className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {data?.recentSubmissions?.length > 0 ? data.recentSubmissions.map((item, i) => (
              <div
                key={i}
                onClick={() => navigate('/submissions')}
                className="group flex flex-col gap-2 p-3.5 rounded-xl transition-all duration-200 border border-[var(--color-border)] hover:border-blue-500/40 bg-[var(--color-bg-elevated)] cursor-pointer hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate pr-4">{item.name}</p>
                  <span className="text-sm font-bold text-blue-600 dark:text-sky-400 shrink-0">{item.score}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-emerald-500"></div>
                  <div className={`flex-1 h-1.5 rounded-full ${item.status === 'Evaluated' || item.status === 'Executing' ? (item.status === 'Evaluated' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse') : 'bg-[var(--color-border)]'}`}></div>
                  <div className={`flex-1 h-1.5 rounded-full ${item.status === 'Evaluated' ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}`}></div>
                </div>
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
                  <span>Submitted</span>
                  <span className="text-center">{item.status === 'Executing' ? 'Executing Tests...' : 'Reviewed'}</span>
                  <span className="text-right">Graded</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                No recent submissions found. Start an assignment to see evaluation milestones.
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-amber-500" />
              Upcoming Deadlines
            </h3>
            <button 
              onClick={() => navigate('/assignments')}
              className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Assignments <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {data?.upcomingDeadlines?.length > 0 ? data.upcomingDeadlines.map((item, i) => (
              <div
                key={i}
                onClick={() => navigate('/assignments')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] hover:border-blue-500/40 transition-all duration-200 bg-[var(--color-bg-elevated)] cursor-pointer hover:shadow-xs"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold truncate text-[var(--color-text-primary)]">{item.name}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    item.urgent 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)] border-[var(--color-border)]'
                  }`}
                >
                  {item.due}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                No upcoming deadlines on your radar. All caught up! 🎉
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Faculty Dashboard
 */
const FacultyDashboard = ({ data }) => {
  const navigate = useNavigate();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Quick Action Banner */}
      <motion.div variants={itemVariants} className="card-pro p-6 sm:p-7 relative overflow-hidden bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 border-blue-500/20">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-sky-300 mb-2">
              👨‍🏫 Faculty Control Center
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight">
              Course Assignments & Plagiarism Overview
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 font-medium">
              Create new coding challenges, monitor automated container results, and scan for similarity.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/assignments/new')}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              New Assignment
            </button>
            <button
              onClick={() => navigate('/plagiarism')}
              className="btn-secondary flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <HiOutlineShieldCheck className="w-4 h-4 text-indigo-500" />
              Plagiarism Scan
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={HiOutlineDocumentText}
          label="My Assignments"
          value={data?.stats?.myAssignments || 0}
          accentColor="#2563EB"
          onClick={() => navigate('/assignments')}
        />
        <StatsCard
          icon={HiOutlineCloudUpload}
          label="Total Submissions"
          value={data?.stats?.totalSubmissions || 0}
          accentColor="#0EA5E9"
          onClick={() => navigate('/submissions')}
        />
        <StatsCard
          icon={HiOutlineShieldCheck}
          label="Plagiarism Flags"
          value={data?.stats?.plagiarismFlags || 0}
          accentColor="#EF4444"
          onClick={() => navigate('/plagiarism')}
        />
        <StatsCard
          icon={HiOutlineCheckCircle}
          label="Evaluated"
          value={data?.stats?.evaluatedSubmissions || 0}
          accentColor="#10B981"
          onClick={() => navigate('/submissions?status=evaluated')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <HiOutlineCloudUpload className="w-5 h-5 text-blue-500" />
              Submissions Awaiting Review
            </h3>
            <button 
              onClick={() => navigate('/submissions')}
              className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {data?.pendingReviews?.length > 0 ? data.pendingReviews.map((item, i) => (
              <div
                key={i}
                onClick={() => navigate('/submissions')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] hover:border-blue-500/40 transition-all bg-[var(--color-bg-elevated)] cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.student}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.assignment}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-blue-800 uppercase">
                  {item.lang}
                </span>
              </div>
            )) : <p className="text-xs text-slate-400 py-6 text-center font-medium">All student submissions are up to date.</p>}
          </div>
        </motion.div>

        {/* Class Performance */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <HiOutlineChartBar className="w-5 h-5 text-emerald-500" />
              Class Performance (Averages)
            </h3>
            <button 
              onClick={() => navigate('/analytics')}
              className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Analytics <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            {data?.classPerformance?.length > 0 ? data.classPerformance.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5 font-medium">
                  <span className="truncate pr-2 text-[var(--color-text-primary)]">{item.name}</span>
                  <span className="font-bold text-[var(--color-text-primary)] shrink-0">{item.score}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: item.score,
                      background: parseInt(item.score) > 80 ? '#10B981' : parseInt(item.score) > 60 ? '#2563EB' : '#F59E0B'
                    }}
                  />
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 py-6 text-center font-medium">No assignment performance records to display.</p>}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Admin Dashboard
 */
const AdminDashboard = ({ data }) => {
  const navigate = useNavigate();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Quick Action Banner */}
      <motion.div variants={itemVariants} className="card-pro p-6 sm:p-7 relative overflow-hidden bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-sky-500/10 border-blue-500/20">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 mb-2">
              👑 Enterprise Administrator Console
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight">
              Platform Health & Compliance Operations
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 font-medium">
              Manage accounts, inspect security audit events, and configure Docker sandbox parameters.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/users')}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <HiOutlineUsers className="w-4 h-4" />
              Manage Users
            </button>
            <button
              onClick={() => navigate('/audit-logs')}
              className="btn-secondary flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <HiOutlineShieldCheck className="w-4 h-4 text-amber-500" />
              Audit Logs
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={HiOutlineUsers}
          label="Active Assignments"
          value={data?.stats?.activeAssignments || 0}
          accentColor="#2563EB"
          onClick={() => navigate('/assignments')}
        />
        <StatsCard
          icon={HiOutlineChartBar}
          label="Total Submissions"
          value={data?.stats?.totalSubmissions || 0}
          accentColor="#0EA5E9"
          onClick={() => navigate('/submissions')}
        />
        <StatsCard
          icon={HiOutlineAcademicCap}
          label="Evaluated"
          value={data?.stats?.evaluatedSubmissions || 0}
          accentColor="#10B981"
          onClick={() => navigate('/submissions?status=evaluated')}
        />
        <StatsCard
          icon={HiOutlineClock}
          label="Pending Sandbox Queue"
          value={data?.stats?.pendingSubmissions || 0}
          accentColor="#F59E0B"
          onClick={() => navigate('/submissions?status=pending')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Submissions */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <h3 className="text-base font-bold tracking-tight mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <HiOutlineCloudUpload className="w-5 h-5 text-blue-500" />
            Global Activity Feed
          </h3>
          <div className="space-y-3">
            {data?.recentSubmissions?.length > 0 ? data.recentSubmissions.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.student}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.name}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--color-text-primary)]">
                  {item.status}
                </span>
              </div>
            )) : <p className="text-xs text-slate-400 py-6 text-center font-medium">No recent submissions system-wide.</p>}
          </div>
        </motion.div>

        {/* Platform Deadlines */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <h3 className="text-base font-bold tracking-tight mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-amber-500" />
            Upcoming Platform Schedules
          </h3>
          <div className="space-y-3">
            {data?.upcomingDeadlines?.length > 0 ? data.upcomingDeadlines.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              >
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate pr-4">{item.name}</p>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)] shrink-0">
                  {item.due}
                </span>
              </div>
            )) : <p className="text-xs text-slate-400 py-6 text-center font-medium">No platform deadlines scheduled.</p>}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.on('dashboard:update', fetchDashboardData);
      return () => {
        socket.off('dashboard:update', fetchDashboardData);
      };
    }
  }, [socket]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header with live status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace Active
            </span>
          </div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-medium">
            Here's what's happening with your assignments, reviews, and test runs today.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide">Syncing workspace statistics...</p>
          </div>
        </div>
      ) : (
        <>
          {user?.role === 'student' && <StudentDashboard data={data} />}
          {user?.role === 'faculty' && <FacultyDashboard data={data} />}
          {user?.role === 'admin' && <AdminDashboard data={data} />}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
