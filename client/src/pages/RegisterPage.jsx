import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUser,
  HiOutlineAcademicCap,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const roles = [
  { value: 'student', label: 'Student', icon: HiOutlineAcademicCap, color: 'var(--color-brand)' },
  { value: 'faculty', label: 'Faculty', icon: HiOutlineUser, color: 'var(--color-cyan)' },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    studentId: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await register(formData);
      toast.success(`Welcome, ${user.name}! Account created successfully.`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Create account
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Join the evaluation platform
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            I am a
          </label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setFormData({ ...formData, role: r.value })}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: formData.role === r.value ? r.color : 'var(--color-bg-elevated)',
                  color: formData.role === r.value ? 'white' : 'var(--color-text-secondary)',
                  border: `1px solid ${formData.role === r.value ? r.color : 'var(--color-border)'}`,
                }}
              >
                <r.icon className="w-4 h-4" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Full Name
          </label>
          <div className="relative">
            <HiOutlineUser
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus-ring"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-brand)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Email
          </label>
          <div className="relative">
            <HiOutlineMail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus-ring"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-brand)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        {/* Student ID (conditional) */}
        {formData.role === 'student' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Student ID
            </label>
            <div className="relative group">
              <HiOutlineAcademicCap
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within:text-brand"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter your student ID"
                className="input-field w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none"
              />
            </div>
          </motion.div>
        )}

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Department
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Computer Science"
            className="input-field w-full px-4 py-3 rounded-xl text-sm outline-none"
          />
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
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-secondary)' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold transition-colors duration-200"
          style={{ color: 'var(--color-brand)' }}
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
};

export default RegisterPage;
