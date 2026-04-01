import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types/auth';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'code829-auth' },
  ),
);
