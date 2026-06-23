import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Key, Save, Check, Moon, Sun, Monitor } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api', label: 'API Keys', icon: Key },
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

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

          {activeTab === 'api' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">API Keys</h2>
              <div className="p-3 rounded-btn bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2"><Shield size={14} /> API keys give full access to your account. Keep them secret.</div>
              <div className="flex items-center gap-2 p-3 rounded-btn bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                <code className="flex-1 text-xs text-gray-500 dark:text-gray-400 font-mono">df_sk_••••••••••••••••••••</code>
                <button className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">Reveal</button>
              </div>
              <button className="px-4 py-2 rounded-btn border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-xs font-medium">Generate New Key</button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-dark-border flex items-center gap-3">
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-btn transition-all active:scale-[0.98] flex items-center gap-2 text-sm"><Save size={15} /> Save Changes</button>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm">
                <Check size={15} /> Saved!
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
