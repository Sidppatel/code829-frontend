export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// CSP split:
//   style-src-elem: nonce-based — blocks stylesheet injection via <style> / <link> tags.
//     AntD injects its component styles via <style> and receives this nonce through
//     ConfigProvider csp={{nonce}} (see ThemedApp.tsx reading meta[name="csp-nonce"]).
//   style-src-attr: 'unsafe-inline' — retained intentionally. The codebase has 1,335
//     inline style={{...}} call sites across 123 files (audit performed for FE #44).
//     Migrating to Tailwind classes is tracked as a follow-up refactor and cannot land
//     in a single security PR without unacceptable regression risk. Residual risk is
//     low: style-attr XSS requires pre-existing DOM write (which already bypasses CSP
//     via script-src). script-src is nonce-locked. Revisit once the migration lands.
//   img-src: narrowed from the blanket `https:` to explicit R2 + imagedelivery origins
//     (mirrors the BE SecurityHeadersMiddleware allowlist).
//   connect-src: proxied API only — no public onrender.com origin. All /api traffic
//     goes through the Worker's origin so the backend can CF-only lock down (BE #88).
const CSP_TEMPLATE = (nonce: string) =>
  `default-src 'self'; ` +
  `script-src 'self' https://js.stripe.com https://static.cloudflareinsights.com; ` +
  `style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com; ` +
  `style-src-attr 'unsafe-inline'; ` +
  `font-src 'self' https://fonts.gstatic.com; ` +
  `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://imagedelivery.net; ` +
  `connect-src 'self' https://api.stripe.com https://cloudflareinsights.com; ` +
  `frame-src https://js.stripe.com; ` +
  `object-src 'none'; ` +
  `base-uri 'self'; ` +
  `form-action 'self' https://api.stripe.com;`;

export async function injectNonce(assetResponse: Response, nonce: string): Promise<Response> {
  const html = await assetResponse.text();
  const patched = html.replace('<head>', `<head><meta name="csp-nonce" content="${nonce}">`);
  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Security-Policy', CSP_TEMPLATE(nonce));
  return new Response(patched, { status: assetResponse.status, headers });
}
