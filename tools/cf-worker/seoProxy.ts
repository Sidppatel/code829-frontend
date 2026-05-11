/// <reference types="@cloudflare/workers-types" />

import type { ApiProxyEnv } from './apiProxy';

export async function handleSeoProxy(pathname: string, env: ApiProxyEnv): Promise<Response> {
  const apiBase = env.VITE_API_URL;
  if (!apiBase) {
    return new Response('VITE_API_URL not configured', { status: 500 });
  }

  let origin: string;
  try {
    origin = new URL(apiBase).origin;
  } catch {
    return new Response('Invalid VITE_API_URL', { status: 500 });
  }

  const upstream = await fetch(`${origin}${pathname}`, { redirect: 'follow' });
  const body = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') ??
    (pathname.endsWith('.xml') ? 'application/xml' : 'text/plain');

  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
