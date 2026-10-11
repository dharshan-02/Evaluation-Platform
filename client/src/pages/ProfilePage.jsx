import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineCamera,
  HiOutlineFire,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineCloudUpload,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineLink,
  HiOutlineExternalLink,
  HiOutlineBadgeCheck
} from 'react-icons/hi';
import { FaGithub, FaLinkedin, FaGlobe } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } },
};

const StatCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => (
  <motion.div 
    variants={itemVariants}
    className="rounded-2xl bg-white dark:bg-slate-900/80 p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${gradient} blur-3xl rounded-full opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none`} />
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1 mt-0.5">
          {value || 0}
        </div>
      </div>
    </div>
  </motion.div>
);

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    department: user?.department || '',
    githubUrl: user?.githubUrl || '',
    linkedinUrl: user?.linkedinUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');

  const [loading, setLoading] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setDashboardStats(res.data.stats);
      } catch (err) {
        console.error('Failed to load stats for profile:', err);
      }
    };
    const fetchSubmissions = async () => {
      try {
        const res = await api.get('/submissions');
        if (res.data?.submissions) {
          setSubmissions(res.data.submissions);
        }
      } catch (err) {
        // Non-blocking
      }
    };
    if (user) {
      fetchStats();
      fetchSubmissions();
    }
  }, [user]);

  // Aggregate user activity dates and submissions into a daily activity map
  const activityMap = useMemo(() => {
    const map = {};
    if (Array.isArray(user?.activityDates)) {
      user.activityDates.forEach(d => {
        if (d) {
          const dateStr = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
          map[dateStr] = (map[dateStr] || 0) + 1;
        }
      });
    }
    if (Array.isArray(submissions)) {
      submissions.forEach(sub => {
        const d = sub.createdAt || sub.submittedAt;
        if (d) {
          const dateStr = new Date(d).toISOString().split('T')[0];
          map[dateStr] = (map[dateStr] || 0) + 1;
        }
      });
    }
    // Always mark current session as active
    const todayStr = new Date().toISOString().split('T')[0];
    if (!map[todayStr]) {
      map[todayStr] = 1;
    }
    return map;
  }, [user?.activityDates, submissions]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('githubUrl', formData.githubUrl);
      submitData.append('linkedinUrl', formData.linkedinUrl);
      submitData.append('portfolioUrl', formData.portfolioUrl);
      
      if (avatarFile) {
        submitData.append('avatar', avatarFile);
      }

      if (user?.role === 'student') {
        submitData.append('studentId', formData.studentId);
      }

      await updateProfile(submitData);
      toast.success('Profile updated successfully!', {
        icon: '✨',
        style: {
          borderRadius: '12px',
          background: '#0F172A',
          color: '#F8FAFC',
          border: '1px solid #1E293B',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const roleConfigs = {
    admin: {
      label: 'Administrator',
      coverGradient: 'from-blue-700 via-indigo-600 to-purple-600',
      badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
      avatarGradient: 'from-purple-600 to-indigo-600'
    },
    faculty: {
      label: 'Faculty Member',
      coverGradient: 'from-blue-700 via-teal-600 to-emerald-600',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
      avatarGradient: 'from-teal-600 to-emerald-600'
    },
    student: {
      label: 'Student',
      coverGradient: 'from-blue-800 via-blue-600 to-sky-500',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-sky-300 border-blue-500/30',
      avatarGradient: 'from-blue-600 to-sky-500'
    }
  };

  const currentRole = roleConfigs[user?.role] || roleConfigs.student;
  const activeDaysCount = user?.activityDates?.length || 0;

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8 pb-16 px-2 sm:px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-sky-400 uppercase tracking-widest">Account & Settings</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile, public social links, and track platform metrics.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile Card */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden relative">
            
            {/* Cover Banner */}
            <div className={`h-36 w-full bg-gradient-to-r ${currentRole.coverGradient} relative overflow-hidden p-4 flex items-start justify-end`}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/20" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/15 blur-2xl rounded-full" />
              <div className="absolute -top-4 right-12 w-24 h-24 bg-sky-400/20 blur-xl rounded-full" />
              
              <span className={`relative z-10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-xs ${currentRole.badgeClass}`}>
                {currentRole.label}
              </span>
            </div>
            
            {/* Avatar & Identity Info */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col items-center">
              
              {/* Avatar Container with upload badge */}
              <div 
                className="relative -mt-16 mb-4 cursor-pointer group"
                onMouseEnter={() => setIsHoveringAvatar(true)}
                onMouseLeave={() => setIsHoveringAvatar(false)}
                onClick={triggerFileInput}
                title="Click to change photo"
              >
                <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl ring-4 ring-blue-500/10 dark:ring-blue-500/20 transition-transform group-hover:scale-102">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${currentRole.avatarGradient} flex items-center justify-center overflow-hidden relative`}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-white uppercase tracking-tight">
                        {user?.name?.substring(0, 2) || 'UN'}
                      </span>
                    )}
                    
                    {/* Hover Overlay */}
                    <AnimatePresence>
                      {isHoveringAvatar && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-white"
                        >
                          <HiOutlineCamera className="w-6 h-6" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Change</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Floating camera action button */}
                <div className="absolute bottom-1 right-1 p-2 rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white dark:ring-slate-900 group-hover:bg-blue-700 transition-colors">
                  <HiOutlineCamera className="w-3.5 h-3.5" />
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight">
                {user?.name}
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5 mt-1">
                <HiOutlineMail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </p>

              {user?.department && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                  <HiOutlineBriefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.department}</span>
                </p>
              )}

              {/* Student Level & Gamification Bar */}
              {user?.role === 'student' && (
                <div className="mt-5 w-full p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Level {Math.floor((user?.points || 0) / 100) + 1}</span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-sky-400 font-mono">
                      {user?.points || 0} pts
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/70 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-600 to-sky-400 shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${((user?.points || 0) % 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Progress: {((user?.points || 0) % 100)}%</span>
                    <span>{100 - ((user?.points || 0) % 100)} pts to next lvl</span>
                  </div>
                </div>
              )}

              {/* Verified Social Links */}
              <div className="mt-6 w-full pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">Online Presence</p>
                <div className="flex items-center justify-center gap-2.5">
                  {formData.githubUrl ? (
                    <a 
                      href={formData.githubUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
                      title="GitHub Profile"
                    >
                      <FaGithub className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800" title="GitHub not connected">
                      <FaGithub className="w-4 h-4" />
                    </div>
                  )}

                  {formData.linkedinUrl ? (
                    <a 
                      href={formData.linkedinUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
                      title="LinkedIn Profile"
                    >
                      <FaLinkedin className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800" title="LinkedIn not connected">
                      <FaLinkedin className="w-4 h-4" />
                    </div>
                  )}

                  {formData.portfolioUrl ? (
                    <a 
                      href={formData.portfolioUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
                      title="Personal Website"
                    >
                      <FaGlobe className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800" title="Portfolio not connected">
                      <FaGlobe className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Right Column: Edit Form & Stats */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Account Settings Form Card */}
          <motion.div variants={itemVariants} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
                  <HiOutlineIdentification className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your account information and contact URLs</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              
              {/* Section 1: Basic Information */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Personal Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineUser className="text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-800/80"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex justify-between items-center">
                      Email Address
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Verified</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineMail className="text-slate-400 w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Institutional Metadata */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pt-2">Academic & Department</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(user?.role === 'faculty' || user?.role === 'admin') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex justify-between items-center">
                        Department
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Fixed</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <HiOutlineBriefcase className="text-slate-400 w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={formData.department || 'Computer Science'}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {user?.role === 'student' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex justify-between items-center">
                        Student ID / Roll No.
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Institutional</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <HiOutlineIdentification className="text-slate-400 w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={formData.studentId}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex justify-between items-center">
                      Designation
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Role</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineAcademicCap className="text-slate-400 w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={currentRole.label}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Social & Portfolio URLs */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pt-2">Online Profiles & Links</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex items-center gap-1.5">
                      <FaGithub className="w-3.5 h-3.5 text-slate-500" />
                      <span>GitHub URL</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineLink className="text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        name="githubUrl"
                        placeholder="https://github.com/username"
                        value={formData.githubUrl}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-800/80"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex items-center gap-1.5">
                      <FaLinkedin className="w-3.5 h-3.5 text-blue-600" />
                      <span>LinkedIn URL</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineLink className="text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        name="linkedinUrl"
                        placeholder="https://linkedin.com/in/username"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-800/80"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 flex items-center gap-1.5">
                      <FaGlobe className="w-3.5 h-3.5 text-sky-500" />
                      <span>Personal Portfolio or Website</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HiOutlineLink className="text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        name="portfolioUrl"
                        placeholder="https://yourportfolio.dev"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-800/80"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <HiOutlineSparkles className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Gamification / Stats Section based on Role */}
          <motion.div variants={containerVariants} className="w-full space-y-6">
            
            {user?.role === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard 
                  icon={HiOutlineAcademicCap} 
                  label="Total Score" 
                  value={<>{user?.points || 0}<span className="text-xs font-semibold text-amber-500 ml-1">pts</span></>} 
                  gradient="from-amber-400 to-orange-500" 
                />
                
                <StatCard 
                  icon={HiOutlineFire} 
                  label="Current Streak" 
                  value={<>{user?.currentStreak || 0}<span className="text-xs font-semibold text-orange-500 ml-1">days</span></>} 
                  gradient="from-orange-400 to-red-500" 
                />
              </div>
            )}

            {user?.role === 'faculty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard 
                  icon={HiOutlineDocumentText} 
                  label="My Assignments" 
                  value={dashboardStats?.myAssignments || 0} 
                  gradient="from-blue-600 to-indigo-600" 
                />
                <StatCard 
                  icon={HiOutlineCloudUpload} 
                  label="Total Submissions" 
                  value={dashboardStats?.totalSubmissions || 0} 
                  gradient="from-sky-500 to-blue-600" 
                />
                <StatCard 
                  icon={HiOutlineShieldCheck} 
                  label="Plagiarism Flags" 
                  value={dashboardStats?.plagiarismFlags || 0} 
                  gradient="from-rose-500 to-red-500" 
                />
                <StatCard 
                  icon={HiOutlineCheckCircle} 
                  label="Evaluated" 
                  value={dashboardStats?.evaluatedSubmissions || 0} 
                  gradient="from-emerald-500 to-teal-500" 
                />
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard 
                  icon={HiOutlineUsers} 
                  label="Total Users" 
                  value={dashboardStats?.totalUsers || 0} 
                  gradient="from-blue-600 to-indigo-600" 
                />
                <StatCard 
                  icon={HiOutlineDocumentText} 
                  label="Total Assignments" 
                  value={dashboardStats?.totalAssignments || 0} 
                  gradient="from-sky-500 to-blue-500" 
                />
                <StatCard 
                  icon={HiOutlineCheckCircle} 
                  label="Platform Submissions" 
                  value={dashboardStats?.totalSubmissions || 0} 
                  gradient="from-emerald-500 to-teal-500" 
                />
                <StatCard 
                  icon={HiOutlineShieldCheck} 
                  label="Active Admins" 
                  value={dashboardStats?.activeAdmins || 1} 
                  gradient="from-rose-500 to-red-500" 
                />
              </div>
            )}

            {/* Authentic GitHub/LeetCode-style Contribution Heatmap */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

              {/* Heatmap Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60 shadow-xs">
                    <HiOutlineLightningBolt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Contribution Heatmap</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Submissions, challenges, and active learning sessions
                    </p>
                  </div>
                </div>

                {/* Quick metrics & badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-300 border border-blue-200 dark:border-blue-800/60">
                    <HiOutlineBadgeCheck className="w-3.5 h-3.5" />
                    <span>{Object.keys(activityMap).length} Active Days</span>
                  </span>
                  
                  {user?.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                      <HiOutlineFire className="w-3.5 h-3.5" />
                      <span>{user.currentStreak}d Streak</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Heatmap Grid Component */}
              {(() => {
                const weeksCount = 28; // ~6.5 months of history
                const today = new Date();
                
                // Align to end on the current week's Saturday
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + (6 - today.getDay()));
                
                // Start date is weeksCount * 7 days before endDate
                const startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - (weeksCount * 7) + 1);

                // Build weeks columns
                const weeks = [];
                let currentDay = new Date(startDate);

                for (let w = 0; w < weeksCount; w++) {
                  const daysInWeek = [];
                  for (let d = 0; d < 7; d++) {
                    const dateCopy = new Date(currentDay);
                    const dateStr = dateCopy.toISOString().split('T')[0];
                    const isFuture = dateCopy > today;
                    const count = isFuture ? 0 : (activityMap[dateStr] || 0);

                    let level = 0;
                    if (count >= 4) level = 4;
                    else if (count >= 3) level = 3;
                    else if (count >= 2) level = 2;
                    else if (count >= 1) level = 1;

                    daysInWeek.push({
                      date: dateCopy,
                      dateStr,
                      count,
                      level,
                      isFuture,
                    });
                    currentDay.setDate(currentDay.getDate() + 1);
                  }
                  weeks.push(daysInWeek);
                }

                // Month labels calculation: find weeks where a new month begins
                const monthLabels = [];
                let lastMonth = -1;
                weeks.forEach((week, weekIndex) => {
                  const firstDayOfWeek = week[0].date;
                  const month = firstDayOfWeek.getMonth();
                  if (month !== lastMonth) {
                    monthLabels.push({
                      weekIndex,
                      label: firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' }),
                    });
                    lastMonth = month;
                  }
                });

                // Total contributions in this window
                const totalWindowContributions = weeks.reduce((total, week) => {
                  return total + week.reduce((wTotal, day) => wTotal + day.count, 0);
                }, 0);

                return (
                  <div className="w-full bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
                    
                    {/* Month Labels Bar */}
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pb-2">
                      <div className="inline-block min-w-full">
                        
                        {/* Month header row */}
                        <div className="flex text-[11px] font-semibold text-slate-400 mb-2 pl-7 relative h-4">
                          {monthLabels.map((m, idx) => (
                            <span 
                              key={idx} 
                              className="absolute"
                              style={{ left: `${m.weekIndex * 15 + 28}px` }}
                            >
                              {m.label}
                            </span>
                          ))}
                        </div>

                        {/* Grid: Day labels on left + Week columns */}
                        <div className="flex gap-1.5 items-start">
                          
                          {/* Day-of-week labels (Mon, Wed, Fri) */}
                          <div className="flex flex-col justify-between h-[100px] text-[10px] font-semibold text-slate-400 pr-1 select-none py-0.5">
                            <span className="h-3 leading-3">Mon</span>
                            <span className="h-3 leading-3">Wed</span>
                            <span className="h-3 leading-3">Fri</span>
                          </div>

                          {/* 28 Week Columns */}
                          <div className="flex gap-1 sm:gap-1.5">
                            {weeks.map((week, wIdx) => (
                              <div key={wIdx} className="flex flex-col gap-1 sm:gap-1.5">
                                {week.map((day, dIdx) => {
                                  // Color mapping based on activity level
                                  const levelClasses = {
                                    0: 'bg-slate-200/70 dark:bg-slate-800 border-slate-300/40 dark:border-slate-700/60 hover:ring-slate-400',
                                    1: 'bg-sky-200 dark:bg-sky-950 border-sky-300 dark:border-sky-800/80 hover:ring-sky-400',
                                    2: 'bg-sky-400 dark:bg-sky-700 border-sky-500 dark:border-sky-600 hover:ring-sky-500',
                                    3: 'bg-blue-600 dark:bg-blue-600 border-blue-600 dark:border-blue-500 hover:ring-blue-600 shadow-xs',
                                    4: 'bg-blue-800 dark:bg-sky-300 border-blue-900 dark:border-white hover:ring-blue-700 shadow-xs shadow-blue-500/40',
                                  };

                                  const formattedDate = day.date.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  });

                                  if (day.isFuture) {
                                    return (
                                      <div 
                                        key={dIdx} 
                                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] opacity-20 bg-slate-200 dark:bg-slate-800" 
                                      />
                                    );
                                  }

                                  return (
                                    <div
                                      key={dIdx}
                                      className="relative group/cell"
                                    >
                                      <div
                                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] border transition-all duration-150 cursor-pointer group-hover/cell:scale-125 group-hover/cell:ring-2 z-10 ${levelClasses[day.level]}`}
                                      />

                                      {/* Tooltip on cell hover */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                                        <div className="bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700">
                                          <p className="font-bold text-sky-400">
                                            {day.count === 0 ? 'No activity' : `${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                                          </p>
                                          <p className="text-[10px] text-slate-300 mt-0.5">{formattedDate}</p>
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-1 border-r border-b border-slate-700" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Heatmap Footer: Total Count + Scale Legend */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="font-bold text-slate-900 dark:text-white">{totalWindowContributions}</span>
                        <span>activities recorded in the last 6 months</span>
                      </div>

                      {/* Legend Scale */}
                      <div className="flex items-center gap-2 text-[11px] self-end sm:self-auto font-medium">
                        <span>Less</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-[2.5px] bg-slate-200/70 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/60" title="0 activities" />
                          <div className="w-3 h-3 rounded-[2.5px] bg-sky-200 dark:bg-sky-950 border border-sky-300 dark:border-sky-800/80" title="1-2 activities" />
                          <div className="w-3 h-3 rounded-[2.5px] bg-sky-400 dark:bg-sky-700 border border-sky-500 dark:border-sky-600" title="3-5 activities" />
                          <div className="w-3 h-3 rounded-[2.5px] bg-blue-600 dark:bg-blue-600 border border-blue-600 dark:border-blue-500" title="6-8 activities" />
                          <div className="w-3 h-3 rounded-[2.5px] bg-blue-800 dark:bg-sky-300 border border-blue-900 dark:border-white shadow-xs" title="9+ activities" />
                        </div>
                        <span>More</span>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>

          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
