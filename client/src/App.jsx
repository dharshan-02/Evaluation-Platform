import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { motion } from 'framer-motion';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginPage from './pages/LoginPage';


// Dashboard
import DashboardPage from './pages/DashboardPage';
import PlaygroundPage from './pages/PlaygroundPage';
import LeaderboardPage from './pages/LeaderboardPage';

// Assignment Pages
import AssignmentsPage from './pages/AssignmentsPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import AssignmentDetailsPage from './pages/AssignmentDetailsPage';

// Submission Pages
import SubmissionsPage from './pages/SubmissionsPage';
import SubmissionDetailsPage from './pages/SubmissionDetailsPage';

// Project Pages
import ProjectsPage from './pages/ProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import CollaborationPage from './pages/CollaborationPage';
import CollaborationHubPage from './pages/CollaborationHubPage';

// Plagiarism & Analytics
import PlagiarismPage from './pages/PlagiarismPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';

import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

import CommandPalette from './components/CommandPalette';

// Placeholder pages (will be replaced incrementally)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2">Coming soon...</p>
    </div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // The root App component will handle the loading screen
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  // Theme is handled by ThemeProvider in main.jsx

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-[#fffcfb] overflow-hidden"
      >
        <div className="relative flex flex-col items-center justify-center">

          {/* Clean Brand Glows */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-64 h-64 rounded-full blur-[80px]"
            style={{ backgroundColor: 'var(--color-brand)' }}
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-72 h-72 rounded-full blur-[100px]"
            style={{ backgroundColor: 'var(--color-brand-light)' }}
          />

          {/* Core Logo Container */}
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 w-24 h-24 mb-6 rounded-3xl p-[2px] shadow-[0_10px_40px_-10px_var(--color-brand)]"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-transparent bg-clip-text font-black text-4xl"
                style={{ backgroundImage: 'var(--gradient-brand)' }}
              >
                D
              </motion.span>
            </div>
          </motion.div>

          {/* Cinematic Title Reveal */}
          <div className="overflow-hidden mb-8 flex flex-col items-center">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              className="text-3xl font-black tracking-tight text-slate-900"
            >
              D's
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 1, ease: "easeOut" }}
              className="text-slate-500 mt-1 tracking-widest font-medium uppercase text-sm"
            >
              Evaluation Platform
            </motion.p>
          </div>

          {/* Minimalist Progress Line */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "200px", opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
            className="h-[2px] relative overflow-hidden"
            style={{ background: 'linear-gradient(to right, transparent, var(--color-brand), transparent)' }}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-white/50 w-1/3 blur-sm"
            />
          </motion.div>

          {/* Status Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="mt-6 text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--color-brand)' }}
          >
            Loading Workspace
          </motion.p>

        </div>
      </motion.div>
    );
  }

  return (
    <div className="mesh-bg text-slate-900 dark:text-slate-100 min-h-screen">
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />

        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Assignment Routes */}
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/new" element={
            <ProtectedRoute roles={['admin', 'faculty']}>
              <CreateAssignmentPage />
            </ProtectedRoute>
          } />
          <Route path="assignments/:id" element={<AssignmentDetailsPage />} />

          {/* Submission Routes */}
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="submissions/:id" element={<SubmissionDetailsPage />} />

          {/* Project Routes */}
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={
            <ProtectedRoute roles={['admin', 'faculty', 'student']}>
              <CreateProjectPage />
            </ProtectedRoute>
          } />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="projects/:id/collaborate" element={
            <ProtectedRoute roles={['admin', 'faculty', 'student']}>
              <CollaborationPage />
            </ProtectedRoute>
          } />

          {/* Ad-Hoc Collaboration Hub */}
          <Route path="collaboration" element={
            <ProtectedRoute roles={['admin', 'faculty', 'student']}>
              <CollaborationHubPage />
            </ProtectedRoute>
          } />
          <Route path="collaboration/:id" element={
            <ProtectedRoute roles={['admin', 'faculty', 'student']}>
              <CollaborationPage />
            </ProtectedRoute>
          } />

          {/* Plagiarism & Analytics Routes */}
          <Route path="plagiarism" element={
            <ProtectedRoute roles={['admin', 'faculty']}>
              <PlagiarismPage />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute roles={['admin', 'faculty']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute roles={['admin', 'faculty', 'student']}>
              <ReportsPage />
            </ProtectedRoute>
          } />

          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Admin Routes */}
          <Route path="users" element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute roles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="audit-logs" element={
            <ProtectedRoute roles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {user && <CommandPalette />}
    </div>
  );
}

export default App;
