/// <reference types="@cloudflare/workers-types" />

import { handleApiProxy, type ApiProxyEnv } from '../../../tools/cf-worker/apiProxy';

interface Env extends ApiProxyEnv {
  ASSETS: Fetcher;
}

const ALLOWED_ORIGINS = [
  'https://admin.code829.com',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
] as const;

const DEFAULT_ORIGIN = 'https://admin.code829.com';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApiProxy(request, env, ALLOWED_ORIGINS, DEFAULT_ORIGIN);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
