// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Domaine public du site : sert aux balises canonical, au sitemap, à robots.txt et au JSON-LD.
  // Domaine retenu le 9 octobre 2026 (voir docs/plan-de-redirection.md, §3). En cas de changement,
  // modifier cette seule ligne : rien d'autre à modifier.
  site: 'https://ecolemontessorinantes.com',
  // Conserve les URL actuelles : /chenilles-petons.html, /index.html…
  build: { format: 'file' },
});
