import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Cpu, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export const CostsPage = () => {
  const [summary, setSummary] = useState<any>({});
  const [byModel, setByModel] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get('/analytics/costs').then(r => {
      const d = r.data;
      setSummary({ total_cost: (d.totalCost || 0) / 100, total_events: d.totalEvents || 0, today_cost: 0, today_events: 0, total_tokens: d.totalTokens || 0 });
      setByModel(Object.entries(d.byModel || {}).map(([model, v]: any) => ({ model, total_cost: v.cost / 100 })));
      setRecent((d.recentEvents || []).slice(0, 10));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [timeframe]);

  const statCard = (icon: any, label: string, value: string, sub: string, color: string) => (
    <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Cost Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor AI API usage and spending</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5">
          {['day', 'week', 'month', 'all'].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${timeframe === t ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{t === 'all' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-dark-card rounded-card animate-pulse" />)}
          </>
        ) : (
          <>
            {statCard(<DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />, 'Total Cost', `$${(summary.total_cost || 0).toFixed(4)}`, `${summary.total_events || 0} API calls`, 'bg-emerald-50 dark:bg-emerald-500/10')}
            {statCard(<TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />, 'Today', `$${(summary.today_cost || 0).toFixed(4)}`, `${summary.today_events || 0} calls`, 'bg-blue-50 dark:bg-blue-500/10')}
            {statCard(<Cpu size={18} className="text-purple-600 dark:text-purple-400" />, 'Tokens Used', `${((summary.total_tokens || 0) / 1000).toFixed(1)}k`, 'Input + output combined', 'bg-purple-50 dark:bg-purple-500/10')}
            {statCard(<AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />, 'Avg Cost/Call', `$${(summary.total_cost / Math.max(summary.total_events || 1, 1)).toFixed(4)}`, 'Per analysis request', 'bg-amber-50 dark:bg-amber-500/10')}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Model</h3>
          {byModel.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byModel.map((m: any) => (
                <div key={m.model}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 dark:text-gray-400 font-mono truncate mr-2">{m.model.split('/').pop()}</span><span className="text-gray-900 dark:text-white font-medium">${(m.total_cost || 0).toFixed(4)}</span></div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min((m.total_cost / Math.max(summary.total_cost || 1, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent API Calls</h3>
        {recent.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No recent calls</p>
        ) : (
          <div className="space-y-2">
            {recent.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-dark-surface rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-gray-600 dark:text-gray-400">{e.feature}</span>
                  <span className="text-[10px] font-mono text-gray-400">{(e.model || '').split('/').pop()}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-gray-400">{e.tokens_in + e.tokens_out} tokens</span>
                  <span className="font-medium text-gray-900 dark:text-white">${(e.cost || 0).toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
