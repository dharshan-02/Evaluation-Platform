import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineCamera
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create a payload with only fields that were changed or needed
      const updateData = {
        name: formData.name,
      };

      await updateProfile(updateData);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineUser className="w-6 h-6 text-indigo-500" />
            My Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account settings and personal information.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 md:col-span-1 h-fit">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500 uppercase">
                  {user?.name?.substring(0, 2) || 'UN'}
                </span>
              </div>
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-colors">
              <HiOutlineCamera className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
          
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
            user?.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500' :
            user?.role === 'faculty' ? 'bg-emerald-500/10 text-emerald-500' :
            'bg-sky-500/10 text-sky-500'
          }`}>
            {user?.role} Account
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass p-6 rounded-2xl md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-xs text-slate-400">(Cannot be changed)</span>
                  </label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {user?.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Student ID
                    </label>
                    <div className="relative">
                      <HiOutlineIdentification className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.studentId}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
