/// <reference types="@cloudflare/workers-types" />

import type { ApiProxyEnv } from './apiProxy';

interface OgMeta {
  type?: string;
  title?: string;
  description?: string;
  url?: string;
  site_name?: string;
  image?: string | null;
}

interface TwitterMeta {
  card?: string;
  title?: string;
  description?: string;
  image?: string | null;
}

interface SeoBlock {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  image?: string | null;
  og?: OgMeta;
  twitter?: TwitterMeta;
}

interface MetaPayload {
  seo?: SeoBlock;
  schema?: Record<string, unknown>;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

export async function tryInjectEventMeta(
  response: Response,
  url: URL,
  env: ApiProxyEnv,
): Promise<Response | null> {
  const match = url.pathname.match(/^\/events\/([^\/]+)\/?$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  if (!SLUG_PATTERN.test(slug)) return null;
  if (!env.VITE_API_URL) return null;
  if (!response.headers.get('content-type')?.includes('text/html')) return null;

  const apiBase = env.VITE_API_URL.endsWith('/') ? env.VITE_API_URL : `${env.VITE_API_URL}/`;
  let payload: MetaPayload | null = null;
  try {
    const upstream = await fetch(`${apiBase}events/by-slug/${encodeURIComponent(slug)}/meta`);
    if (!upstream.ok) return null;
    payload = (await upstream.json()) as MetaPayload;
  } catch {
    return null;
  }

  const seo = payload?.seo;
  if (!seo) return null;

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        if (seo.title) el.setInnerContent(seo.title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        if (seo.description) el.setAttribute('content', seo.description);
      },
    })
    .on('head', {
      element(el) {
        el.append(buildHeadFragment(seo, payload?.schema), { html: true });
      },
    });

  return rewriter.transform(response);
}

function buildHeadFragment(seo: SeoBlock, schema: Record<string, unknown> | undefined): string {
  const tags: string[] = [];
  if (seo.canonicalUrl) tags.push(`<link rel="canonical" href="${esc(seo.canonicalUrl)}">`);

  const og = seo.og ?? {};
  pushMeta(tags, 'property', 'og:type', og.type);
  pushMeta(tags, 'property', 'og:title', og.title);
  pushMeta(tags, 'property', 'og:description', og.description);
  pushMeta(tags, 'property', 'og:url', og.url);
  pushMeta(tags, 'property', 'og:site_name', og.site_name);
  pushMeta(tags, 'property', 'og:image', og.image ?? undefined);

  const tw = seo.twitter ?? {};
  pushMeta(tags, 'name', 'twitter:card', tw.card);
  pushMeta(tags, 'name', 'twitter:title', tw.title);
  pushMeta(tags, 'name', 'twitter:description', tw.description);
  pushMeta(tags, 'name', 'twitter:image', tw.image ?? undefined);

  if (schema && Object.keys(schema).length > 0) {
    const json = JSON.stringify(schema).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }

  return tags.join('\n');
}

function pushMeta(tags: string[], attrName: string, attrValue: string, content: string | undefined | null): void {
  if (!content) return;
  tags.push(`<meta ${attrName}="${attrValue}" content="${esc(content)}">`);
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
