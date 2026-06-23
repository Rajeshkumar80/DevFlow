import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
}

const loadState = () => {
  try {
    const raw = localStorage.getItem('devflow-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token && parsed.user) {
        return { user: parsed.user, token: parsed.token, refreshToken: parsed.refreshToken || null, isAuthenticated: true };
      }
    }
  } catch {}
  return { user: null, token: null, refreshToken: null, isAuthenticated: false };
};

const saveState = (state: { user: User | null; token: string | null; refreshToken: string | null }) => {
  try {
    if (state.token && state.user) {
      localStorage.setItem('devflow-auth', JSON.stringify({ user: state.user, token: state.token, refreshToken: state.refreshToken }));
    } else {
      localStorage.removeItem('devflow-auth');
    }
  } catch {}
};

const initial = loadState();

export const useAuthStore = create<AuthState>((set) => ({
  ...initial,

  setUser: (user) => set((state) => {
    const next = { ...state, user, isAuthenticated: true };
    saveState(next);
    return { user, isAuthenticated: true };
  }),

  setToken: (token, refreshToken) => set((state) => {
    const next = { ...state, token, refreshToken: refreshToken || state.refreshToken };
    saveState(next);
    return { token, refreshToken: refreshToken || state.refreshToken };
  }),

  login: (user, token, refreshToken) => {
    const next = { user, token, refreshToken: refreshToken || null, isAuthenticated: true };
    saveState(next);
    set(next);
  },

  logout: () => {
    localStorage.removeItem('devflow-auth');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  }
}));
