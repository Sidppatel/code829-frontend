import { create } from 'zustand';
import apiClient from '../lib/axios';

export type UserRole = 'admin' | 'organizer' | 'attendee' | 'staff' | 'developer' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface DevLoginResponse {
  token: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
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
    const res = await apiClient.post<DevLoginResponse>('/auth/dev-login', { email });
    const { token, email: resEmail, name, role } = res.data;
    const user: User = { id: resEmail, email: resEmail, name, role };
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  fetchMe: async () => {
    const res = await apiClient.get<MeResponse>('/auth/me');
    const { id, email, name, role } = res.data;
    const user: User = { id, email, name, role };
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
