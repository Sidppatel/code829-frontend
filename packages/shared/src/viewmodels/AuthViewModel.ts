import { useEffect, useMemo } from 'react';
import { BaseViewModel } from './BaseViewModel';
import { useVMState } from './useVM';
import { authController, AuthController } from '../controllers/AuthController';
import { useAuthStore } from '../stores/authStore';
import type { UserProfile, BusinessUserProfile } from '../types/auth';

interface AuthVMState {
  user: UserProfile | BusinessUserProfile | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  loading: boolean;
  error: string | null;
}

export class AuthViewModel extends BaseViewModel<AuthVMState> {
  private readonly unsubStore: () => void;
  private readonly unsubLogin: () => void;
  private readonly unsubLogout: () => void;

  private readonly ctrl: AuthController;

  constructor(ctrl: AuthController = authController) {
    const s = useAuthStore.getState();
    super({
      user: s.user,
      isAuthenticated: !!s.user,
      isHydrated: s.isHydrated,
      loading: false,
      error: null,
    });
    this.ctrl = ctrl;

    this.unsubStore = useAuthStore.subscribe((state) => {
      this.setState({
        user: state.user,
        isAuthenticated: !!state.user,
        isHydrated: state.isHydrated,
      });
    });
    this.unsubLogin = this.ctrl.on('auth:login', () => this.setState({ loading: false, error: null }));
    this.unsubLogout = this.ctrl.on('auth:logout', () => this.setState({ loading: false, error: null }));
  }

  requestMagicLink = (email: string, returnUrl?: string, frontendOrigin?: string) =>
    this.runCommand(() => this.ctrl.requestMagicLink(email, returnUrl, frontendOrigin));

  verifyMagicLink = (token: string) =>
    this.runCommand(() => this.ctrl.verifyMagicLink(token));

  adminLogin = (email: string, password: string) =>
    this.runCommand(() => this.ctrl.adminLogin(email, password));

  logout = (callServer = false) => this.runCommand(() => this.ctrl.logout(callServer));

  private async runCommand<T>(fn: () => Promise<T>): Promise<T | null> {
    this.setState({ loading: true, error: null });
    try {
      const out = await fn();
      this.setState({ loading: false });
      return out;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Authentication failed';
      this.setState({ loading: false, error: msg });
      return null;
    }
  }

  override dispose(): void {
    this.unsubStore();
    this.unsubLogin();
    this.unsubLogout();
    super.dispose();
  }
}

export interface UseAuthVMResult extends AuthVMState {
  vm: AuthViewModel;
}

export function useAuthVM(): UseAuthVMResult {
  const vm = useMemo(() => new AuthViewModel(), []);
  const state = useVMState(vm);
  useEffect(() => () => vm.dispose(), [vm]);
  return { ...state, vm };
}
