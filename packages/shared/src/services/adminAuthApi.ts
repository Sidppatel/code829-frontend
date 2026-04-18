import { authService } from './AuthService';

export type {
  AcceptInvitationRequest,
  UpdateAdminProfilePayload,
  ChangeAdminPasswordPayload,
} from './AuthService';

export const adminAuthApi = {
  login: authService.adminLogin,
  signup: authService.adminSignup,
  getMe: authService.adminGetMe,
  updateProfile: authService.adminUpdateProfile,
  changePassword: authService.adminChangePassword,
  getInvitationInfo: authService.getInvitationInfo,
  getSessions: authService.getSessions,
  revokeSession: authService.revokeSession,
  revokeAllSessions: authService.revokeAllSessions,
  logout: authService.adminLogout,
  requestPasswordReset: authService.requestPasswordReset,
  resetPassword: authService.resetPassword,
};
