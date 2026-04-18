import { authService } from './AuthService';

export type { UpdateProfilePayload } from './AuthService';

export const authApi = {
  requestMagicLink: authService.requestMagicLink,
  verifyMagicLink: authService.verifyMagicLink,
  devLogin: authService.devLogin,
  getMe: authService.getMe,
  updateProfile: authService.updateProfile,
};
