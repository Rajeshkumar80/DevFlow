import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, GitPullRequest, Users, TrendingUp, Plus, X, Code2, Send, GitBranch } from 'lucide-react';
import { reviewApi } from '../../services/reviewApi';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [teamData, setTeamData] = useState<any>(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    branchName: '',
    files: [{ name: '', content: '' }]
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reviewsData] = await Promise.all([
        reviewApi.listReviews('repo-1').catch(() => []),
        api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {}),
        api.get('/analytics/team/team-1').then(r => setTeamData(r.data)).catch(() => {}),
      ]);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch {} finally { setLoading(false); }
  };

  const openReviews = reviews.filter(r => r.status === 'open').length;
  const approved = reviews.filter(r => r.status === 'approved' || r.status === 'merged').length;
  const avgScore = reviews.length ? (reviews.reduce((a: number, r: any) => a + (r.ai_score || 0), 0) / reviews.length).toFixed(1) : '—';
  const totalContributors = teamData?.timeSeries?.[0]?.members_active || 6;
  const recentNotifications = notifications.slice(0, 3);

  const addFile = () => setForm({ ...form, files: [...form.files, { name: '', content: '' }] });
  const removeFile = (i: number) => setForm({ ...form, files: form.files.filter((_, idx) => idx !== i) });
  const updateFile = (i: number, field: 'name' | 'content', val: string) => {
    const files = [...form.files];
    files[i] = { ...files[i], [field]: val };
    setForm({ ...form, files });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.branchName.trim()) return;
    setCreating(true);
    try {
      const codeFiles = form.files.filter(f => f.name.trim() && f.content.trim());
      const review = await reviewApi.createReview('repo-1', {
        title: form.title,
        description: form.description,
        branchName: form.branchName,
        codeFiles: codeFiles.length > 0 ? codeFiles : undefined
      });
      setReviews([review, ...reviews]);
      setShowCreate(false);
      setForm({ title: '', description: '', branchName: '', files: [{ name: '', content: '' }] });
    } catch {} finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all">
          <Plus size={16} /> New Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileCode, label: 'Open Reviews', value: openReviews, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
          { icon: GitPullRequest, label: 'Approved', value: approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: Users, label: 'Active Members', value: totalContributors, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          { icon: TrendingUp, label: 'Avg AI Score', value: avgScore, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon size={18} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Reviews */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 dark:border-dark-border">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Review</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">AI Score</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Files</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
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
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No reviews yet. Click "New Review" to create one.</td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} onClick={() => navigate(`/reviews/${review.id}`)} className="border-t border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center flex-shrink-0">
                          <FileCode size={14} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-[13px]">{review.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><GitBranch size={10} />{review.branch_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        review.status === 'open' ? 'badge-green' :
                        review.status === 'approved' ? 'badge-green' :
                        review.status === 'merged' ? 'badge-blue' :
                        review.status === 'changes_requested' ? 'badge-rose' :
                        'badge-slate'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300 text-[13px]">{review.ai_score ? `${review.ai_score}/5` : '—'}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-[13px]">{review.files_changed}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-[13px]">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Notifications */}
      {recentNotifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
          </div>
          <div className="px-5 pb-4 space-y-2">
            {recentNotifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-primary-500'}`} />
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'New Code Review', desc: 'Submit code for AI-powered review', color: 'border-primary-200 dark:border-primary-500/20 bg-primary-50/50 dark:bg-primary-500/5 text-primary-700 dark:text-primary-400', action: () => setShowCreate(true) },
          { title: 'Pair Programming', desc: 'Start real-time coding session', color: 'border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 text-violet-700 dark:text-violet-400', action: () => navigate('/pair') },
          { title: 'View Analytics', desc: 'Check team performance metrics', color: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400', action: () => navigate('/analytics') },
        ].map((action, i) => (
          <motion.button key={i} onClick={action.action} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className={`p-4 rounded-card border text-left hover:shadow-card transition-all ${action.color}`}>
            <p className="font-medium text-[13px]">{action.title}</p>
            <p className="text-xs opacity-70 mt-0.5">{action.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Create Review Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-2xl bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <Code2 size={18} className="text-primary-500" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Code Review</h2>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors text-gray-400"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. Add user authentication" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" placeholder="What does this PR do?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Branch Name *</label>
                    <input value={form.branchName} onChange={e => setForm({ ...form, branchName: e.target.value })} className="input" placeholder="feature/my-feature" />
                  </div>
                  <div>
                    <label className="label">Base Branch</label>
                    <input value="main" className="input" disabled />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Code Files</label>
                    <button onClick={addFile} className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"><Plus size={12} /> Add file</button>
                  </div>
                  <div className="space-y-3">
                    {form.files.map((file, i) => (
                      <div key={i} className="border border-gray-200 dark:border-dark-border rounded-btn overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border">
                          <FileCode size={13} className="text-gray-400" />
                          <input value={file.name} onChange={e => updateFile(i, 'name', e.target.value)} className="flex-1 bg-transparent text-xs text-gray-900 dark:text-gray-100 focus:outline-none placeholder-gray-400" placeholder="src/file.ts" />
                          {form.files.length > 1 && <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-rose-500"><X size={12} /></button>}
                        </div>
                        <textarea value={file.content} onChange={e => updateFile(i, 'content', e.target.value)} className="w-full p-3 bg-white dark:bg-dark-bg text-xs font-mono text-gray-900 dark:text-gray-100 resize-none focus:outline-none min-h-[120px] placeholder-gray-400" placeholder="Paste your code here..." spellCheck={false} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-dark-border">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-btn transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !form.title.trim() || !form.branchName.trim()} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all disabled:opacity-50 flex items-center gap-1.5">
                  <Send size={14} /> {creating ? 'Creating...' : 'Create Review'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
