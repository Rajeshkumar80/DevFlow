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
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg">
      {/* Left — Login Form */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 sm:px-12 lg:px-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">DevFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to continue to your dashboard</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-btn text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="you@company.com" required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9" placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-btn transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-5 text-center text-gray-500 dark:text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">Create one</Link>
          </p>

          <div className="mt-6 p-3 bg-gray-100 dark:bg-dark-surface rounded-btn border border-gray-200 dark:border-dark-border">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Demo: <span className="text-primary-600 dark:text-primary-400 font-medium">demo@devflow.ai</span> / <span className="text-primary-600 dark:text-primary-400 font-medium">demo123</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right — About Section */}
      <div className="hidden lg:flex flex-1 bg-dark-card dark:bg-dark-surface border-l border-gray-200 dark:border-dark-border">
        <div className="flex flex-col justify-center px-12 xl:px-16 max-w-xl">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              AI-Powered Code Review Platform
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
              DevFlow helps teams ship better code faster with intelligent analysis, real-time collaboration, and actionable insights.
            </p>

            <div className="space-y-5">
              {[
                { icon: Shield, title: 'AI Code Analysis', desc: 'Automated review detects bugs, security issues, and performance problems before they reach production', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { icon: Users, title: 'Real-Time Pair Programming', desc: 'Code together with live sync, chat, and shared cursor tracking across your team', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                { icon: BarChart3, title: 'Team Analytics', desc: 'Track review velocity, code quality scores, and team performance with interactive dashboards', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
                { icon: Zap, title: 'Smart Workflows', desc: 'Automated review assignments, notifications, and integration with your existing Git workflow', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              ].map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex gap-3">
                  <div className={`p-2 rounded-lg h-fit ${feature.bg} ${feature.color}`}><feature.icon size={16} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{feature.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Free for small teams</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> No credit card required</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
