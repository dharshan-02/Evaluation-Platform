import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * AuthLayout — Full-screen layout for login/register pages.
 * Features an animated gradient mesh background with glassmorphism card.
 */
const AuthLayout = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Clean Minimalist Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--color-brand-light)] rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--color-amber-light)] rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--color-brand)] rounded-full blur-[120px] opacity-5 pointer-events-none" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Premium Minimalist Card container for auth forms */}
        <div
          className="bg-white rounded-[1.75rem] p-8 sm:p-12 border border-stone-100 shadow-xl relative overflow-hidden"
          style={{ boxShadow: '0 20px 40px -10px rgba(41, 37, 36, 0.08), 0 0 20px rgba(41, 37, 36, 0.03)' }}
        >

          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative"
              style={{ background: 'var(--gradient-brand)', boxShadow: '0 10px 40px -10px var(--color-brand)' }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="absolute inset-[2px] bg-white rounded-[22px] flex items-center justify-center">
                <span className="text-3xl font-black bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>
                  D
                </span>
              </div>
            </motion.div>
            <h1 
              className="text-4xl font-black tracking-tight text-transparent bg-clip-text"
              style={{ backgroundImage: 'var(--gradient-brand)' }}
            >
              D's
            </h1>
            <p className="text-sm mt-3 font-semibold text-slate-500 uppercase tracking-widest">
              Evaluation Platform
            </p>
          </div>

          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
