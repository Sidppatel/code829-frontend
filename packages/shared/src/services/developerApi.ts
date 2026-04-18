import { developerService } from './DeveloperService';

export type {
  DevLogEntry,
  DevLogParams,
  EmailLogEntry,
  AppSetting,
  SecretStatus,
  SettingsResponse,
  DevUser,
  EventFeeInfo,
  DevEventListItem,
} from './DeveloperService';

export const developerApi = {
  getEmailLogs: developerService.getEmailLogs,
  getDevLogs: developerService.getDevLogs,
  getSystemLogs: developerService.getSystemLogs,
  getSettings: developerService.getSettings,
  updateSetting: developerService.updateSetting,
  getUsers: developerService.getUsers,
  updateUserStatus: developerService.updateUserStatus,
  deleteUser: developerService.deleteUser,
  getEvents: developerService.getEvents,
  getEventFees: developerService.getEventFees,
  updateTableTypeFees: developerService.updateTableTypeFees,
  updateTicketTypeFees: developerService.updateTicketTypeFees,
};
