// Publié à /sitemap.xml : liste chaque page de src/pages, une nouvelle page y entre toute seule.
// Une page marquée `<meta name="robots" content="noindex">` en est exclue : la Search Console signale
// sinon « Envoyée mais marquée noindex ».
import type { APIRoute } from 'astro';

const sources = import.meta.glob<string>('./*.astro', { query: '?raw', import: 'default', eager: true });
const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/;

const fichiers = Object.entries(sources)
  .filter(([, source]) => !noindex.test(source))
  .map(([chemin]) => chemin.replace(/^\.\//, '').replace(/\.astro$/, '.html'))
  .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
  const adresses = fichiers.map((fichier) => new URL(fichier === 'index.html' ? '/' : fichier, site).href);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...adresses.map((adresse) => `  <url><loc>${adresse}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
