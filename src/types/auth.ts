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
  address?: AddressSummary;
  optInLocationEmail: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export interface AddressSummary {
  line1: string;
  city: string;
  state: string;
  zipCode: string;
}

export type UserRole = 'User' | 'Staff' | 'Admin' | 'Developer';
