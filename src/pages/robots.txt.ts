// Publié à /robots.txt : tout est ouvert aux moteurs, et le sitemap est annoncé avec le domaine du site.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
  const texte = ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap.xml', site).href}`, ''].join('\n');
  return new Response(texte, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
