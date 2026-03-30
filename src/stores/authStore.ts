import { create } from 'zustand';
import { authApi } from '../services/authApi';

export type UserRole = 'admin' | 'organizer' | 'attendee' | 'staff' | 'developer' | 'guest';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  hasCompletedOnboarding: boolean;
  city?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  devLogin: (email: string) => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('auth_token'),
  user: (() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  devLogin: async (email: string) => {
    const res = await authApi.devLogin(email);
    const { token, email: resEmail, firstName, lastName, role, hasCompletedOnboarding } = res.data;
    const user: User = { id: resEmail, email: resEmail, firstName, lastName, role, hasCompletedOnboarding };
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  fetchMe: async () => {
    const res = await authApi.getMe();
    const { id, email, firstName, lastName, role, hasCompletedOnboarding, city } = res.data;
    const user: User = { id, email, firstName, lastName, role, hasCompletedOnboarding, city };
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
