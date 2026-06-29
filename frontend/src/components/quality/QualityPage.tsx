import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import api from '../../services/api';

export const QualityPage = () => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/quality').then(r => {
      const snaps = r.data.snapshots || [];
      setSnapshots(snaps.map((s: any) => ({ ...s, month: s.period, total_reviews: s.review_count, issues_found: s.issue_count, critical_count: Math.round((s.critical_rate || 0) * (s.issue_count || 0)) })));
      const latest = snaps[snaps.length - 1] || {};
      setSummary({ avg_score: (latest.avg_score || 0) * 100, avg_issues: latest.issues_per_review || 0, critical_rate: (latest.critical_rate || 0) * 100, reviews_this_month: latest.review_count || 0, reviews_last_month: (snaps[snaps.length - 2]?.review_count || 0) });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const trendIcon = (t: string) => {
    if (t === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
    if (t === 'down') return <TrendingDown size={14} className="text-rose-500" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const metricCard = (label: string, current: string, trendDir: string, sub: string) => (
    <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{current}</p>
        {trendIcon(trendDir)}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Quality Trends</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track code quality metrics over time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCard('Average Score', `${(summary.avg_score || 0).toFixed(1)}%`, summary.score_trend || 'stable', 'Across all reviews')}
        {metricCard('Issues per Review', (summary.avg_issues || 0).toFixed(1), summary.issues_trend || 'stable', 'Average found per review')}
        {metricCard('Critical Rate', `${(summary.critical_rate || 0).toFixed(1)}%`, summary.critical_trend || 'stable', 'Critical issues percentage')}
        {metricCard('Reviews This Month', String(summary.reviews_this_month || 0), 'stable', `${summary.reviews_last_month || 0} last month`)}
      </div>

      <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Score Distribution (Last 12 Months)</h3>
        {loading ? (
          <div className="h-48 bg-gray-100 dark:bg-dark-surface rounded-lg animate-pulse" />
        ) : snapshots.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Activity size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs text-gray-400">No quality data yet</p>
              <p className="text-[10px] text-gray-400 mt-1">Quality metrics appear after the first few reviews</p>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {snapshots.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${s.month}\nScore: ${s.avg_score?.toFixed(1)}\nReviews: ${s.total_reviews}\nIssues: ${s.issues_found}`}>
                <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100">{s.avg_score?.toFixed(0)}%</span>
                <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-t-md overflow-hidden" style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((s.avg_score || 0) * 1.2, 4)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`w-full rounded-t-md ${(s.avg_score || 0) >= 80 ? 'bg-emerald-500' : (s.avg_score || 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  />
                </div>
                <span className="text-[9px] text-gray-400 truncate w-full text-center">{s.month?.split('-')[1] || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {snapshots.length > 0 && (
        <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Monthly Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Month</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Reviews</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Avg Score</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Issues</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Critical</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.slice(-6).map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-dark-border/50">
                    <td className="py-2 text-gray-900 dark:text-white font-medium">{s.month}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-400">{s.total_reviews}</td>
                    <td className="py-2 text-right"><span className={`font-medium ${(s.avg_score || 0) >= 80 ? 'text-emerald-600 dark:text-emerald-400' : (s.avg_score || 0) >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>{(s.avg_score || 0).toFixed(1)}%</span></td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-400">{s.issues_found}</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">{s.critical_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
