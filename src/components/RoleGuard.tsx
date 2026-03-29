import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface RoleGuardProps {
  /** Allowed roles for this route group */
  allowed: string[];
  /** Where to redirect if role doesn't match */
  redirectTo: string;
  children: React.ReactNode;
}

/**
 * Route guard that checks the user's role before rendering children.
 * Redirects to the appropriate dashboard if the role doesn't match.
 * Unauthenticated users are sent to login.
 */
export default function RoleGuard({ allowed, redirectTo, children }: RoleGuardProps): React.ReactElement {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = (user.role as string).toLowerCase();
  const isAllowed = allowed.some(r => r.toLowerCase() === userRole);

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
