/**
 * Reports critical frontend errors to the backend developer log endpoint.
 * Fire-and-forget — never blocks UI and never throws.
 */

let buffer: Array<{ source: string; message: string; data?: unknown }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let disabled = false;

const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_BUFFER = 10;

function scheduleFlush() {
  if (disabled || flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL);
}

async function flush() {
  flushTimer = null;
  if (disabled || buffer.length === 0) return;

  const batch = buffer.splice(0, MAX_BUFFER);

  try {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const url = `${baseUrl.replace(/\/$/, '')}/feedback`;

    const rawMessage = batch.map(e => `[${e.source}] ${e.message}`).join('\n');
    const message = rawMessage.length >= 10 ? rawMessage : `Frontend error: ${rawMessage}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'frontend-error-reporter',
        type: 'Bug',
        email: 'frontend-errors@code829.local',
        message,
        context: JSON.stringify(batch.map(e => e.data).filter(Boolean)),
      }),
      keepalive: true,
    });

    if (!res.ok) {
      disabled = true;
    }
  } catch {
    disabled = true;
  }
}

export function reportError(source: string, message: string, data?: unknown) {
  if (disabled) return;
  buffer.push({ source, message, data: data instanceof Error ? data.message : data });
  if (buffer.length >= MAX_BUFFER) {
    void flush();
  } else {
    scheduleFlush();
  }
}
