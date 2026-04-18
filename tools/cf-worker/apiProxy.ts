/// <reference types="@cloudflare/workers-types" />

export interface ApiProxyEnv {
  VITE_API_URL?: string;
}

export async function handleApiProxy(
  request: Request,
  env: ApiProxyEnv,
  allowedOrigins: readonly string[],
  defaultOrigin: string,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, allowedOrigins, defaultOrigin, true),
    });
  }

  const backendBaseUrl = env.VITE_API_URL;
  if (!backendBaseUrl) {
    return jsonError(500, 'Configuration Error', 'VITE_API_URL is not defined in Worker environment.');
  }

  const targetPath = url.pathname.replace(/^\/api\/?/, '');
  const normalizedBase = backendBaseUrl.endsWith('/') ? backendBaseUrl : `${backendBaseUrl}/`;

  let targetUrl: URL;
  try {
    targetUrl = new URL(`${normalizedBase}${targetPath}${url.search}`);
  } catch (err) {
    return jsonError(500, 'Invalid Configuration', `Failed to construct target URL: ${stringifyErr(err)}`);
  }

  const forwarded = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow',
  });

  try {
    const upstream = await fetch(forwarded);
    const response = new Response(upstream.body, upstream);
    applyCorsHeaders(response.headers, request, allowedOrigins, defaultOrigin);
    return response;
  } catch (err) {
    return jsonError(502, 'Failed to proxy request', stringifyErr(err));
  }
}

function corsHeaders(
  request: Request,
  allowedOrigins: readonly string[],
  defaultOrigin: string,
  preflight: boolean,
): HeadersInit {
  const origin = request.headers.get('Origin');
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : defaultOrigin;
  const base: Record<string, string> = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Portal',
    'Access-Control-Allow-Credentials': 'true',
  };
  if (preflight) base['Access-Control-Max-Age'] = '86400';
  return base;
}

function applyCorsHeaders(
  headers: Headers,
  request: Request,
  allowedOrigins: readonly string[],
  defaultOrigin: string,
): void {
  const entries = corsHeaders(request, allowedOrigins, defaultOrigin, false) as Record<string, string>;
  for (const [key, value] of Object.entries(entries)) headers.set(key, value);
}

function jsonError(status: number, error: string, details: string): Response {
  return new Response(JSON.stringify({ error, details }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stringifyErr(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
