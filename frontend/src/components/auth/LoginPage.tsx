import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Code2, Shield, Zap, Users, BarChart3, CheckCircle } from 'lucide-react';
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
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white mb-1.5">Sign in</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-7">Welcome back to your code review platform</p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-700 dark:text-red-400 text-[13px]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={15} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 text-[13px] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="demo@devflow.ai" required />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={15} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 text-[13px] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="demo123" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-[13px] mt-1 shadow-sm">
              {loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-5 text-center text-[13px] text-gray-500 dark:text-gray-400">
            No account? <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">Create one</Link>
          </p>

          {/* Demo Hint */}
          <div className="mt-6 p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-100/50 dark:bg-dark-surface">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              Demo: <span className="text-primary-600 dark:text-primary-400 font-medium">demo@devflow.ai</span> <span className="text-gray-300 dark:text-gray-600">·</span> <span className="text-primary-600 dark:text-primary-400 font-medium">demo123</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right — About Section */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-dark-card dark:bg-dark-surface overflow-hidden relative">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative w-full max-w-[540px] px-10 xl:px-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            {/* Title */}
            <h2 className="text-3xl xl:text-[34px] font-bold text-white leading-tight mb-3">
              Ship better code,<br />faster together
            </h2>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-8 max-w-[420px]">
              AI-powered code reviews, real-time pair programming, and team analytics — all in one place.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3.5 mb-8">
              {[
                { icon: Shield, title: 'AI Analysis', desc: 'Auto-detect bugs & security issues', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: Users, title: 'Pair Coding', desc: 'Real-time collaborative editor', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { icon: BarChart3, title: 'Analytics', desc: 'Track team performance metrics', color: 'text-primary-400', bg: 'bg-primary-500/10' },
                { icon: Zap, title: 'Workflows', desc: 'Automated review assignments', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              ].map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                  <div className={`w-8 h-8 rounded-lg ${feature.bg} ${feature.color} flex items-center justify-center mb-2.5`}>
                    <feature.icon size={16} />
                  </div>
                  <h4 className="text-[13px] font-semibold text-white mb-0.5">{feature.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-5 text-[11px] text-gray-500 mb-8">
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500" /> Free for small teams</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500" /> No credit card</span>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-white/[0.06]">
              {[
                { value: '12k+', label: 'Reviews' },
                { value: '2k+', label: 'Teams' },
                { value: '4.9', label: 'Rating' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
