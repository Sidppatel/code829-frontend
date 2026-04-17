import { create } from 'zustand';
import type { UserProfile, AdminUserProfile } from '../types/auth';

interface AuthState {
  token: string | null;
  user: UserProfile | AdminUserProfile | null;
  /**
   * False until useSessionRefresh has finished its first `/auth/me` (or equivalent) probe.
   * Guards like ProtectedRoute and EventDetailPage's gate must wait for `isHydrated === true`
   * before deciding whether to redirect — otherwise a valid session-cookie user gets bounced
   * to /login on every refresh because the store is still empty for a few ms.
   */
  isHydrated: boolean;
  setAuth: (token: string, user: UserProfile | AdminUserProfile) => void;
  setUser: (user: UserProfile | AdminUserProfile) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
}

// Auth state is memory-only — the HttpOnly session cookie handles persistence
// across page reloads via DeviceSessionMiddleware on the backend.
export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  isHydrated: false,
  setAuth: (token, user) => set({ token, user }),
  setUser: (user) => set({ user }),
  setHydrated: (v) => set({ isHydrated: v }),
  logout: () => set({ token: null, user: null }),
}));
