/// <reference types="@cloudflare/workers-types" />

export interface SitemapEnv {
  VITE_API_URL?: string;
  FRONTEND_URL?: string;
}

interface EventItem {
  eventId?: string | number;
  slug?: string;
}

interface EventsResponse {
  items?: EventItem[];
}

export async function handleSitemap(request: Request, env: SitemapEnv): Promise<Response> {
  const baseUrl = env.FRONTEND_URL || new URL(request.url).origin;
  const staticUrls = ['/', '/events'];
  let dynamicUrls: string[] = [];

  if (env.VITE_API_URL) {
    try {
      const normalizedBase = env.VITE_API_URL.endsWith('/') ? env.VITE_API_URL : `${env.VITE_API_URL}/`;
      const response = await fetch(`${normalizedBase}events?pageSize=1000`);
      if (response.ok) {
        const data = (await response.json()) as EventsResponse;
        if (data?.items?.length) {
          dynamicUrls = data.items
            .map((event) => event.slug ?? event.eventId)
            .filter((v): v is string | number => v !== undefined)
            .map((v) => `/events/${v}`);
        }
      } else {
        console.warn(`Sitemap event fetch failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Sitemap fetch error:', err);
    }
  }

  const urlNodes = [...staticUrls, ...dynamicUrls]
    .map((path) => {
      const changefreq = path === '/' || path === '/events' ? 'daily' : 'weekly';
      const priority = path === '/' ? '1.0' : path === '/events' ? '0.9' : '0.8';
      return `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
