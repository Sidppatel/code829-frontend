import { authService } from './AuthService';

export type { UpdateProfilePayload } from './AuthService';

export const authApi = {
  requestMagicLink: authService.requestMagicLink,
  verifyMagicLink: authService.verifyMagicLink,
  devLogin: authService.devLogin,
  signup: authService.signup,
  signin: authService.signin,
  verifyEmail: authService.verifyEmail,
  forgotPassword: authService.userForgotPassword,
  resetPassword: authService.userResetPassword,
  getMe: authService.getMe,
  updateProfile: authService.updateProfile,
};
