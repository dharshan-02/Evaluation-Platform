import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-[var(--color-bg-primary)] transition-colors duration-500">
      
      {/* Left Panel: Interactive Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden items-center justify-center border-r border-slate-200/20 dark:border-slate-800/50">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#0B0E14] z-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -50, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px]"
          />
        </div>

        {/* Floating Glass Showcase */}
        <div className="relative z-10 w-full max-w-lg px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Logo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center p-[2px]" style={{ background: 'var(--gradient-brand)' }}>
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <span className="text-3xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-brand)' }}>D</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">D's Evaluation</h1>
                <p className="text-[var(--color-brand)] font-semibold tracking-widest uppercase text-xs mt-1">Platform</p>
              </div>
            </div>

            {/* Feature Cards Showcase */}
            <div className="space-y-4">
              <motion.div 
                whileHover={{ x: 10 }}
                className="glass p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)]">Automated Code Execution</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">Secure sandbox environments for 10+ languages</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ x: 10 }}
                className="glass p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl backdrop-blur-xl ml-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)]">Smart Plagiarism Detection</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">Advanced AST-based code similarity analysis</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        {/* Subtle mesh background for mobile */}
        <div className="absolute inset-0 mesh-bg opacity-30 lg:hidden pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative" style={{ background: 'var(--gradient-brand)' }}>
              <div className="absolute inset-[2px] bg-[var(--color-bg-primary)] rounded-[14px] flex items-center justify-center">
                <span className="text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>D</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-[var(--color-text-primary)]">D's Evaluation</h1>
          </div>

          <div className="glass lg:bg-transparent lg:shadow-none lg:border-none rounded-3xl p-8 sm:p-10 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
            <Outlet />
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default AuthLayout;
