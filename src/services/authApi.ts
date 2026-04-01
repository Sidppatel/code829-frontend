import apiClient from '../lib/axios';
import type { AuthResponse, UserProfile } from '../types/auth';

export interface UpdateProfilePayload {
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
  requestMagicLink: (email: string) =>
    apiClient.post('/auth/magic-link', { email }),

  verifyMagicLink: (token: string) =>
    apiClient.post<AuthResponse>('/auth/magic-link/verify', { token }),

  devLogin: (email: string) =>
    apiClient.post<AuthResponse>('/auth/dev-login', { email }),

  getMe: () =>
    apiClient.get<UserProfile>('/auth/me'),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.put('/auth/profile', data),
};
