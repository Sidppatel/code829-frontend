import apiClient from '../lib/axios';
import type { UserRole } from '../stores/authStore';

export interface DevLoginResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  expiresAt: string;
  hasCompletedOnboarding: boolean;
}

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  hasCompletedOnboarding: boolean;
  city?: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  optInLocationEmail?: boolean;
}

export const authApi = {
  sendMagicLink: (email: string) =>
    apiClient.post('/auth/magic-link', { email }),

  devLogin: (email: string) =>
    apiClient.post<DevLoginResponse>('/auth/dev-login', { email }),

  getMe: <T = MeResponse>() =>
    apiClient.get<T>('/auth/me'),

  updateProfile: (data: ProfileUpdateRequest) =>
    apiClient.put('/auth/profile', data),
};
