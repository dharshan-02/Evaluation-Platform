import { useState, useEffect } from 'react';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  HiOutlineTrendingUp,
  HiOutlineUserGroup,
  HiOutlineDocumentReport,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle
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

const AnalyticsPage = () => {
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="glass p-8 text-center text-rose-500 rounded-2xl max-w-2xl mx-auto mt-10">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="glass p-8 text-center text-rose-500 rounded-2xl max-w-2xl mx-auto mt-10">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error || 'Failed to load analytics.'}</p>
      </div>
    );
  }

  // Prepare chart data
  const trendLabels = analytics.submissionTrend?.map(t => t._id) || [];
  const trendData = analytics.submissionTrend?.map(t => t.count) || [];

  const lineChartData = {
    labels: trendLabels.length ? trendLabels : ['No Data'],
    datasets: [
      {
        label: 'Submissions',
        data: trendData.length ? trendData : [0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.1)' } },
      x: { grid: { display: false } }
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
        data: scoreData.length ? scoreData : [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(244, 63, 94, 0.7)', // rose
          'rgba(245, 158, 11, 0.7)', // amber
          'rgba(16, 185, 129, 0.7)', // emerald
          'rgba(56, 189, 248, 0.7)', // sky
          'rgba(99, 102, 241, 0.7)'  // indigo
        ],
        borderRadius: 4,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.1)' } },
      x: { grid: { display: false } }
    }
  };

  // Student Progression (Score Trend)
  const scoreTrendLabels = analytics.scoreTrend?.map(t => t._id) || [];
  const scoreTrendData = analytics.scoreTrend?.map(t => Math.round(t.averageScore)) || [];

  const progressionChartData = {
    labels: scoreTrendLabels.length ? scoreTrendLabels : ['No Data'],
    datasets: [
      {
        label: 'Avg Class Score (%)',
        data: scoreTrendData.length ? scoreTrendData : [0],
        borderColor: '#10b981', // emerald
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Hardest Assignments Bar Chart
  const hardestLabels = analytics.hardestAssignments?.map(a => a.title.substring(0, 15) + '...') || [];
  const hardestData = analytics.hardestAssignments?.map(a => Math.round(a.avgScore)) || [];

  const hardestChartData = {
    labels: hardestLabels.length ? hardestLabels : ['No Data'],
    datasets: [
      {
        label: 'Avg Score (%)',
        data: hardestData.length ? hardestData : [0],
        backgroundColor: 'rgba(244, 63, 94, 0.7)', // rose
        borderRadius: 4,
      }
    ]
  };

  const statCards = [
    { title: 'Total Students', value: analytics.totalStudents, icon: HiOutlineUserGroup, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { title: 'Assignments', value: analytics.totalAssignments, icon: HiOutlineClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Total Submissions', value: analytics.totalSubmissions, icon: HiOutlineDocumentReport, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Plagiarism Flags', value: analytics.plagiarismFlags, icon: HiOutlineExclamationCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HiOutlineTrendingUp className="w-6 h-6 text-indigo-500" />
          Analytics Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          System overview and performance metrics across all courses.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.title}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3">
            Submissions (Last 7 Days)
          </h3>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Score Distribution Bar Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3">
            Score Distribution (Evaluated)
          </h3>
          <div className="h-72">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Student Progression Line Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3 flex items-center justify-between">
            <span>Student Progression</span>
            <span className="text-xs font-medium px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">Avg Score over 14 Days</span>
          </h3>
          <div className="h-72">
            <Line data={progressionChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Hardest Assignments Bar Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3 flex items-center justify-between">
            <span>Hardest Assignments</span>
            <span className="text-xs font-medium px-2 py-1 bg-rose-500/10 text-rose-500 rounded-full">Lowest Avg Scores</span>
          </h3>
          <div className="h-72">
            <Bar data={hardestChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
