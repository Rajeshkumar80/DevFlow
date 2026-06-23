import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, Server, Shield, Zap, ChevronRight, Lightbulb, Target, Flame, Star, CheckCircle, ArrowUpRight, Clock, Award, Sparkles, Play } from 'lucide-react';

const skillCategories = [
  { name: 'TypeScript', icon: Code, level: 'Advanced', progress: 85, color: 'bg-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', iconColor: 'text-primary-600 dark:text-primary-400', hours: 48, projects: 12 },
  { name: 'React', icon: Code, level: 'Advanced', progress: 78, color: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', iconColor: 'text-cyan-600 dark:text-cyan-400', hours: 42, projects: 8 },
  { name: 'Node.js', icon: Server, level: 'Intermediate', progress: 62, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400', hours: 35, projects: 6 },
  { name: 'PostgreSQL', icon: Server, level: 'Intermediate', progress: 55, color: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400', hours: 28, projects: 4 },
  { name: 'Security', icon: Shield, level: 'Beginner', progress: 30, color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', iconColor: 'text-rose-600 dark:text-rose-400', hours: 15, projects: 2 },
  { name: 'Performance', icon: Zap, level: 'Intermediate', progress: 45, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400', hours: 22, projects: 3 },
];

const learningPaths = [
  { title: 'Advanced TypeScript Patterns', lessons: 12, completed: 8, category: 'TypeScript', difficulty: 'Advanced', duration: '4h', rating: 4.8 },
  { title: 'React Performance Optimization', lessons: 10, completed: 3, category: 'React', difficulty: 'Intermediate', duration: '3.5h', rating: 4.6 },
  { title: 'Database Design & Optimization', lessons: 15, completed: 0, category: 'Databases', difficulty: 'Intermediate', duration: '6h', rating: 4.7 },
  { title: 'API Security Best Practices', lessons: 8, completed: 2, category: 'Security', difficulty: 'Beginner', duration: '2.5h', rating: 4.5 },
  { title: 'System Design Fundamentals', lessons: 20, completed: 0, category: 'Architecture', difficulty: 'Advanced', duration: '8h', rating: 4.9 },
  { title: 'GraphQL Complete Guide', lessons: 14, completed: 0, category: 'API', difficulty: 'Intermediate', duration: '5h', rating: 4.4 },
];

const weeklyStreak = [
  { day: 'Mon', done: true, reviews: 3 },
  { day: 'Tue', done: true, reviews: 5 },
  { day: 'Wed', done: true, reviews: 2 },
  { day: 'Thu', done: false, reviews: 0 },
  { day: 'Fri', done: true, reviews: 4 },
  { day: 'Sat', done: false, reviews: 0 },
  { day: 'Sun', done: false, reviews: 0 },
];

const suggestions = [
  { title: 'Learn SQL Injection Prevention', reason: 'Found 2 security issues in recent reviews', category: 'Security', priority: 'high', icon: Shield, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  { title: 'Master React Memo & useMemo', reason: 'Performance issues detected in 3 reviews', category: 'Performance', priority: 'high', icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { title: 'Practice TypeScript Generics', reason: 'Type safety improvements needed', category: 'TypeScript', priority: 'medium', icon: Code, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
  { title: 'Study Database Indexing', reason: 'N+1 queries found in code reviews', category: 'Databases', priority: 'medium', icon: Server, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { title: 'Learn Error Boundary Patterns', reason: 'Improve error handling in React apps', category: 'React', priority: 'low', icon: Code, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
  { title: 'Explore WebSocket Best Practices', reason: 'Enhance real-time features', category: 'Architecture', priority: 'low', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
];

const resources = [
  { title: 'TypeScript Handbook', type: 'Documentation', url: '#', icon: BookOpen },
  { title: 'React Patterns', type: 'Article', url: '#', icon: Code },
  { title: 'Node.js Best Practices', type: 'Guide', url: '#', icon: Server },
  { title: 'OWASP Top 10', type: 'Security', url: '#', icon: Shield },
];

const goals = [
  { title: 'Complete 5 code reviews this week', progress: 3, total: 5, type: 'reviews' },
  { title: 'Finish TypeScript learning path', progress: 8, total: 12, type: 'lessons' },
  { title: 'Study 10 hours this month', progress: 7, total: 10, type: 'hours' },
  { title: 'Fix 5 security issues', progress: 2, total: 5, type: 'issues' },
];

export const LearningPage = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'paths' | 'suggestions'>('skills');
  const currentStreak = 5;
  const totalHours = skillCategories.reduce((a, s) => a + s.hours, 0);
  const avgProgress = Math.round(skillCategories.reduce((a, s) => a + s.progress, 0) / skillCategories.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Learning & Growth</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your skills, streaks, and learning progress</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Day Streak', value: `${currentStreak} days`, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { icon: Clock, label: 'Total Hours', value: `${totalHours}h`, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
          { icon: Target, label: 'Avg Progress', value: `${avgProgress}%`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: Award, label: 'Skills Learned', value: skillCategories.length, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} w-fit mb-2`}><stat.icon size={16} /></div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Streak */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Activity</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{currentStreak} day streak</span>
        </div>
        <div className="flex items-end gap-3">
          {weeklyStreak.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                <motion.div initial={{ height: 0 }} animate={{ height: day.done ? `${Math.max(day.reviews * 12, 20)}%` : '8px' }} transition={{ delay: i * 0.05, type: 'spring' }} className={`w-full max-w-[40px] rounded-t ${day.done ? 'bg-orange-500 dark:bg-orange-400' : 'bg-gray-100 dark:bg-dark-surface'}`} />
              </div>
              <span className={`text-[11px] font-medium ${day.done ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>{day.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-surface rounded-btn w-fit">
        {[
          { id: 'skills', label: 'Skills', icon: Code },
          { id: 'paths', label: 'Learning Paths', icon: BookOpen },
          { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <motion.div key="skills" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {/* Radar-like visual */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Skill Overview</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {skillCategories.map((skill, i) => (
                  <motion.div key={skill.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-dark-surface" />
                        <motion.circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={176} initial={{ strokeDashoffset: 176 }} animate={{ strokeDashoffset: 176 - (skill.progress / 100) * 176 }} transition={{ duration: 1, delay: i * 0.1 }} className={skill.iconColor} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{skill.progress}%</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{skill.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{skill.level}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Detailed Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillCategories.map((skill, i) => (
                <motion.div key={skill.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${skill.bg} ${skill.iconColor}`}><skill.icon size={18} /></div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white text-[13px]">{skill.name}</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{skill.level}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full h-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${skill.progress}%` }} transition={{ delay: 0.3 + i * 0.05 }} className={`h-full rounded-full ${skill.color}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <span>{skill.hours}h studied</span>
                    <span>{skill.projects} projects</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <motion.div key="paths" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="space-y-2">
              {learningPaths.map((path, i) => (
                <motion.div key={path.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-500/20 transition-all cursor-pointer group shadow-card">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">
                    <Play size={16} className="text-primary-600 dark:text-primary-400 ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white text-[13px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{path.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        path.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        path.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      }`}>{path.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><BookOpen size={11} /> {path.completed}/{path.lessons} lessons</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {path.duration}</span>
                      <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {path.rating}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full h-1 mt-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(path.completed / path.lessons) * 100}%` }} transition={{ delay: 0.3 }} className="h-full bg-primary-500 rounded-full" />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors flex-shrink-0" />
                </motion.div>
              ))}
            </div>

            {/* Resources */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Resources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {resources.map((res, i) => (
                  <motion.a key={i} href={res.url} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all group">
                    <div className="p-1.5 rounded bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-gray-400 group-hover:text-primary-500 transition-colors"><res.icon size={14} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{res.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{res.type}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <motion.div key="suggestions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {/* Goals */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Goals</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.map((goal, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${goal.progress >= goal.total ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                      {goal.progress >= goal.total ? <CheckCircle size={16} /> : <Target size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-900 dark:text-gray-100 truncate">{goal.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-bg rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(goal.progress / goal.total) * 100}%` }} transition={{ delay: 0.3 }} className={`h-full rounded-full ${goal.progress >= goal.total ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{goal.progress}/{goal.total}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium">Based on your reviews</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((sug, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 p-3.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-all cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-dark-border">
                    <div className={`p-2 rounded-lg h-fit ${sug.bg} ${sug.color} group-hover:scale-110 transition-transform`}><sug.icon size={15} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{sug.title}</h4>
                        {sug.priority === 'high' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">Priority</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sug.reason}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 mt-1 flex-shrink-0 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-500/5 dark:to-violet-500/5 rounded-card border border-primary-100 dark:border-primary-500/10 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"><Lightbulb size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Pro Tip</h4>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Review at least 3 pull requests per day to maintain your streak and improve your code quality score. Focus on areas where you have medium-level skills for maximum growth.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
