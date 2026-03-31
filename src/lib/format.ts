/**
 * Shared formatting utilities used across the app.
 */

/** Format cents to a USD currency string, or "Free" for zero/null. */
export function formatPriceCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Format an ISO date string for display (e.g. "Mon, Jan 6, 10:30 AM"). */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a date range for display (e.g. "Mon Jan 6, 10:00 AM – 2:00 PM"). */
export function formatDateRange(startStr: string, endStr: string | null): string {
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return '';

  const startFmt = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!endStr) return startFmt;

  const end = new Date(endStr);
  if (isNaN(end.getTime())) return startFmt;

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    const endTime = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${startFmt} – ${endTime}`;
  }

  const endFmt = end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${startFmt} – ${endFmt}`;
}
