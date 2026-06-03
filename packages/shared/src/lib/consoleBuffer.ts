
type Entry = { t: number; level: 'error' | 'warn' | 'uncaught' | 'rejection'; msg: string };

const MAX_ENTRIES = 25;
const MAX_LINE = 800;

let buffer: Entry[] = [];
let installed = false;

function scrub(s: string): string {
  if (!s) return s;
  let out = s
    .replace(/Authorization:\s*Bearer\s+[\w.-]+/gi, 'Authorization: Bearer <redacted>')
    .replace(/\b(password|token|secret|api[_-]?key|cookie)\b\s*[:=]\s*[^\s,;}]+/gi, '$1=<redacted>')
    .replace(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, '<jwt-redacted>');
  if (out.length > MAX_LINE) out = out.slice(0, MAX_LINE) + '…';
  return out;
}

function stringify(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack ?? ''}`;
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    })
    .join(' ');
}

function push(level: Entry['level'], raw: string) {
  buffer.push({ t: Date.now(), level, msg: scrub(raw) });
  if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
}

let isSendingTelemetry = false;

async function reportTelemetry(level: 'Warning' | 'Error', message: string, stackTrace?: string): Promise<void> {
  if (isSendingTelemetry || typeof window === 'undefined') return;

  // Ignore telemetry-related errors to prevent logging infinite loops
  if (
    message.includes('/telemetry/log') ||
    message.includes('/telemetry/visit') ||
    (stackTrace && (stackTrace.includes('/telemetry/log') || stackTrace.includes('/telemetry/visit')))
  ) {
    return;
  }

  isSendingTelemetry = true;
  try {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const envObj = (import.meta as unknown as { env?: Record<string, string> }).env;
    const baseUrl = isLocal ? (envObj?.VITE_API_URL || '/api/v1') : '/api/v1';
    const url = baseUrl.endsWith('/') ? `${baseUrl}telemetry/log` : `${baseUrl}/telemetry/log`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Level: level,
        Message: message,
        StackTrace: stackTrace || null,
        Url: window.location.href,
        UserAgent: navigator.userAgent,
        StatusCode: null
      }),
    });
  } catch {
    // Fail silently to avoid infinite console/error loops
  } finally {
    isSendingTelemetry = false;
  }
}

export function installConsoleBuffer(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    const msg = stringify(args);
    push('error', msg);
    origError(...args);

    const errArg = args.find((a) => a instanceof Error) as Error | undefined;
    reportTelemetry('Error', msg, errArg?.stack);
  };

  console.warn = (...args: unknown[]) => {
    const msg = stringify(args);
    push('warn', msg);
    origWarn(...args);

    const errArg = args.find((a) => a instanceof Error) as Error | undefined;
    reportTelemetry('Warning', msg, errArg?.stack);
  };

  window.addEventListener('error', (e) => {
    const msg = `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`;
    push('uncaught', msg);
    reportTelemetry('Error', msg, e.error?.stack);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? `${e.reason.message}\n${e.reason.stack ?? ''}` : String(e.reason);
    push('rejection', reason);
    
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    const stack = e.reason instanceof Error ? e.reason.stack : undefined;
    reportTelemetry('Error', msg, stack);
  });
}

export interface Diagnostics {
  userAgent: string;
  url: string;
  appVersion: string;
  capturedAt: string;
  consoleLog: { t: string; level: string; msg: string }[];
}

export function getDiagnostics(): Diagnostics {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    url: typeof location !== 'undefined' ? location.href : '',
    appVersion: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_VERSION ?? 'dev',
    capturedAt: new Date().toISOString(),
    consoleLog: buffer.map((e) => ({ t: new Date(e.t).toISOString(), level: e.level, msg: e.msg })),
  };
}
