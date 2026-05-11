import { authService } from './AuthService';

export type { UpdateProfilePayload } from './AuthService';

export const authApi = {
  requestMagicLink: authService.requestMagicLink,
  verifyMagicLink: authService.verifyMagicLink,
  devLogin: authService.devLogin,
  signup: authService.signup,
  signin: authService.signin,
  googleSignIn: authService.googleSignIn,
  verifyEmail: authService.verifyEmail,
  forgotPassword: authService.userForgotPassword,
  resetPassword: authService.userResetPassword,
  setPassword: authService.setPassword,
  getMe: authService.getMe,
  updateProfile: authService.updateProfile,
};
