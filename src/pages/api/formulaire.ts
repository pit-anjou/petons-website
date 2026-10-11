// Route des formulaires du site : voir docs/formulaires-brevo.md.
// Toute la logique est dans src/lib/formulaires/requete.ts (testée sans Astro ni réseau).
import type { APIRoute } from 'astro';
import { BREVO_API_KEY } from 'astro:env/server';
import { brevo } from '../../data/brevo';
import { traiterRequete } from '../../lib/formulaires/requete';

export const prerender = false;

export const ALL: APIRoute = ({ request }) =>
  traiterRequete(request, {
    cleApi: BREVO_API_KEY,
    config: brevo,
    fetch: (url, init) => fetch(url, init),
    // Journaux Vercel : jamais le contenu des champs.
    journal: (evenement) => console.warn('[formulaire]', JSON.stringify(evenement)),
  });
