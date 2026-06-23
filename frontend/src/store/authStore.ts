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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setToken: (token, refreshToken) => set((state) => ({
    token,
    refreshToken: refreshToken || state.refreshToken
  })),

  login: (user, token, refreshToken) => set({
    user,
    token,
    refreshToken: refreshToken || null,
    isAuthenticated: true
  }),

  logout: () => set({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false
  })
}));