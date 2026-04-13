/**
 * Structured logger with timestamps for the frontend.
 * All output goes through this module so we have a single
 * place to control formatting, filtering, and future transport
 * (e.g. sending error logs to a backend endpoint).
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: 'color: #9CA3AF',
  INFO:  'color: #10B981',
  WARN:  'color: #F59E0B',
  ERROR: 'color: #EF4444',
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
