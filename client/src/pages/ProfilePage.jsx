import { useState, useEffect, useRef } from 'react';
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
  HiOutlineLink
} from 'react-icons/hi';
import toast from 'react-hot-toast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const StatCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => (
  <motion.div 
    variants={itemVariants}
    className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} blur-[50px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
    <div className="flex items-center gap-4 relative z-10">
      <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg text-white`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setDashboardStats(res.data.stats);
      } catch (err) {
        console.error('Failed to load stats for profile:', err);
      }
    };
    if (user) fetchStats();
  }, [user]);

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

      // If user's role is not student, they might not need studentId updated
      // but if the API allows it, we can append it if present
      if (user?.role === 'student') {
        submitData.append('studentId', formData.studentId);
      }

      await updateProfile(submitData);
      toast.success('Profile updated successfully!', {
        icon: '✨',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const roleColors = {
    admin: 'from-purple-500 to-indigo-600 shadow-purple-500/20 text-purple-100',
    faculty: 'from-emerald-500 to-teal-600 shadow-emerald-500/20 text-emerald-100',
    student: 'from-sky-500 to-blue-600 shadow-sky-500/20 text-sky-100'
  };

  const roleText = {
    admin: 'Administrator',
    faculty: 'Faculty Member',
    student: 'Student'
  };

  const currentRoleColor = roleColors[user?.role] || roleColors.student;

  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-8 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Area */}
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 dark:bg-indigo-500/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
            <HiOutlineUser className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          My Profile
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-2 ml-14">
          Manage your personal settings and view your platform statistics.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Profile Card */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
          <div className="glass overflow-hidden rounded-3xl relative group border border-slate-200/50 dark:border-slate-700/50">
            {/* Cover Banner */}
            <div className={`h-32 w-full bg-gradient-to-r ${currentRoleColor} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 blur-xl rounded-full" />
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/30">
                {roleText[user?.role] || 'User'}
              </div>
            </div>
            
            {/* Avatar Section */}
            <div className="px-6 pb-8 pt-0 relative flex flex-col items-center">
              <div 
                className="relative -mt-16 mb-4 cursor-pointer"
                onMouseEnter={() => setIsHoveringAvatar(true)}
                onMouseLeave={() => setIsHoveringAvatar(false)}
                onClick={triggerFileInput}
              >
                <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-xl relative z-10">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${currentRoleColor} flex items-center justify-center overflow-hidden relative`}>
                    
                    {previewUrl ? (
                      <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-white uppercase">
                        {user?.name?.substring(0, 2) || 'UN'}
                      </span>
                    )}
                    
                    {/* Hover Overlay for Upload */}
                    <AnimatePresence>
                      {isHoveringAvatar && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors"
                        >
                          <HiOutlineCamera className="w-8 h-8 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {/* Decorative ping effect behind avatar */}
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md scale-110 z-0" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 text-center">{user?.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1">
                <HiOutlineMail className="w-4 h-4" /> {user?.email}
              </p>
              
              {user?.role === 'student' && (
                <div className="mt-6 w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</span>
                    <span className="text-xs font-bold text-indigo-500">
                      Lvl {Math.floor((user?.points || 0) / 100) + 1}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((user?.points || 0) % 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-2 text-right text-[10px] text-slate-400 font-medium">
                    {100 - ((user?.points || 0) % 100)} points to next level
                  </div>
                </div>
              )}

              {/* Social Links Quick View */}
              <div className="mt-6 flex gap-3 justify-center w-full">
                {formData.githubUrl && (
                  <a href={formData.githubUrl} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 tooltip" title="GitHub">
                    <HiOutlineLink className="w-5 h-5" />
                  </a>
                )}
                {formData.linkedinUrl && (
                  <a href={formData.linkedinUrl} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 tooltip" title="LinkedIn">
                    <HiOutlineLink className="w-5 h-5" />
                  </a>
                )}
                {formData.portfolioUrl && (
                  <a href={formData.portfolioUrl} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 tooltip" title="Portfolio">
                    <HiOutlineLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Edit Form & Stats */}
        <div className="lg:col-span-8 space-y-8">
          
          <motion.div variants={itemVariants} className="glass p-8 rounded-3xl relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <HiOutlineIdentification className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Settings</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiOutlineUser className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex justify-between items-center">
                    Email Address
                    <span className="text-[10px] uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">Read Only</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiOutlineMail className="text-slate-400 w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 cursor-not-allowed transition-all"
                    />
                  </div>
                </div>

                {/* Social/Public URLs */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    GitHub URL
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiOutlineLink className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      name="githubUrl"
                      placeholder="https://github.com/username"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    LinkedIn URL
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiOutlineLink className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      name="linkedinUrl"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Personal Portfolio URL
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiOutlineLink className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      name="portfolioUrl"
                      placeholder="https://yourwebsite.com"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-slate-900"
                    />
                  </div>
                </div>

                {(user?.role === 'faculty' || user?.role === 'admin') && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex justify-between items-center">
                      Department
                      <span className="text-[10px] uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">Read Only</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiOutlineBriefcase className="text-slate-400 w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={formData.department || 'Computer Science'}
                        disabled
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 cursor-not-allowed transition-all"
                      />
                    </div>
                  </div>
                )}

                {user?.role === 'student' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex justify-between items-center">
                      Student ID
                      <span className="text-[10px] uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">Read Only</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiOutlineIdentification className="text-slate-400 w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={formData.studentId}
                        disabled
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 cursor-not-allowed font-mono transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 mt-8 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <HiOutlineSparkles className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>

          {/* Gamification / Stats Section based on Role */}
          <motion.div variants={containerVariants} className="w-full">
            
            {user?.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Cards */}
                <StatCard 
                  icon={HiOutlineAcademicCap} 
                  label="Total Score" 
                  value={<>{user?.points || 0}<span className="text-base font-semibold text-amber-500 ml-1">pts</span></>} 
                  gradient="from-amber-400 to-orange-500" 
                />
                
                <StatCard 
                  icon={HiOutlineFire} 
                  label="Current Streak" 
                  value={<>{user?.currentStreak || 0}<span className="text-base font-semibold text-orange-500 ml-1">days</span></>} 
                  gradient="from-orange-400 to-red-500" 
                />
              </div>
            )}

            {user?.role === 'faculty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <StatCard 
                  icon={HiOutlineDocumentText} 
                  label="My Assignments" 
                  value={dashboardStats?.myAssignments || 0} 
                  gradient="from-indigo-500 to-blue-600" 
                />
                <StatCard 
                  icon={HiOutlineCloudUpload} 
                  label="Total Submissions" 
                  value={dashboardStats?.totalSubmissions || 0} 
                  gradient="from-cyan-400 to-blue-500" 
                />
                <StatCard 
                  icon={HiOutlineShieldCheck} 
                  label="Plagiarism Flags" 
                  value={dashboardStats?.plagiarismFlags || 0} 
                  gradient="from-rose-400 to-red-500" 
                />
                <StatCard 
                  icon={HiOutlineCheckCircle} 
                  label="Evaluated" 
                  value={dashboardStats?.evaluatedSubmissions || 0} 
                  gradient="from-emerald-400 to-teal-500" 
                />
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <StatCard 
                  icon={HiOutlineUsers} 
                  label="Total Users" 
                  value={dashboardStats?.totalUsers || 0} 
                  gradient="from-indigo-500 to-purple-600" 
                />
                <StatCard 
                  icon={HiOutlineDocumentText} 
                  label="Total Assignments" 
                  value={dashboardStats?.totalAssignments || 0} 
                  gradient="from-blue-400 to-cyan-500" 
                />
                <StatCard 
                  icon={HiOutlineCheckCircle} 
                  label="Platform Submissions" 
                  value={dashboardStats?.totalSubmissions || 0} 
                  gradient="from-emerald-400 to-teal-500" 
                />
                <StatCard 
                  icon={HiOutlineShieldCheck} 
                  label="Active Admins" 
                  value={dashboardStats?.activeAdmins || 1} 
                  gradient="from-rose-400 to-red-500" 
                />
              </div>
            )}

            {/* Activity Heatmap (For all roles) */}
            <div className={`glass p-8 rounded-3xl w-full mt-6 relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50`}>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                  <HiOutlineLightningBolt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Platform Activity
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-8">Your activity footprint over the last 30 days</p>
              
              <div className="w-full flex items-center justify-center relative z-10 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex gap-2 w-full justify-between items-end h-24">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    const dateString = date.toISOString().split('T')[0];
                    
                    const isActive = user?.activityDates?.includes(dateString);
                    
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: isActive ? '100%' : '12%' }}
                          transition={{ delay: i * 0.02 + 0.5, type: 'spring' }}
                          title={dateString}
                          className={`w-full max-w-[12px] rounded-full transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-t from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.6)]' 
                              : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                          }`}
                          style={{ height: isActive ? 'auto' : '12%' }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20 shadow-xl">
                          {isActive ? 'Active' : 'No Activity'}<br/>
                          <span className="text-slate-400">{dateString}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                <span>30 Days Ago</span>
                <span>Today</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
