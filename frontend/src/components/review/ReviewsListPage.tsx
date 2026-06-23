import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileCode, GitBranch, Plus, Search, CheckCircle, Clock, XCircle, TrendingUp, Eye } from 'lucide-react';
import { reviewApi } from '../../services/reviewApi';

export const ReviewsListPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      const data = await reviewApi.listReviews('repo-1');
      setReviews(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  const filtered = reviews.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'badge-amber';
      case 'approved': return 'badge-green';
      case 'merged': return 'badge-blue';
      case 'changes_requested': return 'badge-rose';
      default: return 'badge-slate';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Code Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reviews.length} total reviews</p>
        </div>
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all">
          <Plus size={16} /> New Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open', count: reviews.filter(r => r.status === 'open').length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
          { label: 'Approved', count: reviews.filter(r => r.status === 'approved').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
          { label: 'Changes Requested', count: reviews.filter(r => r.status === 'changes_requested').length, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', icon: XCircle },
          { label: 'Merged', count: reviews.filter(r => r.status === 'merged').length, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', icon: TrendingUp },
        ].map((s, i) => (
          <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setFilter(s.label.toLowerCase().replace(' ', '_').replace('changes_requested', 'changes_requested'))} className={`p-3 rounded-card border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-left hover:shadow-card transition-all`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.bg} ${s.color}`}><s.icon size={14} /></div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search reviews..." />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-auto min-w-[140px]">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="approved">Approved</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="merged">Merged</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-surface" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-dark-surface rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-dark-surface rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-12 text-center">
            <FileCode size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No reviews found</p>
            <button onClick={() => navigate('/')} className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">Create one →</button>
          </div>
        ) : (
          filtered.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => navigate(`/reviews/${review.id}`)} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 hover:shadow-card hover:border-primary-200 dark:hover:border-primary-500/20 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-500/10 transition-colors">
                  <FileCode size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{review.title}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(review.status)}`}>
                      {review.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{review.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1"><GitBranch size={11} /> {review.branch_name}</span>
                    <span>{review.files_changed} files</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+{review.additions}</span>
                    <span className="text-rose-600 dark:text-rose-400">-{review.deletions}</span>
                    {review.ai_score && <span className="flex items-center gap-0.5"><TrendingUp size={11} /> {review.ai_score}/5</span>}
                    <span>{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <Eye size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors mt-1" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
