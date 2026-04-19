export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  optInLocationEmail: boolean;
  hasCompletedOnboarding: boolean;
  imageUrl?: string;
  createdAt: string;
}

export type UserRole = 'User' | 'Staff' | 'Admin' | 'Developer';

export type AdminRole = 'Staff' | 'Admin' | 'Developer';

export interface AdminUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  phone?: string;
  imageUrl?: string;
}

export interface AdminAuthResponse {
  user: AdminUserProfile;
  token: string;
}

export interface InvitationInfoDto {
  email: string;
  role: string;
  invitedByName: string;
  expiresAt: string;
}
