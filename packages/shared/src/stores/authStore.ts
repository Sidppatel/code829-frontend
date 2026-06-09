import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, BusinessUserProfile, UserRole, AdminRole } from '../types/auth';

import { organizerName } from '../config';

interface AuthState {
  user: UserProfile | BusinessUserProfile | null;
  isHydrated: boolean;
  setUser: (user: UserProfile | BusinessUserProfile) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
}

type PersistedFields = 'id' | 'firstName' | 'lastName' | 'role';
type PersistedUser =
  | (Pick<UserProfile, PersistedFields> & { role: UserRole })
  | (Pick<BusinessUserProfile, PersistedFields> & { role: AdminRole });

function toPersistedUser(user: UserProfile | BusinessUserProfile | null): PersistedUser | null {
  if (!user) return null;
  const u = user as unknown as Record<string, unknown>;
  return {
    id: (u.id || u.businessUserId || u.userId) as string,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  } as PersistedUser;
}

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
      name: `${organizerName.toLowerCase()}-auth`,
      partialize: (state) => ({
        user: toPersistedUser(state.user) as UserProfile | BusinessUserProfile | null,
      }),
    },
  ),
);
