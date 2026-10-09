// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
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
  ],
  env: {
    schema: {
      // Clé API Brevo : variables d'environnement Vercel, ou fichier .env en local. Voir docs/formulaires-brevo.md.
      BREVO_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
