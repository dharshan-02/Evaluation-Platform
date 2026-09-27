import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-10">
        <h2 className="text-4xl font-black tracking-tight mb-3 text-[var(--color-text-primary)]">
          Welcome back
        </h2>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Enter your credentials to access your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
            Email address
          </label>
          <div className="relative group">
            <HiOutlineMail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-indigo-500"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@university.edu"
              className="input-field w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
            Password
          </label>
          <div className="relative group">
            <HiOutlineLockClosed
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-indigo-500"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field w-full pl-12 pr-12 py-3.5 rounded-xl text-sm font-medium outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-[var(--color-text-primary)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
          </div>
        </div>


        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl text-sm font-black text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          style={{
            background: 'var(--gradient-brand)',
            boxShadow: 'var(--shadow-glow-brand)',
          }}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {/* Animated Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
          
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                </svg>
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Workspace
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </motion.button>
      </form>
    </motion.div>
  );
};

export default LoginPage;
