import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types/auth';
import LoadingSpinner from '../shared/LoadingSpinner';

const ROLE_LEVEL: Record<UserRole, number> = {
  User: 1,
  Staff: 2,
  Admin: 3,
  Developer: 4,
};

interface Props {
  children?: React.ReactNode;
  minRole?: UserRole;
}

export default function ProtectedRoute({ children, minRole = 'User' }: Props) {
  const { token, user, isHydrated } = useAuthStore();
  const location = useLocation();

  // useSessionRefresh is still probing the session cookie — don't redirect yet, or a valid
  // refresh will get bounced to /login before the store has had a chance to populate.
  if (!isHydrated) return <LoadingSpinner />;

  if (!token || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/login?error=insufficient_role" replace />;
  }

  // Onboarding guard: don't let user access anything except /profile if they haven't set their name
  const isPendingSetup = user.firstName === 'Pending' && user.lastName === 'Setup';
  if (isPendingSetup && location.pathname !== '/profile') {
    return <Navigate to="/profile" state={{ setup: true }} replace />;
  }

  return <>{children || <Outlet />}</>;
}
