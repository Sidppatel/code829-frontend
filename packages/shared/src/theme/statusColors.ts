import { status, semantic } from './colors';

export const STATUS_COLORS = {
  success: status.success,
  warning: status.warning,
  error: status.danger,
  danger: status.danger,
  info: status.info,
  critical: status.danger,
  neutral: status.neutral,
} as const;

export const EVENT_STATUS_COLORS: Record<string, string> = {
  Draft: STATUS_COLORS.neutral,
  Published: STATUS_COLORS.success,
  SoldOut: STATUS_COLORS.warning,
  Cancelled: STATUS_COLORS.error,
  Completed: semantic.brand,
};

export const LOG_SEVERITY_COLORS: Record<string, string> = {
  Info: STATUS_COLORS.info,
  Warning: STATUS_COLORS.warning,
  Error: STATUS_COLORS.error,
  Critical: STATUS_COLORS.critical,
  Debug: STATUS_COLORS.neutral,
};

export const EMAIL_STATUS_COLORS: Record<string, string> = {
  Sent: STATUS_COLORS.success,
  Failed: STATUS_COLORS.error,
  Pending: STATUS_COLORS.warning,
  Queued: STATUS_COLORS.info,
};
