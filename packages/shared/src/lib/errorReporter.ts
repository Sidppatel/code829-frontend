/**
 * Reports critical frontend errors to the backend developer log endpoint.
 * Fire-and-forget — never blocks UI and never throws.
 */

let buffer: Array<{ source: string; message: string; data?: unknown }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_BUFFER = 10;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL);
}

async function flush() {
  flushTimer = null;
  if (buffer.length === 0) return;

  const batch = buffer.splice(0, MAX_BUFFER);

  try {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const url = `${baseUrl.replace(/\/$/, '')}/feedback`;

    // Use fetch directly to avoid circular dependency with axios
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Bug',
        email: 'frontend-errors@code829.local',
        message: batch.map(e => `[${e.source}] ${e.message}`).join('\n'),
        context: JSON.stringify(batch.map(e => e.data).filter(Boolean)),
      }),
      keepalive: true,
    });
  } catch {
    // Silently fail — can't report errors if reporting itself fails
  }
}

export function reportError(source: string, message: string, data?: unknown) {
  buffer.push({ source, message, data: data instanceof Error ? data.message : data });
  if (buffer.length >= MAX_BUFFER) {
    void flush();
  } else {
    scheduleFlush();
  }
}
