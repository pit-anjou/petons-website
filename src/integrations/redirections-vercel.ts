// Complète le routage écrit par l’adaptateur Vercel : adresses sans « .html » et redirections de
// src/data/redirections.ts.
// - Adresses propres : Astro écrit tarifs-petons.html, publié à /tarifs-petons (`overrides`) ; /tarifs-petons.html
//   et /index.html redirigent vers l’adresse propre (`cleanUrls`, même règle que celle de vercel.json).
// - Redirections : celles d’Astro ne savent ni accepter la barre finale, ni envoyer `/portfolio/…` vers une page fixe.
// L’adaptateur écrit son propre .vercel/output/config.json, sans reprendre vercel.json. On convertit donc les règles
// avec l’outil de Vercel lui-même, puis on les place en tête du routage, avant les fichiers statiques.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import { getTransformedRoutes } from '@vercel/routing-utils';
import type { Redirection } from '../data/redirections';

interface ConfigVercel {
  routes?: unknown[];
  overrides?: Record<string, { path?: string; contentType?: string }>;
}

/** Routage Vercel complété : adresses propres et redirections passent devant toutes les routes existantes. */
export const avecRedirections = (config: ConfigVercel, redirections: ReadonlyArray<Redirection>): ConfigVercel => {
  const { routes, error } = getTransformedRoutes({ cleanUrls: true, redirects: [...redirections] });
  if (error) throw new Error(`Redirections invalides : ${error.message}`);
  return { ...config, routes: [...(routes ?? []), ...(config.routes ?? [])] };
};

/** Pages publiées sans « .html » : tarifs-petons.html est servi à /tarifs-petons. L’accueil reste servi à /. */
export const adressesPropres = (fichiers: ReadonlyArray<string>): NonNullable<ConfigVercel['overrides']> =>
  Object.fromEntries(
    fichiers
      .filter((fichier) => fichier.endsWith('.html') && fichier !== 'index.html' && fichier !== '404.html')
      .map((fichier) => [fichier, { path: fichier.replace(/\.html$/, '') }]),
  );

export const redirectionsVercel = (redirections: ReadonlyArray<Redirection>): AstroIntegration => {
  let racine: URL;
  let pagesConstruites: URL;
  return {
    name: 'redirections-vercel',
    hooks: {
      'astro:config:done': ({ config }) => {
        racine = config.root;
        // Le build écrit les pages ici ; l’adaptateur ne les copie dans .vercel/output/static qu’après ce hook.
        pagesConstruites = config.build.client;
      },
      // L’adaptateur passe toujours avant les autres intégrations : son config.json existe déjà ici.
      'astro:build:done': async () => {
        const fichier = new URL('.vercel/output/config.json', racine);
        const config = JSON.parse(await readFile(fichier, 'utf8')) as ConfigVercel;
        const pages = await readdir(pagesConstruites);
        const complete = { ...avecRedirections(config, redirections), overrides: { ...config.overrides, ...adressesPropres(pages) } };
        await writeFile(fichier, JSON.stringify(complete, null, 2));
      },
    },
  };
};
