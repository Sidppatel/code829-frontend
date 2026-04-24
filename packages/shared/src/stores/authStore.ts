import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, BusinessUserProfile, UserRole, AdminRole } from '../types/auth';

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

// Only these fields survive a localStorage round-trip. Everything else (email, phone,
// address, city/state/zip, imageUrl, lastLoginAt, etc.) is PII and is re-fetched from
// /auth/me on mount by useSessionRefresh. Keeping `firstName` + `lastName` + `role`
// keeps the nav/onboarding guard/route gating working instantly on reload without
// leaking contact info into localStorage (visible to any script on the origin).
type PersistedFields = 'id' | 'firstName' | 'lastName' | 'role';
type PersistedUser =
  | (Pick<UserProfile, PersistedFields> & { role: UserRole })
  | (Pick<BusinessUserProfile, PersistedFields> & { role: AdminRole });

function toPersistedUser(user: UserProfile | BusinessUserProfile | null): PersistedUser | null {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  } as PersistedUser;
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
      // Persist a PII-minimized subset; useSessionRefresh backfills via /auth/me on mount.
      // The persisted shape is widened to UserProfile|BusinessUserProfile for store typing;
      // consumers must tolerate missing fields (email/phone/address/etc.) until rehydration.
      partialize: (state) => ({
        user: toPersistedUser(state.user) as UserProfile | BusinessUserProfile | null,
      }),
    },
  ),
);
