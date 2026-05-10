import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user: User) => {
    localStorage.setItem('access_token', user.accessToken);
    set({ user, isAuthenticated: true });
  },

  clearUser: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));