import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await authService.login(username, password);
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  register: async (username, password, nickname) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await authService.register(username, password, nickname);
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Register failed';
      set({ loading: false, error: message });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, token, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
