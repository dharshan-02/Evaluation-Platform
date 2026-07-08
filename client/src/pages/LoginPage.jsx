import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
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
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-900">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Email address
          </label>
          <div className="relative group">
            <HiOutlineMail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-brand"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@university.edu"
              className="input-field w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Password
          </label>
          <div className="relative group">
            <HiOutlineLockClosed
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-brand"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field w-full pl-12 pr-12 py-3 rounded-xl text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-colors hover:text-white"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--gradient-brand)',
            boxShadow: 'var(--shadow-md)',
          }}
          whileHover={{ scale: loading ? 1 : 1.02, boxShadow: 'var(--shadow-glow-brand)' }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </motion.button>

        {/* Divider */}
        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google Login Button */}
        <motion.button
          type="button"
          onClick={() => toast('Google Login is coming soon!', { icon: '🚀' })}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </motion.button>
      </form>
    </motion.div>
  );
};

export default LoginPage;
