import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// token and user are persisted to localStorage so the UI restores immediately on
// refresh without a flash to /login. isHydrated is intentionally excluded — it
// always starts false and is set by useSessionRefresh after the background probe.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      setHydrated: (v) => set({ isHydrated: v }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'code829-auth',
      // Only persist credentials, never the hydration gate
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
