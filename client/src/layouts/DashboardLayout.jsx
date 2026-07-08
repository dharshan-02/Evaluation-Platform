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
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';

const navItems = [
  { label: 'Dashboard', icon: HiOutlineHome, path: '/dashboard', roles: ['admin', 'faculty', 'student'] },
  { label: 'Assignments', icon: HiOutlineDocumentText, path: '/assignments', roles: ['admin', 'faculty', 'student'] },
  { label: 'Submissions', icon: HiOutlineCloudUpload, path: '/submissions', roles: ['admin', 'faculty', 'student'] },
  { label: 'Projects', icon: HiOutlineClipboardList, path: '/projects', roles: ['admin', 'faculty', 'student'] },
  { label: 'Playground', icon: HiOutlineTerminal, path: '/playground', roles: ['admin', 'faculty', 'student'] },
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
    <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
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
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col glass border-r border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shadow-xl lg:shadow-none`}
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
                  <span className="text-white font-bold text-sm">DV</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                  D's VIKA
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
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 border-l-4 border-indigo-500 z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 shrink-0 z-10 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
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

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
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
        <header className="relative z-10 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 glass border-b border-slate-200/50 dark:border-slate-800/50">
          
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {getGreeting()},
              </h2>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'User'}
              </h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-md ml-8 relative group">
              <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur transition-opacity duration-300 ${searchFocused ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'}`}></div>
              <div className="relative flex items-center w-full">
                <HiOutlineSearch className={`absolute left-3 w-5 h-5 transition-colors ${searchFocused ? 'text-indigo-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search assignments, students, or reports..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <div className="hidden">
               {/* Theme toggle disabled as per light mode requirement */}
            </div>

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <HiOutlineBell className="w-5 h-5 group-hover:text-indigo-500 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse" />
              )}
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-md flex items-center justify-center">
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500 uppercase">
                    {user?.name?.substring(0, 2) || 'UN'}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative z-10 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
