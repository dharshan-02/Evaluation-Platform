import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineCloudUpload,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineDocumentReport,
  HiOutlineUsers,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineSearch,
  HiOutlineTerminal,
  HiOutlineStar,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';
import AITutorWidget from '../components/AITutorWidget';

const navItems = [
  { label: 'Dashboard', icon: HiOutlineHome, path: '/dashboard', roles: ['admin', 'faculty', 'student'] },
  { label: 'Assignments', icon: HiOutlineDocumentText, path: '/assignments', roles: ['faculty', 'student'] },
  { label: 'Submissions', icon: HiOutlineCloudUpload, path: '/submissions', roles: ['faculty', 'student'] },
  { label: 'Projects', icon: HiOutlineClipboardList, path: '/projects', roles: ['faculty', 'student'] },
  { label: 'Collaboration', icon: HiOutlineUserGroup, path: '/collaboration', roles: ['admin', 'faculty', 'student'] },
  { label: 'Plagiarism', icon: HiOutlineShieldCheck, path: '/plagiarism', roles: ['admin', 'faculty'] },
  { label: 'Analytics', icon: HiOutlineChartBar, path: '/analytics', roles: ['admin', 'faculty'] },
  { label: 'Reports', icon: HiOutlineDocumentReport, path: '/reports', roles: ['admin', 'faculty', 'student'] },
  { label: 'Notifications', icon: HiOutlineBell, path: '/notifications', roles: ['admin', 'faculty', 'student'] },
  { label: 'Users', icon: HiOutlineUsers, path: '/users', roles: ['admin'] },
  { label: 'Audit Logs', icon: HiOutlineClipboardList, path: '/audit-logs', roles: ['admin'] },
  { label: 'Settings', icon: HiOutlineCog, path: '/settings', roles: ['admin'] },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  const socket = useSocket();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchUnread();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for real-time notifications
    socket.on('notification:new', (notif) => {
      setUnreadCount(prev => prev + 1);
      // Optional: We could pop up a toast here
    });

    socket.on('plagiarism:detected', (data) => {
      // Refresh count just in case
      api.get('/notifications')
        .then(res => setUnreadCount(res.data.notifications.filter(n => !n.isRead).length))
        .catch(console.error);
    });

    return () => {
      socket.off('notification:new');
      socket.off('plagiarism:detected');
    };
  }, [socket]);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex h-screen overflow-hidden text-[var(--color-text-primary)] transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 260 : 72,
          x: mobileSidebarOpen ? 0 : (window.innerWidth < 1024 ? -260 : 0)
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col glass-panel lg:rounded-none lg:border-y-0 lg:border-l-0 lg:shadow-none backdrop-blur-xl shadow-xl transition-all duration-300`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 14px -4px var(--color-brand)' }}>
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] group-hover:text-indigo-500 transition-colors">
                  D's
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden ${
                  isActive 
                    ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs font-semibold' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-blue-600 dark:hover:text-sky-300'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 border-l-2 border-blue-600 dark:border-sky-400 z-0 bg-blue-50/50 dark:bg-blue-900/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 shrink-0 z-10 transition-colors ${isActive ? 'text-blue-600 dark:text-sky-400' : ''}`} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap font-medium z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group"
          >
            <HiOutlineLogout className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="relative z-10 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 glass-panel rounded-none border-x-0 border-t-0 shadow-xs">
          
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {getGreeting()},
              </h2>
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">
                {user?.name || 'User'}
              </h1>
            </div>

            {/* Command Palette Trigger */}
            <div className="hidden md:flex flex-1 max-w-md ml-8">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:border-blue-500/50 dark:hover:border-sky-400/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <HiOutlineSearch className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-sky-400 transition-colors" />
                  <span className="font-medium text-slate-500 dark:text-slate-400">Search commands, pages, actions...</span>
                </div>
                <kbd className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span>⌘</span><span>K</span>
                </kbd>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <HiOutlineSun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <HiOutlineMoon className="w-5 h-5 text-blue-600 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
              title="Notifications"
            >
              <HiOutlineBell className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse" />
              )}
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-all cursor-pointer group"
            >
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center shadow-xs font-semibold">
                <span className="text-xs font-bold uppercase tracking-tight">
                  {user?.name?.substring(0, 2) || 'UN'}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-none group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">{user?.name?.split(' ')[0]}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] capitalize mt-0.5">{user?.role}</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative z-10 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 1.01 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating AI Tutor Assistant across workspace */}
        <AITutorWidget />
      </main>
    </div>
  );
};

export default DashboardLayout;
