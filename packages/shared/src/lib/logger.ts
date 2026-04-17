/**
 * Structured logger with timestamps for the frontend.
 * All output goes through this module so we have a single
 * place to control formatting, filtering, and future transport
 * (e.g. sending error logs to a backend endpoint).
 */

import { reportError } from './errorReporter';
import { status } from '../theme/colors';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: `color: ${status.neutral}`,
  INFO:  `color: ${status.success}`,
  WARN:  `color: ${status.warning}`,
  ERROR: `color: ${status.danger}`,
};

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

function formatEntry(level: LogLevel, source: string, message: string, data?: unknown): void {
  const ts = timestamp();
  const prefix = `%c${ts} [${level}] ${source}`;

  if (data !== undefined) {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info'](
      prefix, LEVEL_COLORS[level], message, data,
    );
  } else {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info'](
      prefix, LEVEL_COLORS[level], message,
    );
  }

  if (level === 'ERROR') {
    reportError(source, message, data);
  }
}

/** Create a scoped logger for a specific module/component */
export function createLogger(source: string) {
  return {
    debug: (msg: string, data?: unknown) => formatEntry('DEBUG', source, msg, data),
    info:  (msg: string, data?: unknown) => formatEntry('INFO',  source, msg, data),
    warn:  (msg: string, data?: unknown) => formatEntry('WARN',  source, msg, data),
    error: (msg: string, data?: unknown) => formatEntry('ERROR', source, msg, data),
  };
}

/** Global logger for top-level use */
const logger = createLogger('App');
export default logger;
