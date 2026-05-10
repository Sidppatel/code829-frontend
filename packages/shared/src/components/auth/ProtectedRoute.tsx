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
  const { user, isHydrated } = useAuthStore();
  const location = useLocation();

  if (!isHydrated) return <LoadingSpinner />;

  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/login?error=insufficient_role" replace />;
  }

  const isPendingSetup = user.firstName === 'Pending' && user.lastName === 'Setup';
  if (isPendingSetup && location.pathname !== '/profile') {
    return <Navigate to="/profile" state={{ setup: true }} replace />;
  }

  return <>{children || <Outlet />}</>;
}
