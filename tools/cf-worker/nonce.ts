export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// CSP split:
//   style-src-elem: nonce-based — blocks stylesheet injection via <style> / <link> tags.
//     AntD injects its component styles via <style> and receives this nonce through
//     ConfigProvider csp={{nonce}} (see ThemedApp.tsx reading meta[name="csp-nonce"]).
//   style-src-attr: 'unsafe-inline' — allows JSX inline style={{...}} attributes.
//     Narrower attack surface than style-src-elem: exploiting style-attr XSS requires
//     pre-existing DOM write, which would already bypass CSP.
const CSP_TEMPLATE = (nonce: string) =>
  `default-src 'self'; ` +
  `script-src 'self' https://js.stripe.com https://static.cloudflareinsights.com; ` +
  `style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com; ` +
  `style-src-attr 'unsafe-inline'; ` +
  `font-src 'self' https://fonts.gstatic.com; ` +
  `img-src 'self' data: blob: https:; ` +
  `connect-src 'self' https://api.stripe.com https://cloudflareinsights.com https://code829-backend.onrender.com; ` +
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
