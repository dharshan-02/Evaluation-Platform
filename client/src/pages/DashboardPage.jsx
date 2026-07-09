import { useState, useEffect } from 'react';
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
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api, { getBaseUrl } from '../lib/api';

// Stagger animation for cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * Stats Card component with gradient accent bar
 */
const StatsCard = ({ icon: Icon, label, value, gradient, accentColor }) => (
  <motion.div
    variants={itemVariants}
    className="relative overflow-hidden rounded-2xl p-5 glass group transition-all duration-300"
    whileHover={{ y: -4, scale: 1.02 }}
  >
    {/* Gradient accent bar */}
    <div
      className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-70 group-hover:opacity-100 transition-opacity"
      style={{ background: gradient }}
    />
    
    {/* Ambient Glow */}
    <div 
      className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
      style={{ background: gradient }}
    />

    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20" style={{ background: accentColor }}></div>
        <Icon className="w-6 h-6 relative z-10" style={{ color: accentColor }} />
      </div>
    </div>
  </motion.div>
);

/**
 * Student Dashboard
 */
const StudentDashboard = ({ data }) => {
  const handleDownloadTranscript = () => {
    // Open the PDF download endpoint in a new tab or trigger download
    window.open(`${getBaseUrl()}/api/users/me/report?token=${localStorage.getItem('token')}`, '_blank');
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineAcademicCap className="w-6 h-6 text-indigo-500" />
            My Progress
          </h2>
        </div>
        <button
          onClick={handleDownloadTranscript}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
        >
          <HiOutlineDownload className="w-5 h-5" />
          Download Transcript
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
        icon={HiOutlineDocumentText}
        label="Active Assignments"
        value={data?.stats?.activeAssignments || 0}
        gradient="var(--gradient-brand)"
        accentColor="var(--color-brand)"
      />
      <StatsCard
        icon={HiOutlineCloudUpload}
        label="My Submissions"
        value={data?.stats?.mySubmissions || 0}
        gradient="var(--gradient-cyan)"
        accentColor="var(--color-cyan)"
      />
      <StatsCard
        icon={HiOutlineCheckCircle}
        label="Evaluated"
        value={data?.stats?.evaluatedSubmissions || 0}
        gradient="var(--gradient-success)"
        accentColor="var(--color-emerald)"
      />
      <StatsCard
        icon={HiOutlineClock}
        label="Pending"
        value={data?.stats?.pendingSubmissions || 0}
        gradient="var(--gradient-warm)"
        accentColor="var(--color-amber)"
      />
    </div>

    {/* Recent Activity + Upcoming Deadlines */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Submissions */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Recent Submissions
        </h3>
        <div className="space-y-3">
          {data?.recentSubmissions?.length > 0 ? data.recentSubmissions.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate pr-4">{item.name}</p>
                <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{item.score}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {/* Step 1: Submitted */}
                <div className="flex-1 h-1.5 rounded-full bg-emerald-500"></div>
                {/* Step 2: Executing/Pending */}
                <div className={`flex-1 h-1.5 rounded-full ${item.status === 'Evaluated' || item.status === 'Executing' ? (item.status === 'Evaluated' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse') : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                {/* Step 3: Evaluated */}
                <div className={`flex-1 h-1.5 rounded-full ${item.status === 'Evaluated' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                <span>Submitted</span>
                <span className="text-center">Reviewing</span>
                <span className="text-right">Graded</span>
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">No recent submissions found.</p>}
        </div>
      </motion.div>

      {/* Upcoming Deadlines */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {data?.upcomingDeadlines?.length > 0 ? data.upcomingDeadlines.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: item.urgent ? 'var(--color-rose-bg)' : 'var(--color-bg-hover)',
                  color: item.urgent ? 'var(--color-rose)' : 'var(--color-text-secondary)',
                }}
              >
                {item.due}
              </span>
            </div>
          )) : <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
        </div>
      </motion.div>
    </div>
  </motion.div>
  );
};

/**
 * Faculty Dashboard
 */
const FacultyDashboard = ({ data }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        icon={HiOutlineDocumentText}
        label="My Assignments"
        value={data?.stats?.myAssignments || 0}
        gradient="var(--gradient-brand)"
        accentColor="var(--color-brand)"
      />
      <StatsCard
        icon={HiOutlineCloudUpload}
        label="Total Submissions"
        value={data?.stats?.totalSubmissions || 0}
        gradient="var(--gradient-cyan)"
        accentColor="var(--color-cyan)"
      />
      <StatsCard
        icon={HiOutlineShieldCheck}
        label="Plagiarism Flags"
        value={data?.stats?.plagiarismFlags || 0}
        gradient="var(--gradient-danger)"
        accentColor="var(--color-rose)"
      />
      <StatsCard
        icon={HiOutlineCheckCircle}
        label="Evaluated"
        value={data?.stats?.evaluatedSubmissions || 0}
        gradient="var(--gradient-success)"
        accentColor="var(--color-emerald)"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Reviews */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Recent Submissions
        </h3>
        <div className="space-y-3">
          {data?.pendingReviews?.length > 0 ? data.pendingReviews.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.student}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.assignment}</p>
              </div>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-brand-bg)', color: 'var(--color-brand)' }}
              >
                {item.lang}
              </span>
            </div>
          )) : <p className="text-sm text-slate-500">No pending reviews found.</p>}
        </div>
      </motion.div>

      {/* Class Performance */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Class Performance (Avg)
        </h3>
        <div className="space-y-4">
          {data?.classPerformance?.length > 0 ? data.classPerformance.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.name}</span>
                <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.score}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-hover)' }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: item.score,
                    background: parseInt(item.score) > 80 ? 'var(--gradient-success)' : parseInt(item.score) > 60 ? 'var(--gradient-brand)' : 'var(--gradient-warm)'
                  }}
                />
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">No active assignments to measure.</p>}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

/**
 * Admin Dashboard
 */
const AdminDashboard = ({ data }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        icon={HiOutlineUsers}
        label="Active Assignments"
        value={data?.stats?.activeAssignments || 0}
        gradient="var(--gradient-brand)"
        accentColor="var(--color-brand)"
      />
      <StatsCard
        icon={HiOutlineChartBar}
        label="Total Submissions"
        value={data?.stats?.totalSubmissions || 0}
        gradient="var(--gradient-cyan)"
        accentColor="var(--color-cyan)"
      />
      <StatsCard
        icon={HiOutlineAcademicCap}
        label="Evaluated"
        value={data?.stats?.evaluatedSubmissions || 0}
        gradient="var(--gradient-success)"
        accentColor="var(--color-emerald)"
      />
      <StatsCard
        icon={HiOutlineClock}
        label="Pending Execution"
        value={data?.stats?.pendingSubmissions || 0}
        gradient="var(--gradient-warm)"
        accentColor="var(--color-amber)"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Health / Recent Submissions */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Recent Global Submissions
        </h3>
        <div className="space-y-3">
          {data?.recentSubmissions?.length > 0 ? data.recentSubmissions.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl transition-colors duration-200"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.student}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.name}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: item.color }}>{item.status}</span>
            </div>
          )) : <p className="text-sm text-slate-500">No submissions found system-wide.</p>}
        </div>
      </motion.div>

      {/* Upcoming Deadlines */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Upcoming Platform Deadlines
        </h3>
        <div className="space-y-3">
          {data?.upcomingDeadlines?.length > 0 ? data.upcomingDeadlines.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: item.urgent ? 'var(--color-rose-bg)' : 'var(--color-bg-hover)',
                  color: item.urgent ? 'var(--color-rose)' : 'var(--color-text-secondary)',
                }}
              >
                {item.due}
              </span>
            </div>
          )) : <p className="text-sm text-slate-500">No upcoming deadlines platform-wide.</p>}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

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

    // Listen for realtime updates from backend
    if (socket) {
      socket.on('dashboard:update', fetchDashboardData);

      return () => {
        socket.off('dashboard:update', fetchDashboardData);
      };
    }
  }, [socket]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Here's what's happening with your projects today.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
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
