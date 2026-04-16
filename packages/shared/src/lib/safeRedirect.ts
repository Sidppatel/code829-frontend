/**
 * Validates a returnUrl to prevent open redirect attacks.
 * Only allows relative paths starting with a single slash.
 */
export function safeReturnUrl(url: string | null | undefined, fallback = '/'): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return fallback;
  return url;
}
