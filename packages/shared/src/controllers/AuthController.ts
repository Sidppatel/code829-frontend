import { BaseController } from './BaseController';
import { authService, AuthService, type UpdateProfilePayload, type AcceptInvitationRequest, type UpdateAdminProfilePayload, type ChangeAdminPasswordPayload } from '../services/AuthService';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse, AdminAuthResponse, UserProfile, AdminUserProfile } from '../types/auth';

export type AuthEvent =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:profileUpdated';

/**
 * Thin orchestration layer over AuthService + useAuthStore. Wraps token /
 * profile persistence so ViewModels never touch the store directly.
 */
export class AuthController extends BaseController {
  private static _instance: AuthController | null = null;
  static getInstance(): AuthController {
    return (this._instance ??= new AuthController());
  }
  private readonly svc: AuthService;
  private constructor(svc: AuthService = authService) {
    super();
    this.svc = svc;
  }

  // ── User flows ────────────────────────────────
  async requestMagicLink(email: string, returnUrl?: string, frontendOrigin?: string) {
    await this.svc.requestMagicLink(email, returnUrl, frontendOrigin);
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const { data } = await this.svc.verifyMagicLink(token);
    this.persist(data.token, data.user);
    this.emit<AuthResponse>('auth:login', data);
    return data;
  }

  async devLogin(email: string): Promise<AuthResponse> {
    const { data } = await this.svc.devLogin(email);
    this.persist(data.token, data.user);
    this.emit<AuthResponse>('auth:login', data);
    return data;
  }

  async refreshMe(): Promise<UserProfile> {
    const { data } = await this.svc.getMe();
    useAuthStore.getState().setUser(data);
    this.emit<UserProfile>('auth:profileUpdated', data);
    return data;
  }

  async updateProfile(payload: UpdateProfilePayload) {
    await this.svc.updateProfile(payload);
    return this.refreshMe();
  }

  // ── Admin flows ───────────────────────────────
  async adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
    const { data } = await this.svc.adminLogin(email, password);
    this.persist(data.token, data.user);
    this.emit<AdminAuthResponse>('auth:login', data);
    return data;
  }

  async adminSignup(request: AcceptInvitationRequest): Promise<AdminAuthResponse> {
    const { data } = await this.svc.adminSignup(request);
    this.persist(data.token, data.user);
    this.emit<AdminAuthResponse>('auth:login', data);
    return data;
  }

  async adminRefreshMe(): Promise<AdminUserProfile> {
    const { data } = await this.svc.adminGetMe();
    useAuthStore.getState().setUser(data);
    this.emit<AdminUserProfile>('auth:profileUpdated', data);
    return data;
  }

  async adminUpdateProfile(payload: UpdateAdminProfilePayload) {
    const { data } = await this.svc.adminUpdateProfile(payload);
    useAuthStore.getState().setUser(data);
    this.emit<AdminUserProfile>('auth:profileUpdated', data);
    return data;
  }

  async adminChangePassword(payload: ChangeAdminPasswordPayload) {
    await this.svc.adminChangePassword(payload);
  }

  async logout(callServer = false) {
    if (callServer) {
      try { await this.svc.adminLogout(); } catch { /* best-effort */ }
    }
    useAuthStore.getState().logout();
    this.emit('auth:logout');
  }

  private persist(token: string, user: UserProfile | AdminUserProfile) {
    useAuthStore.getState().setAuth(token, user);
  }
}

export const authController = AuthController.getInstance();
