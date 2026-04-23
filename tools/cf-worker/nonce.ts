export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

const CSP_TEMPLATE = (nonce: string) =>
  `default-src 'self'; ` +
  `script-src 'self' https://js.stripe.com https://static.cloudflareinsights.com; ` +
  `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com; ` +
  `font-src 'self' https://fonts.gstatic.com; ` +
  `img-src 'self' data: blob: https:; ` +
  `connect-src 'self' https://api.stripe.com https://cloudflareinsights.com https://code829-backend.onrender.com; ` +
  `frame-src https://js.stripe.com; ` +
  `base-uri 'self'; ` +
  `form-action 'self' https://api.stripe.com;`;

export async function injectNonce(assetResponse: Response, nonce: string): Promise<Response> {
  const html = await assetResponse.text();
  const patched = html.replace('<head>', `<head><meta name="csp-nonce" content="${nonce}">`);
  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Security-Policy', CSP_TEMPLATE(nonce));
  return new Response(patched, { status: assetResponse.status, headers });
}
