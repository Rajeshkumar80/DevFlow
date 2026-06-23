import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings, LogOut, Code2, FileCode, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const sections = [
  {
    label: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/', badge: '3' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: FileCode, label: 'Reviews', path: '/reviews/test-repo/test-review', badge: '5' },
      { icon: GraduationCap, label: 'Learning', path: '/learning' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

export const Sidebar = () => {
  const { logout } = useAuthStore();
  const location = useLocation();

  return (
    <aside className="w-sidebar h-screen flex flex-col bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex-shrink-0">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-5 border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Code2 size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">DevFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-btn text-[13px] transition-all ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon size={17} className="flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-gray-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-dark-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-btn text-[13px] text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all w-full"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
