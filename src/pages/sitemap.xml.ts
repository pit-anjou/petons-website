// Publié à /sitemap.xml : liste chaque page de src/pages, une nouvelle page y entre toute seule.
import type { APIRoute } from 'astro';

const fichiers = Object.keys(import.meta.glob('./*.astro'))
  .map((chemin) => chemin.replace(/^\.\//, '').replace(/\.astro$/, '.html'))
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
