export const STATUS_COLORS = {
  success: 'var(--accent-green)',
  warning: '#F59E0B',
  error: '#EF4444',
  danger: 'var(--accent-rose)',
  info: '#3B82F6',
  critical: 'var(--accent-violet)',
  neutral: '#9CA3AF',
} as const;

export const EVENT_STATUS_COLORS: Record<string, string> = {
  Draft: STATUS_COLORS.neutral,
  Published: STATUS_COLORS.success,
  SoldOut: STATUS_COLORS.warning,
  Cancelled: STATUS_COLORS.error,
  Completed: 'var(--primary)',
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
