import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { reviewApi } from '../../services/reviewApi';
import { analysisApi } from '../../services/analysisApi';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MessageSquare, CheckCircle, XCircle, AlertTriangle, Send, GitBranch, ArrowLeft, FileCode, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReviewDetailPage = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (reviewId) loadReview(); }, [reviewId]);

  const loadReview = async () => {
    try {
      const [r, c, { issues: is }] = await Promise.all([
        reviewApi.getReview('repo-1', reviewId!),
        reviewApi.getComments(reviewId!),
        analysisApi.getIssues(reviewId!)
      ]);
      setReview(r); setComments(c); setIssues(is || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !reviewId) return;
    setCommentLoading(true);
    try { const comment = await reviewApi.addComment(reviewId, { content: newComment }); setComments([...comments, comment]); setNewComment(''); } catch {} finally { setCommentLoading(false); }
  };

  const handleUpdateStatus = async (status: string) => {
    try { const updated = await reviewApi.updateReviewStatus('repo-1', reviewId!, status); setReview(updated); } catch {}
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner />;
  if (!review) return <div className="text-center py-12"><p className="text-gray-500">Review not found</p></div>;

  const codeFiles = review.code_files || [];
  const severityConfig: Record<string, { color: string; label: string }> = {
    critical: { color: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', label: 'Critical' },
    high: { color: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', label: 'High' },
    medium: { color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', label: 'Medium' },
    low: { color: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-dark-surface dark:text-gray-400 dark:border-dark-border', label: 'Low' },
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{review.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{review.description}</p>
            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={review.status} />
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><GitBranch size={12} /> {review.branch_name}</span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {review.status === 'open' && (
              <>
                <button onClick={() => handleUpdateStatus('approved')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-btn transition-all flex items-center gap-1"><CheckCircle size={14} /> Approve</button>
                <button onClick={() => handleUpdateStatus('changes_requested')} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-btn transition-all flex items-center gap-1"><XCircle size={14} /> Request Changes</button>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Files: <span className="font-medium text-gray-700 dark:text-gray-300">{review.files_changed}</span></span>
          <span><span className="text-emerald-600 dark:text-emerald-400 font-medium">+{review.additions}</span> / <span className="text-rose-600 dark:text-rose-400 font-medium">-{review.deletions}</span></span>
          {review.ai_score ? <span>AI Score: <span className="text-primary-600 dark:text-primary-400 font-medium">{review.ai_score}/5</span></span> : null}
        </div>
      </motion.div>

      {/* Code Files */}
      {codeFiles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border overflow-hidden shadow-card">
          <div className="flex border-b border-gray-200 dark:border-dark-border overflow-x-auto">
            {codeFiles.map((file: any, i: number) => (
              <button key={i} onClick={() => setActiveFile(i)} className={`flex items-center gap-1.5 px-3 py-2.5 text-xs border-b-2 whitespace-nowrap transition-colors ${activeFile === i ? 'border-primary-500 text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-dark-surface' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface/50'}`}>
                <FileCode size={13} /> {file.name}
              </button>
            ))}
          </div>
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <button onClick={() => copyCode(codeFiles[activeFile]?.content || '')} className="flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-hover rounded text-gray-600 dark:text-gray-400 transition-colors">
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
            <pre className="p-4 bg-gray-50 dark:bg-dark-bg text-xs font-mono text-gray-900 dark:text-gray-100 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
              {codeFiles[activeFile]?.content || 'No content'}
            </pre>
          </div>
        </motion.div>
      )}

      {issues.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Issues ({issues.length})</h3>
          <div className="space-y-2">
            {issues.map((issue: any) => {
              const sc = severityConfig[issue.severity] || severityConfig.low;
              return (
                <div key={issue.id} className="flex items-start gap-3 p-3 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-gray-900 dark:text-gray-200 capitalize">{issue.issue_type}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${sc.color}`}>{sc.label}</span>
                      {issue.file_path && <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{issue.file_path}:{issue.line_number}</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{issue.description}</p>
                    {issue.suggestion && (
                      <div className="mt-1.5 p-2 rounded bg-primary-50 dark:bg-primary-500/5 border border-primary-200 dark:border-primary-500/10">
                        <p className="text-[11px] text-primary-700 dark:text-primary-400"><span className="font-medium">Suggestion:</span> {issue.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MessageSquare size={16} className="text-primary-500" /> Comments ({comments.length})</h3>
        <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-6"><MessageSquare size={28} className="mx-auto text-gray-300 dark:text-gray-500 mb-2" /><p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet</p></div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border">
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 dark:text-primary-400 text-[11px] font-semibold">{comment.author_username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-200">{comment.author_username}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{comment.content}</p>
                  {comment.is_suggestion && comment.suggestion_text && (
                    <div className="mt-1.5 p-2 rounded bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-500/10">
                      <pre className="text-[11px] text-cyan-700 dark:text-cyan-300 font-mono whitespace-pre-wrap">{comment.suggestion_text}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="input flex-1" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()} />
          <button onClick={handleAddComment} disabled={commentLoading} className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-btn transition-all disabled:opacity-50"><Send size={15} /></button>
        </div>
      </motion.div>
    </div>
  );
};
