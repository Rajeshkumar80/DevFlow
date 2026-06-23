import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Code2 } from 'lucide-react';
import { authApi } from '../../services/authApi';

export const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', username: '', fullName: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authApi.register(form.email, form.username, form.password, form.fullName || undefined);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-4"><Code2 size={24} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DevFlow</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Join the future of code review</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-8 shadow-card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Create your account</h2>
          {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-btn text-red-700 dark:text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Full Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} /><input type="text" name="fullName" value={form.fullName} onChange={handleChange} className="input pl-9" placeholder="John Developer" /></div></div>
            <div><label className="label">Username</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} /><input type="text" name="username" value={form.username} onChange={handleChange} className="input pl-9" placeholder="johndev" required /></div></div>
            <div><label className="label">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} /><input type="email" name="email" value={form.email} onChange={handleChange} className="input pl-9" placeholder="you@company.com" required /></div></div>
            <div><label className="label">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} /><input type="password" name="password" value={form.password} onChange={handleChange} className="input pl-9" placeholder="••••••••" required /></div></div>
            <div><label className="label">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} /><input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="input pl-9" placeholder="••••••••" required /></div></div>
            <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-btn transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">{loading ? 'Creating...' : 'Create Account'} {!loading && <ArrowRight size={16} />}</button>
          </form>
          <p className="mt-5 text-center text-gray-500 dark:text-gray-400 text-sm">Already have an account? <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
};
