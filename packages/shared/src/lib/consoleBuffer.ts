// Rolling buffer of recent console.error / console.warn messages plus
// window-level errors. Used to attach diagnostics to feedback submissions.

type Entry = { t: number; level: 'error' | 'warn' | 'uncaught' | 'rejection'; msg: string };

const MAX_ENTRIES = 25;
const MAX_LINE = 800;

let buffer: Entry[] = [];
let installed = false;

// Strip obvious secrets from a line before storing.
function scrub(s: string): string {
  if (!s) return s;
  let out = s
    .replace(/Authorization:\s*Bearer\s+[\w.\-]+/gi, 'Authorization: Bearer <redacted>')
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

export function installConsoleBuffer(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args: unknown[]) => { push('error', stringify(args)); origError(...args); };
  console.warn = (...args: unknown[]) => { push('warn', stringify(args)); origWarn(...args); };

  window.addEventListener('error', (e) => {
    push('uncaught', `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? `${e.reason.message}\n${e.reason.stack ?? ''}` : String(e.reason);
    push('rejection', reason);
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
