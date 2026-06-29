import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ruler, Trash2, Plus, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export const RulesPage = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'pattern', pattern: '', severity: 'warning', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/repos/repo-1/rules').then(r => setRules(r.data.rules || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post('/repos/repo-1/rules', form);
      setRules([...rules, res.data]);
      setShowAdd(false);
      setForm({ name: '', type: 'pattern', pattern: '', severity: 'warning', message: '' });
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/rules/${id}`);
    setRules(rules.filter(r => r.id !== id));
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await api.patch(`/rules/${id}`, { is_active: isActive });
    setRules(rules.map(r => r.id === id ? { ...r, is_active: isActive } : r));
  };

  const severityColor = (s: string) => {
    if (s === 'critical') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
    if (s === 'error') return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
    if (s === 'warning') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    return 'bg-gray-100 text-gray-600 dark:bg-dark-surface dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Review Rules</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Custom rules enforced during AI code analysis</p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all flex items-center gap-2">
          <Plus size={15} /> Add Rule
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Rule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Rule Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="No console.log" /></div>
            <div><label className="label">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                <option value="pattern">Pattern (regex)</option>
                <option value="max_lines">Max Lines</option>
                <option value="forbidden">Forbidden Terms</option>
                <option value="require">Require</option>
              </select>
            </div>
          </div>
          {form.type === 'pattern' && <div><label className="label">Regex Pattern</label><input value={form.pattern} onChange={e => setForm({...form, pattern: e.target.value})} className="input font-mono text-xs" placeholder="console\\.log\\(" /></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Severity</label>
              <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="input">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div><label className="label">Message</label><input value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="input" placeholder="Use logger instead" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-btn">{saving ? 'Saving...' : 'Save Rule'}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 dark:bg-dark-border text-sm rounded-btn">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-dark-card rounded-card animate-pulse" />)}</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border">
          <Ruler size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No rules configured</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add rules to enforce coding standards during AI review</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className={rule.severity === 'critical' ? 'text-rose-500' : rule.severity === 'error' ? 'text-orange-500' : rule.severity === 'warning' ? 'text-amber-500' : 'text-gray-400'} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{rule.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityColor(rule.severity)}`}>{rule.severity}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{rule.type}{rule.pattern ? `: ${rule.pattern}` : ''}</p>
                  {rule.message && <p className="text-[11px] text-gray-500 mt-0.5">{rule.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={rule.is_active} onChange={e => handleToggle(rule.id, e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-300 dark:bg-dark-border rounded-full peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-4 relative" />
                <button onClick={() => handleDelete(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
