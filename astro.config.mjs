// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Domaine public du site : sert aux balises canonical, au sitemap, à robots.txt et au JSON-LD.
  // PROVISOIRE : le domaine définitif n'est pas encore choisi (voir docs/plan-de-redirection.md, §3).
  // Le confirmer ou le remplacer ici avant la bascule DNS : rien d'autre à modifier.
  site: 'https://ecolemontessorinantes.com',
  // Conserve les URL actuelles : /chenilles-petons.html, /index.html…
  build: { format: 'file' },
});
