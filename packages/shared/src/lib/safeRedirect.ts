export function safeReturnUrl(url: string | null | undefined, fallback = '/'): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return fallback;
  return url;
}
