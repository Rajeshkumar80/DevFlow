import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, AlertTriangle, Bug, Shield, Zap, Clock, FileCode, ChevronDown, ChevronRight, Layers, Target, GitCommit, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { analysisApi } from '../../services/analysisApi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PulseCalendar = () => {
  const [hovered, setHovered] = useState<{ month: number; day: number } | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  const seededRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const today = new Date();
  const calendarData: { month: number; day: number; count: number; date: Date }[][] = [];

  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(2026, m + 1, 0).getDate();
    const monthCol: { month: number; day: number; count: number; date: Date }[] = [];
    for (let d = 1; d <= 31; d++) {
      if (d <= daysInMonth) {
        const date = new Date(2026, m, d);
        if (date > today) {
          monthCol.push({ month: m, day: d, count: -1, date });
        } else {
          const dayOfYear = m * 30 + d;
          const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;
          const baseChance = isWeekday ? 0.72 : 0.2;
          const monthBoost = (m >= 0 && m <= 2) ? 0.15 : (m >= 5 && m <= 7) ? -0.1 : 0;
          const hasActivity = seededRandom(dayOfYear * 137 + m * 31) < (baseChance + monthBoost);
          let count = 0;
          if (hasActivity) {
            const intensity = seededRandom(dayOfYear * 53 + m * 97);
            count = isWeekday
              ? intensity < 0.3 ? Math.floor(seededRandom(dayOfYear * 11) * 3) + 1
                : intensity < 0.65 ? Math.floor(seededRandom(dayOfYear * 23) * 5) + 3
                : intensity < 0.88 ? Math.floor(seededRandom(dayOfYear * 37) * 6) + 6
                : Math.floor(seededRandom(dayOfYear * 43) * 4) + 11
              : intensity < 0.6 ? Math.floor(seededRandom(dayOfYear * 19) * 2) + 1
                : Math.floor(seededRandom(dayOfYear * 29) * 3) + 2;
          }
          monthCol.push({ month: m, day: d, count, date });
        }
      }
    }
    calendarData.push(monthCol);
  }

  const getDotStyle = (count: number) => {
    if (count < 0) return { bg: 'bg-transparent', shadow: '' };
    if (count === 0) return { bg: 'bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.06]', shadow: '' };
    if (count <= 2) return { bg: 'bg-cyan-400/30 dark:bg-cyan-400/20', shadow: '0 0 6px rgba(34,211,238,0.15)' };
    if (count <= 5) return { bg: 'bg-cyan-400/50 dark:bg-cyan-400/35', shadow: '0 0 8px rgba(34,211,238,0.25)' };
    if (count <= 8) return { bg: 'bg-cyan-400/70 dark:bg-cyan-400/50', shadow: '0 0 10px rgba(34,211,238,0.35)' };
    return { bg: 'bg-cyan-400 dark:bg-cyan-300', shadow: '0 0 14px rgba(34,211,238,0.5)' };
  };

  const hoveredData = hovered ? calendarData[hovered.month]?.[hovered.day - 1] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Year in Review</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Daily review activity for 2026</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Less</span>
          {['bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.06]',
            'bg-cyan-400/30 dark:bg-cyan-400/20',
            'bg-cyan-400/50 dark:bg-cyan-400/35',
            'bg-cyan-400/70 dark:bg-cyan-400/50',
            'bg-cyan-400 dark:bg-cyan-300'
          ].map((c, i) => (
            <div key={i} className={`w-[10px] h-[10px] rounded-full ${c}`} />
          ))}
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-4 min-w-max">
          {calendarData.map((monthDays, monthIdx) => (
            <div key={monthIdx} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">{MONTHS[monthIdx]}</span>
              {monthDays.map((cell) => {
                const style = getDotStyle(cell.count);
                return (
                  cell.count < 0 ? (
                    <div key={cell.day} className="w-[10px] h-[10px]" />
                  ) : (
                    <motion.div
                      key={cell.day}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: (monthIdx * 31 + cell.day) * 0.001,
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      onMouseEnter={(e) => {
                        setHovered({ month: monthIdx, day: cell.day });
                        setTipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => setTipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHovered(null)}
                      className={`w-[10px] h-[10px] rounded-full cursor-pointer transition-all duration-150 hover:scale-[1.6] hover:z-10 relative ${style.bg}`}
                      style={{ boxShadow: style.shadow }}
                    />
                  )
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {hoveredData && hoveredData.count >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl pointer-events-none border border-gray-700/50"
            style={{ left: tipPos.x + 12, top: tipPos.y - 44 }}
          >
            <span className="font-semibold">{hoveredData.count} reviews</span>
            <span className="text-gray-400 ml-1.5">{hoveredData.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScoreRing = ({ score, max = 5, size = 72 }: { score: number; max?: number; size?: number }) => {
  const pct = (score / max) * 100;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-dark-surface" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-gray-900 dark:text-white">{score.toFixed(1)}</span>
      </div>
    </div>
  );
};

const IssueTree = ({ issues }: { issues: any[] }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const grouped = issues.reduce((acc: any, issue: any) => {
    const key = issue.file_path || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue);
    return acc;
  }, {});

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-500/10';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-gray-500 bg-gray-50 dark:bg-dark-surface';
    }
  };

  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([file, fileIssues]: [string, any]) => (
        <div key={file}>
          <button onClick={() => toggle(file)} className="flex items-center gap-2 w-full px-3 py-2 rounded-btn hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left">
            {expanded[file] ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            <FileCode size={13} className="text-primary-500" />
            <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1">{file}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{(fileIssues as any[]).length}</span>
          </button>
          <AnimatePresence>
            {expanded[file] && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-6">
                {(fileIssues as any[]).map((issue: any) => (
                  <div key={issue.id} className="flex items-start gap-2 px-3 py-2 text-xs border-l border-gray-100 dark:border-dark-border">
                    <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${severityColor(issue.severity)}`}>{issue.severity}</span>
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{issue.issue_type}</span>
                        {issue.line_number && <span className="text-gray-400 dark:text-gray-500 font-mono">L{issue.line_number}</span>}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

const TooltipBar = ({ value, label, sublabel, color, maxVal, delay = 0 }: {
  value: number; label: string; sublabel: string; color: string; maxVal: number; delay?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const barH = (value / maxVal) * 100;

  return (
    <div className="flex flex-col items-center" style={{ flex: 1 }}>
      <div
        className="relative w-full cursor-pointer"
        style={{ height: '100%' }}
        onMouseEnter={(e) => { setHovered(true); setPos({ x: e.clientX, y: e.clientY }); }}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="absolute bottom-0 w-full flex justify-center">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: barH }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className="rounded-t-md transition-opacity hover:opacity-80"
            style={{ width: '70%', backgroundColor: color, boxShadow: `0 0 12px ${color}44` }}
          />
        </div>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl pointer-events-none border border-gray-700/50"
            style={{ left: pos.x + 12, top: pos.y - 50 }}
          >
            <div className="font-semibold">{label}</div>
            <div className="text-gray-400">{sublabel}: <span style={{ color }}>{value}</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TooltipHorizontalBar = ({ label, count, total, color, icon: Icon, delay = 0 }: {
  label: string; count: number; total: number; color: string; icon: any; delay?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pct = (count / (total || 1)) * 100;

  return (
    <div
      className="flex items-center gap-3 cursor-pointer group"
      onMouseEnter={(e) => { setHovered(true); setPos({ x: e.clientX, y: e.clientY }); }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={13} className="text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500 dark:text-gray-400 w-14">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden group-hover:ring-1 group-hover:ring-gray-300 dark:group-hover:ring-gray-600 transition-all">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay, duration: 0.6 }} className={`h-full ${color} rounded-full`} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl pointer-events-none border border-gray-700/50"
            style={{ left: pos.x + 12, top: pos.y - 44 }}
          >
            <span className="font-semibold">{label}</span>
            <span className="text-gray-400 ml-1.5">{count} issues ({pct.toFixed(0)}%)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContributorBar = ({ member, index }: { member: { name: string; reviews: number; pct: number }; index: number }) => {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      className="flex items-center gap-3 cursor-pointer group"
      onMouseEnter={(e) => { setHovered(true); setPos({ x: e.clientX, y: e.clientY }); }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-primary-700 dark:text-primary-400 text-[10px] font-semibold">{member.name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{member.name}</span>
          <span className="text-[10px] text-gray-400">{member.reviews}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-dark-surface rounded-full mt-1 overflow-hidden group-hover:ring-1 group-hover:ring-gray-300 dark:group-hover:ring-gray-600 transition-all">
          <motion.div initial={{ width: 0 }} animate={{ width: `${member.pct}%` }} transition={{ delay: 0.3 + index * 0.1 }} className="h-full bg-primary-500 dark:bg-primary-400 rounded-full" />
        </div>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl pointer-events-none border border-gray-700/50"
            style={{ left: pos.x + 12, top: pos.y - 44 }}
          >
            <span className="font-semibold">{member.name}</span>
            <span className="text-gray-400 ml-1.5">{member.reviews} reviews · {member.pct}% of total</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'tree' | 'calendar'>('overview');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [a, { issues: is }] = await Promise.all([
        fetch('http://localhost:5000/api/v1/analytics/team/team-1').then(r => r.json()),
        analysisApi.getIssues('review-1')
      ]);
      setAnalytics(a);
      setIssues(is || []);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-dark-card rounded-card animate-pulse" />)}</div>;

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;
  const totalIssues = criticalCount + highCount + mediumCount + lowCount || 1;

  const trendScores = [4.2, 4.5, 3.8, 4.7, 4.1, 3.9, 4.4];
  const trendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trendMax = 180;

  const velocityData = [12, 18, 8, 22, 15, 10, 20, 14, 25, 16, 12, 28];
  const velocityMax = 30;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Performance insights & code quality metrics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-surface rounded-btn w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'issues', label: 'Issues', icon: AlertTriangle },
          { id: 'tree', label: 'Issue Tree', icon: Layers },
          { id: 'calendar', label: 'Activity', icon: RefreshCw },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: FileCode, label: 'Total Reviews', value: analytics?.total_reviews || 127, change: '+12%', up: true, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
                { icon: GitCommit, label: 'Commits Analyzed', value: '1.2k', change: '+18%', up: true, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                { icon: AlertTriangle, label: 'Issues Found', value: issues.length || 10, change: '-5%', up: false, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { icon: Clock, label: 'Avg Review Time', value: `${analytics?.avg_review_time_hours || 7.7}h`, change: '-1.2h', up: false, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon size={18} /></div>
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Score Ring + Severity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Overall AI Score</p>
                <ScoreRing score={analytics?.avg_ai_score || 4.1} />
                <div className="flex gap-6 mt-4 text-center">
                  <div><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{analytics?.total_reviews || 127}</p><p className="text-[10px] text-gray-400">Reviews</p></div>
                  <div><p className="text-lg font-bold text-primary-600 dark:text-primary-400">{analytics?.total_comments || 489}</p><p className="text-[10px] text-gray-400">Comments</p></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">Issue Severity</p>
                <div className="space-y-3">
                  {[
                    { label: 'Critical', count: criticalCount, color: 'bg-rose-500', icon: Bug },
                    { label: 'High', count: highCount, color: 'bg-orange-500', icon: Shield },
                    { label: 'Medium', count: mediumCount, color: 'bg-amber-500', icon: Zap },
                    { label: 'Low', count: lowCount, color: 'bg-gray-400', icon: Target },
                  ].map((sev, i) => (
                    <TooltipHorizontalBar key={i} label={sev.label} count={sev.count} total={totalIssues} color={sev.color} icon={sev.icon} delay={0.3 + i * 0.1} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* AI Scores Trend */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Scores Trend (Last 7 Reviews)</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-gray-400">4.0+</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] text-gray-400">3.0-3.9</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-gray-400">&lt;3.0</span></div>
                </div>
              </div>
              <div className="flex items-end justify-between" style={{ height: trendMax }}>
                {trendScores.map((score, i) => {
                  const bg = score >= 4 ? 'rgb(16,185,129)' : score >= 3 ? 'rgb(245,158,11)' : 'rgb(239,68,68)';
                  return (
                    <TooltipBar
                      key={i}
                      value={score}
                      label={trendLabels[i]}
                      sublabel="AI Score"
                      color={bg}
                      maxVal={5}
                      delay={i * 0.06}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                {trendLabels.map((l, i) => (
                  <span key={i} className="text-[10px] text-gray-400 dark:text-gray-500 font-medium" style={{ flex: 1, textAlign: 'center' }}>{l}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Issues */}
        {activeTab === 'issues' && (
          <motion.div key="issues" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Critical', count: criticalCount, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', icon: Bug },
                { label: 'High', count: highCount, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', icon: Shield },
                { label: 'Medium', count: mediumCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Zap },
                { label: 'Low', count: lowCount, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-dark-surface', icon: Target },
              ].map((sev, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card text-center">
                  <div className={`inline-flex p-2 rounded-lg ${sev.bg} ${sev.color} mb-2`}><sev.icon size={20} /></div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sev.count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sev.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card divide-y divide-gray-100 dark:divide-dark-border">
              {issues.map((issue, i) => (
                <motion.div key={issue.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${issue.severity === 'critical' ? 'text-rose-500' : issue.severity === 'high' ? 'text-orange-500' : issue.severity === 'medium' ? 'text-amber-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-gray-900 dark:text-gray-200 capitalize">{issue.issue_type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          issue.severity === 'critical' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                          issue.severity === 'high' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                          issue.severity === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-gray-100 text-gray-600 dark:bg-dark-surface dark:text-gray-400'
                        }`}>{issue.severity}</span>
                        {issue.file_path && <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{issue.file_path}:{issue.line_number}</span>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{issue.description}</p>
                      {issue.suggestion && (
                        <div className="mt-2 p-2 rounded bg-primary-50 dark:bg-primary-500/5 border border-primary-200 dark:border-primary-500/10">
                          <p className="text-[11px] text-primary-700 dark:text-primary-400"><span className="font-medium">Suggestion:</span> {issue.suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tree */}
        {activeTab === 'tree' && (
          <motion.div key="tree" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={16} className="text-primary-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Issue Tree</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">({issues.length} issues · {new Set(issues.map(i => i.file_path)).size} files)</span>
              </div>
              <IssueTree issues={issues} />
            </div>
          </motion.div>
        )}

        {/* Activity Calendar */}
        {activeTab === 'calendar' && (
          <motion.div key="calendar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card p-5">
              <PulseCalendar />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Top Contributors */}
              <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">Top Contributors</p>
                <div className="space-y-3">
                  {[
                    { name: 'Demo User', reviews: 45, pct: 90 },
                    { name: 'John Dev', reviews: 32, pct: 64 },
                    { name: 'Sarah Chen', reviews: 28, pct: 56 },
                    { name: 'Mike Rod', reviews: 22, pct: 44 },
                  ].map((member, i) => (
                    <ContributorBar key={i} member={member} index={i} />
                  ))}
                </div>
              </div>

              {/* Code Quality Breakdown */}
              <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">Review Velocity (12 Weeks)</p>
                <div className="flex items-end gap-2 h-28">
                  {velocityData.map((val, i) => (
                    <TooltipBar
                      key={i}
                      value={val}
                      label={`Week ${i + 1}`}
                      sublabel="Reviews"
                      color="rgb(139,92,246)"
                      maxVal={velocityMax}
                      delay={i * 0.04}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                  {velocityData.map((_, i) => <span key={i} style={{ flex: 1, textAlign: 'center' }}>W{i + 1}</span>)}
                </div>
              </div>
            </div>

            {/* Code Quality Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Bugs', count: 3, icon: Bug, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                { label: 'Security', count: 4, icon: Shield, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                { label: 'Performance', count: 2, icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { label: 'Style', count: 1, icon: RefreshCw, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-dark-surface' },
              ].map((cat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card text-center">
                  <div className={`inline-flex p-2 rounded-lg ${cat.bg} ${cat.color} mb-2`}><cat.icon size={18} /></div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{cat.count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{cat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
