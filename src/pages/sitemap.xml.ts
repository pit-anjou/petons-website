// Publié à /sitemap.xml : liste chaque page de src/pages, une nouvelle page y entre toute seule.
import type { APIRoute } from 'astro';

const pages = Object.keys(import.meta.glob('./*.astro'))
  .map((chemin) => chemin.replace(/^\.\//, '').replace(/\.astro$/, ''))
  .map((nom) => (nom === 'index' ? '/' : nom))
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
  const adresses = pages.map((page) => new URL(page, site).href);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...adresses.map((adresse) => `  <url><loc>${adresse}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
