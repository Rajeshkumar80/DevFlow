import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FileCode, Users, Award, Clock } from 'lucide-react';
import api from '../../services/api';

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border shadow-dropdown p-3 text-sm">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="text-gray-900 dark:text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const AnalyticsPage = () => {
  const [summary, setSummary] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await api.get('/analytics/team/1'); setSummary(res.data.summary); setData(res.data.timeSeries || []); } catch {}
  };

  const stats = [
    { icon: FileCode, label: 'Total Reviews', value: String(summary?.total_reviews || 0), color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
    { icon: Award, label: 'Avg AI Score', value: summary?.avg_ai_score ? Number(summary.avg_ai_score).toFixed(1) : 'N/A', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { icon: Users, label: 'Total Comments', value: String(summary?.total_comments || 0), color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { icon: Clock, label: 'Avg Review Time', value: summary?.avg_review_time ? `${Number(summary.avg_review_time).toFixed(1)}h` : 'N/A', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><s.icon size={18} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Activity Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="commentGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-dark-border" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="total_reviews" stroke="#3b82f6" fill="url(#reviewGrad)" strokeWidth={2} name="Reviews" />
              <Area type="monotone" dataKey="total_comments" stroke="#8b5cf6" fill="url(#commentGrad)" strokeWidth={2} name="Comments" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">AI Scores Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-dark-border" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 5]} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avg_ai_score" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="AI Score" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};
