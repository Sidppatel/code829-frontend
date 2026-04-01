import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types/auth';
import { hasRole } from '../utils/roles';

export function useAuth() {
  const { token, user, setAuth, setUser, logout } = useAuthStore();

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    setAuth,
    setUser,
    logout,
    hasRole: (minRole: UserRole) => hasRole(user, minRole),
  };
}
