/// <reference types="@cloudflare/workers-types" />

export interface Env {
  VITE_API_URL?: string;
  FRONTEND_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  
  // Base URL can be configured or derived from the incoming request
  const baseUrl = env.FRONTEND_URL || new URL(request.url).origin;
  
  // Core static URLs that should always be indexed
  const staticUrls = [
    '/',
    '/events',
  ];

  let dynamicUrls: string[] = [];

  // Try fetching public events to add to sitemap
  if (env.VITE_API_URL) {
    try {
      const normalizedBase = env.VITE_API_URL.endsWith('/') ? env.VITE_API_URL : `${env.VITE_API_URL}/`;
      
      // Fetch up to 1000 events to index
      const response = await fetch(`${normalizedBase}events?pageSize=1000`);
      
      if (response.ok) {
        const data = await response.json() as any;
        if (data && data.items && Array.isArray(data.items)) {
          dynamicUrls = data.items.map((event: any) => `/events/${event.slug || event.id}`);
        }
      } else {
        console.warn(`Sitemap event fetch failed with status: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to fetch events for sitemap:', err);
    }
  }

  const allUrls = [...staticUrls, ...dynamicUrls];

  // Map URLs to sitemap XML structure
  const urlNodes = allUrls
    .map(
      (path) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>${path === '/' || path === '/events' ? 'daily' : 'weekly'}</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/events' ? '0.9' : '0.8'}</priority>
  </url>`
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour to reduce backend load
    },
  });
};
