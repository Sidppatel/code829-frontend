import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types/auth';
import { hasRole } from '../utils/roles';

export function useAuth() {
  const { user, setUser, logout } = useAuthStore();

  return {
    user,
    isAuthenticated: !!user,
    setUser,
    logout,
    hasRole: (minRole: UserRole) => hasRole(user, minRole),
  };
}
