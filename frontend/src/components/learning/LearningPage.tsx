import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Server, Shield, Zap, TrendingUp, ChevronRight, Lightbulb } from 'lucide-react';

const skillCategories = [
  { name: 'TypeScript', icon: Code, level: 'Advanced', progress: 85, color: 'bg-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', iconColor: 'text-primary-600 dark:text-primary-400' },
  { name: 'React', icon: Code, level: 'Advanced', progress: 78, color: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'Node.js', icon: Server, level: 'Intermediate', progress: 62, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'PostgreSQL', icon: Server, level: 'Intermediate', progress: 55, color: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400' },
  { name: 'Security', icon: Shield, level: 'Beginner', progress: 30, color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', iconColor: 'text-rose-600 dark:text-rose-400' },
  { name: 'Performance', icon: Zap, level: 'Intermediate', progress: 45, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
];

const learningPaths = [
  { title: 'Advanced TypeScript Patterns', lessons: 12, completed: 8, category: 'TypeScript' },
  { title: 'React Performance Optimization', lessons: 10, completed: 3, category: 'React' },
  { title: 'Database Design & Optimization', lessons: 15, completed: 0, category: 'Databases' },
  { title: 'API Security Best Practices', lessons: 8, completed: 2, category: 'Security' },
];

export const LearningPage = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'paths'>('skills');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Learning & Growth</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-card rounded-btn p-0.5">
          <button onClick={() => setActiveTab('skills')} className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${activeTab === 'skills' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Skills</button>
          <button onClick={() => setActiveTab('paths')} className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${activeTab === 'paths' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Learning Paths</button>
        </div>
      </div>

      {activeTab === 'skills' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillCategories.map((skill) => (
            <motion.div key={skill.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${skill.bg} ${skill.iconColor}`}><skill.icon size={18} /></div>
                <div><h3 className="font-medium text-gray-900 dark:text-white text-[13px]">{skill.name}</h3><p className="text-[11px] text-gray-500 dark:text-gray-400">{skill.level}</p></div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${skill.color}`} style={{ width: `${skill.progress}%` }} />
              </div>
              <p className="text-right text-[11px] text-gray-400 dark:text-gray-500 mt-1">{skill.progress}%</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {learningPaths.map((path) => (
            <motion.div key={path.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 flex items-center gap-4 hover:border-gray-300 dark:hover:border-dark-border transition-all cursor-pointer group shadow-card">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white text-[13px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{path.title}</h3>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-gray-400">{path.category}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span><BookOpen size={12} className="inline mr-1" />{path.completed}/{path.lessons} lessons</span>
                  <span><TrendingUp size={12} className="inline mr-1" />{Math.round((path.completed / path.lessons) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full h-1 mt-2 overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(path.completed / path.lessons) * 100}%` }} />
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
            </motion.div>
          ))}
          <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-8 text-center shadow-card">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
              <Lightbulb size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">AI-Recommended Paths</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Complete more reviews to get personalized learning recommendations</p>
          </div>
        </div>
      )}
    </div>
  );
};
