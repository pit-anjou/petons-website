// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import { redirections } from './src/data/redirections';
import { redirectionsVercel } from './src/integrations/redirections-vercel';

export default defineConfig({
  // Domaine public du site : sert aux balises canonical, au sitemap, à robots.txt et au JSON-LD.
  // Domaine principal en www depuis le 12 octobre 2026 (voir docs/plan-de-redirection.md, §3) ; le domaine
  // nu redirige vers lui dans Vercel. En cas de changement, modifier cette seule ligne : rien d'autre à modifier.
  site: 'https://www.ecolemontessorinantes.com',
  // Conserve les URL actuelles : /chenilles-petons.html, /index.html…
  build: { format: 'file' },
  // Toutes les pages restent statiques ; seule src/pages/api/formulaire.ts tourne sur Vercel (prerender = false).
  adapter: vercel(),
  integrations: [
    {
      // L'adaptateur Vercel impose build.format: 'directory' (contact-petons/index.html, donc plus
      // de contact-petons.html). Cette intégration, placée après lui, rétablit le format « file ».
      name: 'conserver-urls-html',
      hooks: {
        'astro:config:setup': ({ updateConfig }) => updateConfig({ build: { format: 'file' } }),
      },
    },
    // Redirections de l’ancien site WordPress : src/data/redirections.ts (plan : docs/plan-de-redirection.md).
    redirectionsVercel(redirections),
  ],
  vite: {
    build: {
      rolldownOptions: {
        treeshake: {
          // @astrojs/vercel 11.0.13 : la fonction serveur importe des constantes du fichier principal de
          // l’adaptateur, ce qui y laisse `import "rolldown"` (outil de build, module natif absent sur Vercel)
          // et `import "@vercel/routing-utils"`. La fonction plantait au chargement (« Cannot find native
          // binding », erreur 500). Ces deux paquets n’ont aucun effet de bord : on retire ces imports.
          // Vérifié par tests/fonction-vercel.test.ts.
          moduleSideEffects: [{ test: /^(rolldown|@vercel\/routing-utils)$/, external: true, sideEffects: false }],
        },
      },
    },
  },
  env: {
    schema: {
      // Clé API Brevo : variables d'environnement Vercel, ou fichier .env en local. Voir docs/formulaires-brevo.md.
      BREVO_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
