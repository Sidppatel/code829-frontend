import { createLogger } from './logger';
import { reportError } from './errorReporter';

const globalLog = createLogger('Global');

export function initGlobalErrorListeners() {
  window.addEventListener('error', (event) => {
    globalLog.error(`Uncaught: ${event.message}`, {
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
    });
    reportError('Global', `Uncaught: ${event.message}`, { filename: event.filename, line: event.lineno });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    globalLog.error(`Unhandled promise rejection: ${reason}`, event.reason);
    reportError('Global', `Unhandled rejection: ${reason}`);
  });
}
