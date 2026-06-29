import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Trash2, Plus } from 'lucide-react';
import api from '../../services/api';

export const IntegrationsPage = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ repo_owner: '', repo_name: '', access_token: '', webhook_secret: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/integrations/github').then(r => setConfigs(r.data.configs || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post('/integrations/github', form);
      setConfigs([...configs, res.data.config]);
      setShowAdd(false);
      setForm({ repo_owner: '', repo_name: '', access_token: '', webhook_secret: '' });
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/integrations/github/${id}`);
    setConfigs(configs.filter(c => c.id !== id));
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    await api.patch(`/integrations/github/${id}`, { [field]: value });
    setConfigs(configs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Connect GitHub repos for auto-reviews on pull requests</p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all flex items-center gap-2">
          <Plus size={15} /> Connect Repository
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Connect GitHub Repository</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Repo Owner</label><input value={form.repo_owner} onChange={e => setForm({...form, repo_owner: e.target.value})} className="input" placeholder="Rajeshkumar80" /></div>
            <div><label className="label">Repo Name</label><input value={form.repo_name} onChange={e => setForm({...form, repo_name: e.target.value})} className="input" placeholder="DevFlow" /></div>
          </div>
          <div><label className="label">GitHub Personal Access Token</label><input type="password" value={form.access_token} onChange={e => setForm({...form, access_token: e.target.value})} className="input" placeholder="ghp_xxxxxxxxxxxx" /></div>
          <div><label className="label">Webhook Secret</label><input value={form.webhook_secret} onChange={e => setForm({...form, webhook_secret: e.target.value})} className="input" placeholder="your-secret-string" /></div>
          <div className="p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Set this as your webhook URL in GitHub:</p>
            <code className="text-xs bg-gray-200 dark:bg-dark-border px-2 py-1 rounded font-mono">http://your-server:5000/api/v1/webhooks/github</code>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-btn">{saving ? 'Saving...' : 'Connect'}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 dark:bg-dark-border text-sm rounded-btn">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-dark-card rounded-card animate-pulse" />)}</div>
      ) : configs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border">
          <GitBranch size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No repositories connected</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Connect a repo to enable auto-reviews on pull requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-dark-surface rounded-lg"><GitBranch size={18} className="text-gray-500" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.repo_full_name}</p>
                  <p className="text-[11px] text-gray-400">Connected {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] text-gray-400">Auto-review</span>
                  <input type="checkbox" checked={c.auto_review} onChange={e => handleToggle(c.id, 'auto_review', e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-300 dark:bg-dark-border rounded-full peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-4 relative" />
                </label>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
