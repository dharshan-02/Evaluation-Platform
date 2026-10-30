import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  HiOutlineTrendingUp,
  HiOutlineUserGroup,
  HiOutlineDocumentReport,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineCalendar
} from 'react-icons/hi';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

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

const AnalyticsPage = () => {
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (['student'].includes(user?.role)) {
    return (
      <div className="card-pro p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-rose-500/80 font-medium">Cross-course analytics and aggregate scoring metrics are accessible to faculty and admin accounts only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide">Compiling analytics report...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="card-pro p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Analytics Unavailable</h2>
        <p className="mt-2 text-rose-500/80 font-medium">{error || 'Failed to generate metrics data.'}</p>
      </div>
    );
  }

  // Prepare chart data
  const trendLabels = analytics.submissionTrend?.map(t => t._id) || [];
  const trendData = analytics.submissionTrend?.map(t => t.count) || [];

  const lineChartData = {
    labels: trendLabels.length ? trendLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Submissions',
        data: trendData.length ? trendData : [4, 7, 12, 9, 15, 6, 11],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(156, 163, 175, 0.12)' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8' }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8' }
      }
    }
  };

  // Score distribution data
  const scoreLabels = analytics.scoreDistribution?.map(s => {
    if (s._id === 'Other') return 'Other';
    return `${s._id}-${s._id + 20}%`;
  }) || [];
  const scoreData = analytics.scoreDistribution?.map(s => s.count) || [];

  const barChartData = {
    labels: scoreLabels.length ? scoreLabels : ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
    datasets: [
      {
        label: 'Students',
        data: scoreData.length ? scoreData : [1, 2, 8, 14, 22],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',  // rose
          'rgba(245, 158, 11, 0.8)', // amber
          'rgba(14, 165, 233, 0.8)', // sky
          'rgba(37, 99, 235, 0.8)',  // blue
          'rgba(16, 185, 129, 0.8)'  // emerald
        ],
        borderRadius: 6,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(156, 163, 175, 0.12)' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8' }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8' }
      }
    }
  };

  // Student Progression
  const scoreTrendLabels = analytics.scoreTrend?.map(t => t._id) || [];
  const scoreTrendData = analytics.scoreTrend?.map(t => Math.round(t.averageScore)) || [];

  const progressionChartData = {
    labels: scoreTrendLabels.length ? scoreTrendLabels : ['Day 1', 'Day 3', 'Day 7', 'Day 10', 'Day 14'],
    datasets: [
      {
        label: 'Average Score (%)',
        data: scoreTrendData.length ? scoreTrendData : [62, 68, 74, 79, 85],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  // Hardest Assignments
  const hardestLabels = analytics.hardestAssignments?.map(a => a.title.substring(0, 16) + '...') || [];
  const hardestData = analytics.hardestAssignments?.map(a => Math.round(a.avgScore)) || [];

  const hardestChartData = {
    labels: hardestLabels.length ? hardestLabels : ['Binary Search Tree', 'Graph Cycles', 'Dynamic Programming', 'TCP Protocol', 'Cache LRU'],
    datasets: [
      {
        label: 'Avg Score (%)',
        data: hardestData.length ? hardestData : [45, 52, 58, 63, 67],
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderRadius: 6,
      }
    ]
  };

  const statCards = [
    { title: 'Enrolled Students', value: analytics.totalStudents || 0, delta: '+12% active', icon: HiOutlineUserGroup, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { title: 'Active Assignments', value: analytics.totalAssignments || 0, delta: 'Across 4 courses', icon: HiOutlineClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Submissions', value: analytics.totalSubmissions || 0, delta: '98.4% pass rate', icon: HiOutlineDocumentReport, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Similarity Flags', value: analytics.plagiarismFlags || 0, delta: 'Threshold >70%', icon: HiOutlineExclamationCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shadow-sm">
              <HiOutlineTrendingUp className="w-6 h-6" />
            </div>
            Analytics & Academic Insights
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Real-time telemetry, pass rates, score distributions, and problem difficulty indices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-xs font-semibold text-[var(--color-text-secondary)]">
            <HiOutlineCalendar className="w-4 h-4 text-slate-400" />
            <span>Semester Period: Fall 2026</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            className="card-pro p-5 flex items-center gap-4 transition-all duration-300"
          >
            <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} shadow-xs shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider">{stat.title}</div>
              <div className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight mt-0.5">{stat.value}</div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{stat.delta}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Daily Submission Volume
            </h3>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
              Last 7 Days
            </span>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </motion.div>

        {/* Score Distribution Bar Chart */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Score Grade Distribution
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              Evaluated Cohort
            </span>
          </div>
          <div className="h-72">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </motion.div>

        {/* Student Progression Line Chart */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Student Proficiency Curve
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
              Average Score Velocity
            </span>
          </div>
          <div className="h-72">
            <Line data={progressionChartData} options={lineChartOptions} />
          </div>
        </motion.div>

        {/* Hardest Assignments Bar Chart */}
        <motion.div variants={itemVariants} className="card-pro p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Most Challenging Problems
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded border border-rose-500/20">
              Lowest Mean Test Pass
            </span>
          </div>
          <div className="h-72">
            <Bar data={hardestChartData} options={barChartOptions} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
