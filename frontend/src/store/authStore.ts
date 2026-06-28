import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
}

const loadUser = (): User | null => {
  try {
    const raw = localStorage.getItem('devflow-user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
};

const savedUser = loadUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  isAuthenticated: !!savedUser,

  setUser: (user) => {
    localStorage.setItem('devflow-user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  login: (user) => {
    localStorage.setItem('devflow-user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('devflow-user');
    set({ user: null, isAuthenticated: false });
  }
}));
