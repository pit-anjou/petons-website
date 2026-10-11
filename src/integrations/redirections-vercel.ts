// Ajoute les redirections de src/data/redirections.ts au routage écrit par l’adaptateur Vercel.
// Les redirections natives d’Astro ne savent ni accepter la barre finale, ni envoyer `/portfolio/…`
// vers une page fixe ; et l’adaptateur écrit son propre .vercel/output/config.json, sans reprendre
// celles de vercel.json. On convertit donc les règles avec l’outil de Vercel lui-même, puis on les
// place en tête du routage, avant les fichiers statiques.
import { readFile, writeFile } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import { getTransformedRoutes } from '@vercel/routing-utils';
import type { Redirection } from '../data/redirections';

interface ConfigVercel {
  routes?: unknown[];
}

/** Routage Vercel complété : les redirections passent devant toutes les routes existantes. */
export const avecRedirections = (config: ConfigVercel, redirections: ReadonlyArray<Redirection>): ConfigVercel => {
  const { routes, error } = getTransformedRoutes({ redirects: [...redirections] });
  if (error) throw new Error(`Redirections invalides : ${error.message}`);
  return { ...config, routes: [...(routes ?? []), ...(config.routes ?? [])] };
};

export const redirectionsVercel = (redirections: ReadonlyArray<Redirection>): AstroIntegration => {
  let racine: URL;
  return {
    name: 'redirections-vercel',
    hooks: {
      'astro:config:done': ({ config }) => {
        racine = config.root;
      },
      // L’adaptateur passe toujours avant les autres intégrations : son config.json existe déjà ici.
      'astro:build:done': async () => {
        const fichier = new URL('.vercel/output/config.json', racine);
        const config = JSON.parse(await readFile(fichier, 'utf8')) as ConfigVercel;
        await writeFile(fichier, JSON.stringify(avecRedirections(config, redirections), null, 2));
      },
    },
  };
};
