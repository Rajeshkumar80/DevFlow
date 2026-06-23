import { useState } from 'react';
import { Search, Bell, Settings, Moon, Sun, Menu, ChevronRight, Home } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { NotificationBell } from './NotificationBell';

export const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { resolvedTheme, setTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-[60px] flex items-center gap-4 px-6 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border flex-shrink-0">
      <button className="p-1.5 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors lg:hidden">
        <Menu size={18} />
      </button>

      <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Home size={14} />
        <ChevronRight size={12} />
        <span className="font-medium text-gray-700 dark:text-gray-200">Dashboard</span>
      </div>

      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={15} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-[7px] bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-btn text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors relative"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && <NotificationBell onClose={() => setShowNotifications(false)} />}
        </div>

        <button className="p-2 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors">
          <Settings size={17} />
        </button>

        <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-200 dark:border-dark-border">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-card flex items-center justify-center flex-shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">{user?.full_name || user?.username || 'User'}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Developer'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
