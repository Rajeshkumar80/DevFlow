import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Palette, Key, Save, Check, Moon, Sun, Monitor, Users, Mail, X, Copy, Trash2, Crown, ExternalLink, Zap, Loader2, AlertCircle } from 'lucide-react';
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
