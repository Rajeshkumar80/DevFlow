import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCode, GitPullRequest, Users, TrendingUp, ArrowUp, MoreHorizontal } from 'lucide-react';
import { reviewApi } from '../../services/reviewApi';

export const DashboardPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const data = await reviewApi.listReviews('repo-1'); setReviews(Array.isArray(data) ? data : []); } catch {} finally { setLoading(false); }
  };

  const openReviews = reviews.filter(r => r.status === 'open').length;
  const approved = reviews.filter(r => r.status === 'approved' || r.status === 'merged').length;
  const avgScore = reviews.length ? (reviews.reduce((a: number, r: any) => a + (r.ai_score || 0), 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Dashboard <span className="text-gray-400 dark:text-gray-500 font-normal">/ CMS</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileCode, label: 'Open Reviews', value: openReviews, change: '+12%', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
          { icon: GitPullRequest, label: 'Approved', value: approved, change: '+8%', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: Users, label: 'Contributors', value: '6', change: '+2', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          { icon: TrendingUp, label: 'Avg AI Score', value: avgScore, change: '+0.3', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon size={18} /></div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5"><ArrowUp size={12} />{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">This month</span>
          </div>
          <div className="h-48 flex items-end gap-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-primary-100 dark:bg-primary-500/20 rounded-t" style={{ height: `${h}%` }}>
                <div className="w-full bg-primary-500 dark:bg-primary-400 rounded-t opacity-80" style={{ height: `${h * 0.6}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-gray-400 dark:text-gray-500">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Activity</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">This week</span>
          </div>
          <div className="h-48 flex items-end gap-3">
            {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-violet-200 dark:bg-violet-500/30 rounded-t" style={{ height: `${h}%` }}>
                <div className="w-full bg-violet-500 dark:bg-violet-400 rounded-t" style={{ height: '100%' }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-gray-400 dark:text-gray-500">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </motion.div>
      </div>

      {/* Recent Reviews */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
          <button className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 dark:border-dark-border">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Review</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">AI Score</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-t border-gray-50 dark:border-dark-border/50">
                    <td colSpan={5} className="px-5 py-3"><div className="h-4 bg-gray-100 dark:bg-dark-surface rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr className="border-t border-gray-50 dark:border-dark-border/50">
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No reviews yet</td>
                </tr>
              ) : (
                reviews.slice(0, 5).map((review) => (
                  <tr key={review.id} className="border-t border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center flex-shrink-0">
                          <FileCode size={14} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-[13px]">{review.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{review.branch_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        review.status === 'open' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        review.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        'bg-gray-100 text-gray-600 dark:bg-dark-surface dark:text-gray-400'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300 text-[13px]">{review.ai_score ? `${review.ai_score}/5` : '—'}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-[13px]">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors text-gray-400">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'New Code Review', desc: 'Start a new code review request', color: 'border-primary-200 dark:border-primary-500/20 bg-primary-50/50 dark:bg-primary-500/5 text-primary-700 dark:text-primary-400' },
          { title: 'Pair Programming', desc: 'Start a pair programming session', color: 'border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 text-violet-700 dark:text-violet-400' },
          { title: 'View Analytics', desc: 'Check team performance metrics', color: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400' },
        ].map((action, i) => (
          <motion.button key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className={`p-4 rounded-card border text-left hover:shadow-card transition-all ${action.color}`}>
            <p className="font-medium text-[13px]">{action.title}</p>
            <p className="text-xs opacity-70 mt-0.5">{action.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
