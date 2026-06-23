import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Code2, Users, GitPullRequest, Brain, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/authApi';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await authApi.login(email, password);
      login(response.user, response.accessToken, response.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleDemoLogin = async () => {
    setError(''); setLoading(true);
    try {
      const response = await authApi.login('demo@devflow.ai', 'demo123');
      login(response.user, response.accessToken, response.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-bg">
      {/* Left — Login Form */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex flex-col justify-center px-8 sm:px-12 bg-gray-50/80 dark:bg-dark-bg border-r border-gray-200/60 dark:border-dark-border flex-shrink-0">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[340px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">DevFlow</span>
          </div>

          {/* Heading */}
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white mb-1.5">Welcome back</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-7">Sign in to continue to your dashboard</p>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-700 dark:text-red-400 text-[13px]">
              {error}
            </motion.div>
          )}

          {/* One-Click Demo Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-3 px-4 mb-5 rounded-xl font-semibold text-[13px] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 via-primary-500 to-emerald-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
          >
            <Zap size={16} className="fill-current" />
            Try Demo Account
            <ArrowRight size={15} />
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
            <span className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={15} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 text-[13px] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Password</label>
                <button type="button" className="text-[11px] text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={15} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 text-[13px] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Enter your password" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-[13px] shadow-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Signing in...
                </span>
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
            <span className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
          </div>

          {/* Google Login */}
          <button className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-[13px] font-medium text-gray-700 dark:text-gray-300 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {/* Footer */}
          <p className="mt-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
            Don't have an account? <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">Get started</Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Hero Section */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-[#000000] overflow-hidden relative">
        {/* Subtle glow accents */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-violet-500/6 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative w-full max-w-[520px] px-10 xl:px-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            {/* Title */}
            <h2 className="text-3xl xl:text-[36px] font-bold text-white leading-[1.15] mb-4">
              Ship better code,<br />
              <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-violet-400 bg-clip-text text-transparent">faster together</span>
            </h2>
            <p className="text-[14px] text-gray-400 leading-relaxed mb-10 max-w-[440px]">
              Automated code analysis, real-time collaboration, and actionable insights — everything your team needs to deliver quality software.
            </p>

            {/* Feature Cards */}
            <div className="space-y-3 mb-10">
              {[
                { icon: Brain, title: 'Intelligent Analysis', desc: 'AI detects bugs, security vulnerabilities, and code smells before they reach production', color: 'from-emerald-500 to-emerald-400', iconColor: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: GitPullRequest, title: 'Seamless Reviews', desc: 'Inline comments, suggested fixes, and approval workflows built for modern teams', color: 'from-primary-500 to-primary-400', iconColor: 'text-primary-400', bg: 'bg-primary-500/10' },
                { icon: Users, title: 'Real-time Pairing', desc: 'Collaborative editor with live cursors, terminal, and built-in chat', color: 'from-violet-500 to-violet-400', iconColor: 'text-violet-400', bg: 'bg-violet-500/10' },
              ].map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.1 }} className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all group">
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <feature.icon size={18} className={feature.iconColor} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-white mb-0.5">{feature.title}</h4>
                    <p className="text-[12px] text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
