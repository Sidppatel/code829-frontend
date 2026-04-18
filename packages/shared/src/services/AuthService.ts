import { BaseService } from './BaseService';
import type {
  AuthResponse,
  UserProfile,
  AdminAuthResponse,
  AdminUserProfile,
  InvitationInfoDto,
} from '../types/auth';

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

export class AuthService extends BaseService {
  private static _instance: AuthService | null = null;
  static getInstance(): AuthService {
    return (this._instance ??= new AuthService());
  }
  private constructor() {
    super('AuthService');
  }

  // ── User auth ───────────────────────────────────
  requestMagicLink = (email: string, returnUrl?: string, frontendOrigin?: string) =>
    this.post('/auth/magic-link', { email, returnUrl, frontendOrigin });

  verifyMagicLink = (token: string) =>
    this.post<AuthResponse>('/auth/magic-link/verify', { token });

  devLogin = (email: string) =>
    this.post<AuthResponse>('/auth/dev-login', { email });

  getMe = () => this.get<UserProfile>('/auth/me');

  updateProfile = (data: UpdateProfilePayload) => this.put('/auth/profile', data);

  // ── Admin auth ──────────────────────────────────
  adminLogin = (email: string, password: string) =>
    this.post<AdminAuthResponse>('/admin/auth/login', { email, password });

  adminSignup = (request: AcceptInvitationRequest) =>
    this.post<AdminAuthResponse>('/admin/auth/signup', request);

  adminGetMe = () => this.get<AdminUserProfile>('/admin/auth/me');

  adminUpdateProfile = (data: UpdateAdminProfilePayload) =>
    this.put<AdminUserProfile>('/admin/auth/profile', data);

  adminChangePassword = (data: ChangeAdminPasswordPayload) =>
    this.put('/admin/auth/password', data);

  getInvitationInfo = (token: string) =>
    this.get<InvitationInfoDto>(`/admin/auth/invitation/${encodeURIComponent(token)}`);

  getSessions = () => this.get('/admin/auth/sessions');

  revokeSession = (id: string) => this.delete(`/admin/auth/sessions/${id}`);

  revokeAllSessions = () => this.delete('/admin/auth/sessions');

  adminLogout = () => this.post('/admin/auth/logout');

  requestPasswordReset = (email: string) =>
    this.post('/admin/auth/forgot-password', { email });

  resetPassword = (token: string, newPassword: string) =>
    this.post('/admin/auth/reset-password', { token, newPassword });
}

export const authService = AuthService.getInstance();
