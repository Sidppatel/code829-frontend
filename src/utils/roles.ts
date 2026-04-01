import type { UserProfile, UserRole } from '../types/auth';

const ROLE_LEVEL: Record<UserRole, number> = {
  User: 1,
  Staff: 2,
  Admin: 3,
  Developer: 4,
};

export const hasRole = (user: UserProfile | null, minRole: UserRole): boolean => {
  if (!user) return false;
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole];
};
