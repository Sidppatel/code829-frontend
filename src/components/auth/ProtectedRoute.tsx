import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types/auth';

const ROLE_LEVEL: Record<UserRole, number> = {
  User: 1,
  Staff: 2,
  Admin: 3,
  Developer: 4,
};

interface Props {
  children: React.ReactNode;
  minRole?: UserRole;
}

export default function ProtectedRoute({ children, minRole = 'User' }: Props) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) return <Navigate to="/" replace />;
  return <>{children}</>;
}
