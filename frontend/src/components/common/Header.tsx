import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, Moon, Sun, Menu, LogOut, User, HelpCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { NotificationBell } from './NotificationBell';

export const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { resolvedTheme, setTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfile(false);
  };

  return (
    <header className="h-[56px] flex items-center justify-between px-5 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors lg:hidden">
          <Menu size={18} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 rounded-full text-[9px] text-white font-semibold flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && <NotificationBell onClose={() => setShowNotifications(false)} />}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 ml-1 pl-3 pr-2 py-1.5 rounded-btn hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[12px] font-medium text-gray-900 dark:text-white leading-tight">{user?.full_name || user?.username || 'User'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Developer'}</p>
            </div>
            <ChevronDown size={12} className={`text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-xl z-50 overflow-hidden">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/50">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{user?.full_name || user?.username || 'User'}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{user?.email || 'demo@devflow.ai'}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  {[
                    { icon: User, label: 'My Profile', action: () => { navigate('/settings'); setShowProfile(false); } },
                    { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setShowProfile(false); } },
                    { icon: HelpCircle, label: 'Help & Support', action: () => { navigate('/help'); setShowProfile(false); } },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                      <item.icon size={14} className="text-gray-400 dark:text-gray-500" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-dark-border py-1.5">
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
