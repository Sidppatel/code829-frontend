/// <reference types="@cloudflare/workers-types" />

import { handleApiProxy, type ApiProxyEnv } from '../../../tools/cf-worker/apiProxy';
import { handleSitemap, type SitemapEnv } from '../../../tools/cf-worker/sitemap';

interface Env extends ApiProxyEnv, SitemapEnv {
  ASSETS: Fetcher;
}

const ALLOWED_ORIGINS = [
  'https://code829.com',
  'https://www.code829.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
] as const;

const DEFAULT_ORIGIN = 'https://code829.com';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') {
      return handleSitemap(request, env);
    }

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApiProxy(request, env, ALLOWED_ORIGINS, DEFAULT_ORIGIN);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
