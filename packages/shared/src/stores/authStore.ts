import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, BusinessUserProfile } from '../types/auth';

interface AuthState {
  user: UserProfile | BusinessUserProfile | null;
  /**
   * False until useSessionRefresh has finished its first `/auth/me` (or equivalent) probe.
   * Guards like ProtectedRoute and EventDetailPage's gate must wait for `isHydrated === true`
   * before deciding whether to redirect — otherwise a valid session-cookie user gets bounced
   * to /login on every refresh because the store is still empty for a few ms.
   */
  isHydrated: boolean;
  setUser: (user: UserProfile | BusinessUserProfile) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
}

// user is persisted to localStorage so the UI restores immediately on
// refresh without a flash to /login. isHydrated is intentionally excluded — it
// always starts false and is set by useSessionRefresh after the background probe.
// Auth is cookie-only (session cookie set by the backend); no JWT is stored here.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setHydrated: (v) => set({ isHydrated: v }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'code829-auth',
      // Only persist the user profile, never the hydration gate
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
