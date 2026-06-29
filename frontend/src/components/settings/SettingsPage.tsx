import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Palette, Key, Save, Check, Moon, Sun, Monitor, Users, Mail, X, Copy, Trash2, Crown, ExternalLink, Zap, Loader2, AlertCircle, GitBranch, Ruler, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import api from '../../services/api';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: GitBranch },
  { id: 'rules', label: 'Rules', icon: Ruler },
  { id: 'personas', label: 'AI Personas', icon: Sparkles },
];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'reviewer' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
}

const ApiKeysTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings');
        setMaskedKey(res.data.apiKey || '');
        setHasKey(res.data.hasApiKey);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const body: any = {};
      if (apiKey) body.apiKey = apiKey;
      await api.post('/settings', body);
      setHasKey(true);
      if (apiKey) setMaskedKey('••••••••' + apiKey.slice(-6));
      setApiKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 text-gray-400"><Loader2 size={16} className="animate-spin" /> Loading...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Configuration</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Connect OpenRouter to enable real AI-powered code reviews.</p>
      </div>

      {hasKey && (
        <div className="flex items-center gap-2 p-3 rounded-btn bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">AI Connected</span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">— {maskedKey}</span>
        </div>
      )}

      <div className="p-4 rounded-btn bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Zap size={16} className="text-white" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">AI-Powered Reviews</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Access 100+ AI models with a single API key</p>
          </div>
        </div>
        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          Get API Key from OpenRouter <ExternalLink size={12} />
        </a>
      </div>

      <div className="space-y-3">
        <label className="label">OpenRouter API Key</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input flex-1 font-mono text-xs"
            placeholder={hasKey ? 'Enter new key to update...' : 'sk-or-v1-...'}
          />
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1"><Shield size={11} /> Stored securely on the server. Never exposed to the browser.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-btn bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 dark:border-dark-border flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-btn transition-all active:scale-[0.98] flex items-center gap-2 text-sm disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : 'Save AI Settings'}
        </button>
        {saved && (
          <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm">
            <Check size={15} /> Saved!
          </motion.span>
        )}
      </div>
    </div>
  );
};

const TeamTab = () => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'reviewer' | 'viewer'>('reviewer');
  const [inviteCode, setInviteCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Alex Johnson', email: 'alex@devflow.ai', role: 'admin', status: 'active', joinedAt: new Date('2025-01-15') },
    { id: '2', name: 'Sarah Chen', email: 'sarah@devflow.ai', role: 'reviewer', status: 'active', joinedAt: new Date('2025-03-20') },
    { id: '3', name: 'Mike Rivera', email: 'mike@devflow.ai', role: 'reviewer', status: 'active', joinedAt: new Date('2025-06-10') },
    { id: '4', name: 'Emily Park', email: 'emily@devflow.ai', role: 'viewer', status: 'pending', joinedAt: new Date('2026-01-05') },
  ]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(inviteEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      setEmailError('This email is already a team member');
      return;
    }
    setEmailError('');
    const newMember: TeamMember = { id: String(Date.now()), name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole, status: 'pending', joinedAt: new Date() };
    setMembers([...members, newMember]);
    setInviteEmail('');
    setInviteRole('reviewer');
    setInviteOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://devflow.ai/invite/abc123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('DEVFLOW-TEAM-2026');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleJoinWithCode = () => {
    if (!inviteCode.trim()) {
      setCodeError('Please enter an invite code');
      return;
    }
    if (inviteCode.trim().toUpperCase() !== 'DEVFLOW-TEAM-2026') {
      setCodeError('Invalid invite code');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === 'new@devflow.ai')) {
      setCodeError('You have already joined the team');
      return;
    }
    setCodeError('');
    const newMember: TeamMember = { id: String(Date.now()), name: 'New Member', email: 'new@devflow.ai', role: 'viewer', status: 'active', joinedAt: new Date() };
    setMembers([...members, newMember]);
    setInviteCode('');
    alert('Successfully joined the team!');
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const roleColors = { admin: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', reviewer: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400', viewer: 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400' };
  const statusColors = { active: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', pending: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', inactive: 'bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-gray-500' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Team Members</h2>
        <div className="flex gap-2">
          <button onClick={handleCopyLink} className="px-3 py-1.5 rounded-btn border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-xs font-medium flex items-center gap-1.5">
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />} Copy Invite Link
          </button>
          <button onClick={() => setInviteOpen(true)} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-btn transition-all text-xs flex items-center gap-1.5">
            <Mail size={13} /> Invite Member
          </button>
        </div>
      </div>

      <AnimatePresence>
        {inviteOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-4 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Invite Team Member</p>
                <button onClick={() => { setInviteOpen(false); setEmailError(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={16} /></button>
              </div>
              <input value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); setEmailError(''); }} className={`input ${emailError ? 'border-red-500 dark:border-red-500' : ''}`} placeholder="email@example.com" type="email" />
              {emailError && <p className="text-xs text-red-500 dark:text-red-400">{emailError}</p>}
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'reviewer' | 'viewer')} className="input">
                <option value="admin">Admin</option>
                <option value="reviewer">Reviewer</option>
                <option value="viewer">Viewer</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setInviteOpen(false); setEmailError(''); }} className="px-3 py-1.5 rounded-btn border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover text-xs">Cancel</button>
                <button onClick={handleInvite} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-btn text-xs font-medium">Send Invite</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Invite Code</p>
          <button onClick={handleCopyCode} className="px-2.5 py-1 rounded-btn border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-[11px] font-medium flex items-center gap-1.5">
            {codeCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} {codeCopied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <code className="block text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-dark-bg px-3 py-2 rounded-btn border border-gray-200 dark:border-dark-border select-all">DEVFLOW-TEAM-2026</code>
        <div className="flex gap-2">
          <input value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setCodeError(''); }} className="input flex-1" placeholder="Enter invite code to join" />
          <button onClick={handleJoinWithCode} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-btn text-xs font-medium transition-all">Join</button>
        </div>
        {codeError && <p className="text-xs text-red-500 dark:text-red-400">{codeError}</p>}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{member.name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColors[member.role]}`}>{member.role}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[member.status]}`}>{member.status}</span>
              {member.role === 'admin' && <Crown size={14} className="text-amber-500" />}
              {member.role !== 'admin' && <button onClick={() => handleRemoveMember(member.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IntegrationsTab = () => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">GitHub Integrations</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-btn transition-all flex items-center gap-1.5">
          <GitBranch size={13} /> Connect Repository
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">Auto-review pull requests when they're opened on GitHub.</p>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-50 dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Repo Owner</label><input value={form.repo_owner} onChange={e => setForm({...form, repo_owner: e.target.value})} className="input" placeholder="Rajeshkumar80" /></div>
            <div><label className="label">Repo Name</label><input value={form.repo_name} onChange={e => setForm({...form, repo_name: e.target.value})} className="input" placeholder="DevFlow" /></div>
          </div>
          <div><label className="label">GitHub Access Token</label><input type="password" value={form.access_token} onChange={e => setForm({...form, access_token: e.target.value})} className="input" placeholder="ghp_xxx" /></div>
          <div><label className="label">Webhook Secret</label><input value={form.webhook_secret} onChange={e => setForm({...form, webhook_secret: e.target.value})} className="input" placeholder="your-secret" /></div>
          <p className="text-[10px] text-gray-400">Webhook URL: <code className="bg-gray-200 dark:bg-dark-border px-1 rounded">http://your-server:5000/api/v1/webhooks/github</code></p>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-btn">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-gray-200 dark:bg-dark-border text-xs rounded-btn">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? <div className="text-xs text-gray-400">Loading...</div> : configs.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-xs">No repositories connected yet</div>
      ) : (
        <div className="space-y-2">
          {configs.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <GitBranch size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{c.repo_full_name}</p>
                  <p className="text-[10px] text-gray-400">Connected {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[10px] text-gray-400">Auto-review</span>
                  <input type="checkbox" checked={c.auto_review} onChange={e => handleToggle(c.id, 'auto_review', e.target.checked)} className="sr-only peer" />
                  <div className="w-8 h-4 bg-gray-300 dark:bg-dark-border rounded-full peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-4 relative" />
                </label>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RulesTab = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'pattern', pattern: '', severity: 'warning', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/repos/default/rules').then(r => setRules(r.data.rules || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post('/repos/default/rules', form);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Review Rules</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-btn transition-all flex items-center gap-1.5">
          <Ruler size={13} /> Add Rule
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Custom rules enforced during AI analysis.</p>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-50 dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-btn">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-gray-200 dark:bg-dark-border text-xs rounded-btn">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? <div className="text-xs text-gray-400">Loading...</div> : rules.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-xs">No rules configured. Add rules to enforce coding standards.</div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityColor(rule.severity)}`}>{rule.severity}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{rule.type}{rule.pattern ? `: ${rule.pattern}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={rule.is_active} onChange={e => handleToggle(rule.id, e.target.checked)} className="sr-only peer" />
                <div className="w-8 h-4 bg-gray-300 dark:bg-dark-border rounded-full peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-4 relative" />
                <button onClick={() => handleDelete(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PersonasTab = () => {
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('strict');

  const defaultPersonas = [
    { name: 'strict', display_name: 'Strict Reviewer', description: 'Extremely critical. Finds every possible issue.', icon: '🔍', tone: 'demanding' },
    { name: 'security', display_name: 'Security Auditor', description: 'Focuses exclusively on security vulnerabilities.', icon: '🛡️', tone: 'cautious' },
    { name: 'performance', display_name: 'Performance Expert', description: 'Optimizes for speed and efficiency.', icon: '⚡', tone: 'optimizing' },
    { name: 'friendly', display_name: 'Friendly Mentor', description: 'Encouraging. Points out issues gently.', icon: '😊', tone: 'supportive' },
    { name: 'junior', display_name: 'Teaching Reviewer', description: 'Explains everything for learning.', icon: '📚', tone: 'educational' },
  ];

  useEffect(() => {
    api.get('/personas').then(r => {
      const all = r.data.personas || [];
      const saved = all.find((p: any) => p.selected);
      if (saved) setSelected(saved.name);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelect = async (name: string) => {
    setSelected(name);
    try { await api.post('/settings', { default_persona: name }); } catch {}
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Review Personas</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">Choose how the AI reviewer analyzes your code.</p>

      {loading ? <div className="text-xs text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-1 gap-3">
          {defaultPersonas.map(p => (
            <motion.button
              key={p.name}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelect(p.name)}
              className={`flex items-start gap-3 p-4 rounded-card border text-left transition-all ${selected === p.name ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500 ring-1 ring-primary-500/20' : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover'}`}
            >
              <span className="text-2xl mt-0.5">{p.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.display_name}</p>
                  {selected === p.name && <span className="text-[10px] px-1.5 py-0.5 bg-primary-600 text-white rounded-full">Active</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.description}</p>
                <p className="text-[10px] text-gray-400 mt-1">Tone: {p.tone}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();

  const handleSave = async () => {
    if (activeTab === 'api') return;
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>

      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="lg:w-52 space-y-0.5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-[13px] transition-all ${activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover'}`}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-6 shadow-card">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
              <div className="flex items-center gap-4 p-4 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div><p className="font-medium text-gray-900 dark:text-white text-sm">{user?.full_name || user?.username}</p><p className="text-gray-500 dark:text-gray-400 text-xs">{user?.email}</p></div>
              </div>
              <div><label className="label">Full Name</label><input defaultValue={user?.full_name || ''} className="input" placeholder="Your name" /></div>
              <div><label className="label">Username</label><input defaultValue={user?.username || ''} className="input" placeholder="username" /></div>
              <div><label className="label">Bio</label><textarea className="input h-20 resize-none" placeholder="Tell us about yourself..." /></div>
            </div>
          )}

          {activeTab === 'team' && <TeamTab />}

          {activeTab === 'notifications' && (
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Notification Preferences</h2>
              {[
                { label: 'Email notifications for new reviews', desc: 'Get notified when a review is assigned to you' },
                { label: 'Push notifications for comments', desc: 'Receive notifications when someone comments on your reviews' },
                { label: 'Weekly digest', desc: 'Get a weekly summary of your team activity' },
                { label: 'AI learning recommendations', desc: 'Receive personalized learning suggestions' },
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between p-3 rounded-btn hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer transition-colors">
                  <div><p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{item.label}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p></div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-300 dark:bg-dark-border rounded-full peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-4" />
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Security Settings</h2>
              <div><label className="label">Current Password</label><input type="password" className="input" /></div>
              <div><label className="label">New Password</label><input type="password" className="input" /></div>
              <div><label className="label">Confirm New Password</label><input type="password" className="input" /></div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Appearance</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'dark' as const, icon: Moon, label: 'Dark' },
                  { id: 'light' as const, icon: Sun, label: 'Light' },
                  { id: 'system' as const, icon: Monitor, label: 'System' },
                ]).map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`p-4 rounded-btn border transition-all ${theme === t.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500' : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover'}`}>
                    <t.icon size={18} className={`mx-auto mb-2 ${theme === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                    <p className={`text-xs font-medium ${theme === t.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}>{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && <ApiKeysTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'rules' && <RulesTab />}
          {activeTab === 'personas' && <PersonasTab />}

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-dark-border flex items-center gap-3">
            {activeTab !== 'api' && (
              <>
                <button onClick={handleSave} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-btn transition-all active:scale-[0.98] flex items-center gap-2 text-sm"><Save size={15} /> Save Changes</button>
                {saved && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm">
                    <Check size={15} /> Saved!
                  </motion.span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
