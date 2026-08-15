import type { APIRoute } from 'astro';
import { assetUrl } from '@/site.config';

export const prerender = true;

export const GET: APIRoute = ({ site: astroSite }) => {
  const sitemapUrl = new URL(assetUrl('sitemap-index.xml'), astroSite).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
