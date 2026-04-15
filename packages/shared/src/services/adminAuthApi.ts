import apiClient from '../lib/axios';
import type { AdminAuthResponse, AdminUserProfile, InvitationInfoDto } from '../types/auth';

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateAdminProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangeAdminPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const adminAuthApi = {
  login: (email: string, password: string) =>
    apiClient.post<AdminAuthResponse>('/admin/auth/login', { email, password }),

  signup: (request: AcceptInvitationRequest) =>
    apiClient.post<AdminAuthResponse>('/admin/auth/signup', request),

  getMe: () =>
    apiClient.get<AdminUserProfile>('/admin/auth/me'),

  updateProfile: (data: UpdateAdminProfilePayload) =>
    apiClient.put<AdminUserProfile>('/admin/auth/profile', data),

  changePassword: (data: ChangeAdminPasswordPayload) =>
    apiClient.put('/admin/auth/password', data),

  getInvitationInfo: (token: string) =>
    apiClient.get<InvitationInfoDto>(`/admin/auth/invitation/${encodeURIComponent(token)}`),

  getSessions: () =>
    apiClient.get('/admin/auth/sessions'),

  revokeSession: (id: string) =>
    apiClient.delete(`/admin/auth/sessions/${id}`),

  revokeAllSessions: () =>
    apiClient.delete('/admin/auth/sessions'),

  logout: () =>
    apiClient.post('/admin/auth/logout'),

  requestPasswordReset: (email: string) =>
    apiClient.post('/admin/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/admin/auth/reset-password', { token, newPassword }),
};
