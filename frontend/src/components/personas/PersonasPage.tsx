import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Star, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const PersonasPage = () => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/personas').then(r => setPersonas(r.data.personas || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelect = async (personaId: string) => {
    if (!user) return;
    await api.patch('/repos/default/personas/selection', { persona_id: personaId });
  };

  const colorMap: Record<string, string> = {
    security: 'from-rose-500/10 to-orange-500/10 border-rose-200 dark:border-rose-500/20',
    performance: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-500/20',
    style: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-500/20',
    generalist: 'from-gray-500/10 to-gray-400/10 border-gray-200 dark:border-gray-600/20',
    mentor: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Review Personas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Choose the personality style for AI code reviews</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-dark-card rounded-card animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }} className={`p-5 rounded-card border bg-gradient-to-br ${colorMap[p.style] || colorMap.generalist} cursor-pointer transition-shadow hover:shadow-lg`} onClick={() => handleSelect(p.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/80 dark:bg-dark-card/80 rounded-lg"><Bot size={20} className="text-gray-700 dark:text-gray-300" /></div>
                {p.style === 'security' && <Star size={16} className="text-amber-400 fill-amber-400" />}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <Sparkles size={12} className="text-primary-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{p.style}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
