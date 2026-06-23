import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): 'dark' | 'light' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getResolved = (theme: Theme): 'dark' | 'light' =>
  theme === 'system' ? getSystemTheme() : theme;

const stored = (localStorage.getItem('devflow-theme') as Theme) || 'dark';

const applyTheme = (resolved: 'dark' | 'light') => {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.classList.toggle('light', resolved === 'light');
};

applyTheme(getResolved(stored));

export const useThemeStore = create<ThemeState>((set) => ({
  theme: stored,
  resolvedTheme: getResolved(stored),
  setTheme: (theme: Theme) => {
    localStorage.setItem('devflow-theme', theme);
    const resolved = getResolved(theme);
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },
}));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const state = useThemeStore.getState();
  if (state.theme === 'system') {
    const resolved = getSystemTheme();
    applyTheme(resolved);
    useThemeStore.setState({ resolvedTheme: resolved });
  }
});