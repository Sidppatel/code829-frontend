import { create } from 'zustand';
import type { UserProfile, AdminUserProfile } from '../types/auth';

interface AuthState {
  token: string | null;
  user: UserProfile | AdminUserProfile | null;
  setAuth: (token: string, user: UserProfile | AdminUserProfile) => void;
  setUser: (user: UserProfile | AdminUserProfile) => void;
  logout: () => void;
}

// Auth state is memory-only — the HttpOnly session cookie handles persistence
// across page reloads via DeviceSessionMiddleware on the backend.
export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null }),
}));
