// Redirections de l’ancien site WordPress (ecolemontessorinantes.com) vers les pages Astro.
// Le plan complet est dans docs/plan-de-redirection.md ; les règles vivent dans src/data/redirections.ts.
import { expect, test } from 'bun:test';
import { pathToRegexp } from 'path-to-regexp';
import { redirections } from '../src/data/redirections';

// Mêmes options que @vercel/routing-utils : une adresse doit correspondre exactement, majuscules comprises.
const correspond = (source: string, chemin: string): boolean =>
  pathToRegexp(source, [], { strict: true, sensitive: true, delimiter: '/' }).test(chemin);

const destinationDe = (chemin: string): string | undefined =>
  redirections.find(({ source }) => correspond(source, chemin))?.destination;

// Toutes les adresses des sitemaps Yoast de l’ancien site (relevé du 9 octobre 2026), avec leur cible,
// plus celles que la Search Console a relevées le 12 octobre 2026 (/le-lieu/, ancien dossier d’inscription).
const ANCIENNES_ADRESSES: Readonly<Record<string, string>> = {
  '/ecole-montessori-nantes/': '/',
  '/lecole/': '/ecole-petons',
  '/qui-sommes-nous/': '/equipe-petons',
  '/nous-rejoindre/': '/equipe-petons#rejoindre',
  '/nos-valeurs/': '/pedagogie-petons',
  '/la-vie-a-lecole/': '/vie-pratique-petons',
  '/informations-pratiques/': '/vie-pratique-petons',
  '/portfolio/': '/vie-pratique-petons#familles',
  '/portfolio/role-de-lape/': '/equipe-petons#association',
  '/portfolio/roles-des-membres-de-lape/': '/equipe-petons#association',
  '/portfolio/election-du-bureau/': '/equipe-petons#association',
  '/portfolio/une-autre-fiche/': '/vie-pratique-petons#familles',
  '/journees-portes-ouvertes/': '/actualites-petons#portes-ouvertes',
  '/tarifs/': '/tarifs-petons',
  '/inscription/': '/inscriptions-petons',
  '/contact/': '/contact-petons',
  '/boite-a-idees/': '/contact-petons',
  '/la-creche/': '/',
  '/le-lieu/': '/ecole-petons',
  '/feed/': '/actualites-petons',
  '/category/non-classe/': '/',
  '/tag/design/': '/',
};

test('chaque ancienne adresse redirige vers sa nouvelle page, avec ou sans barre finale', () => {
  for (const [ancienne, attendue] of Object.entries(ANCIENNES_ADRESSES)) {
    expect({ ancienne, cible: destinationDe(ancienne) }).toEqual({ ancienne, cible: attendue });
    const sansBarre = ancienne.replace(/\/$/, '');
    expect({ ancienne: sansBarre, cible: destinationDe(sansBarre) }).toEqual({ ancienne: sansBarre, cible: attendue });
  }
});

// Fichier, donc sans barre finale : testé à part.
const ANCIEN_DOSSIER_PDF = '/wp-content/uploads/2018/07/Dossier_Inscription_LPDLH_2018_2019.pdf';

test('l’ancien dossier d’inscription en PDF redirige vers la page Inscriptions', () => {
  expect(destinationDe(ANCIEN_DOSSIER_PDF)).toBe('/inscriptions-petons');
  expect(destinationDe('/wp-content/uploads/2018/07/autre.pdf')).toBeUndefined();
});

test('toutes les redirections sont permanentes (308) et chaque règle sert au moins une ancienne adresse', () => {
  expect(redirections.filter(({ permanent }) => !permanent)).toEqual([]);
  const servies = [...Object.keys(ANCIENNES_ADRESSES), ANCIEN_DOSSIER_PDF];
  const inutiles = redirections.filter(({ source }) => !servies.some((chemin) => correspond(source, chemin)));
  expect(inutiles).toEqual([]);
});

const pageAstro = (destination: string): string => {
  const chemin = destination.split('#')[0]!;
  return chemin === '/' ? 'src/pages/index.astro' : `src/pages/${chemin.replace(/^\//, '')}.astro`;
};

test('chaque destination est une page qui existe, et chaque ancre un id de cette page', async () => {
  for (const { destination } of redirections) {
    const fichier = Bun.file(pageAstro(destination));
    expect({ destination, existe: await fichier.exists() }).toEqual({ destination, existe: true });
    const ancre = destination.split('#')[1];
    if (ancre) expect({ destination, ancre: (await fichier.text()).includes(`id="${ancre}"`) }).toEqual({ destination, ancre: true });
  }
});

test('aucune règle ne capture une page du nouveau site', async () => {
  const pages = [...new Bun.Glob('*.astro').scanSync('src/pages')].map((fichier) =>
    fichier === 'index.astro' ? '/' : `/${fichier.replace(/\.astro$/, '')}`,
  );
  expect(pages.length).toBeGreaterThan(10);
  expect(pages.filter((page) => destinationDe(page) !== undefined && page !== '/')).toEqual([]);
  expect(destinationDe('/')).toBeUndefined();
  expect(destinationDe('/index.html')).toBeUndefined();
});

test('le contrôle détecte une adresse non couverte', () => {
  expect(destinationDe('/une-page-inconnue/')).toBeUndefined();
  expect(destinationDe('/Tarifs/')).toBeUndefined();
});

// Le routage réellement publié : .vercel/output/config.json, écrit par l’adaptateur puis complété par
// src/integrations/redirections-vercel.ts (à lancer après « bun run build »).
test('le routage publié redirige chaque ancienne adresse, avant de servir les fichiers', async () => {
  const fichier = Bun.file('.vercel/output/config.json');
  if (!(await fichier.exists())) throw new Error('.vercel/output/config.json introuvable : lancez d’abord « bun run build ».');
  const { routes, overrides } = (await fichier.json()) as {
    routes: ReadonlyArray<{ src?: string; handle?: string; status?: number; headers?: Record<string, string> }>;
    overrides?: Record<string, { path?: string }>;
  };
  const avantFichiers = routes.slice(0, routes.findIndex((route) => route.handle === 'filesystem'));
  const publiee = (chemin: string) => {
    const route = avantFichiers.find(({ src, status }) => status !== undefined && src !== undefined && new RegExp(src).test(chemin));
    return route && { status: route.status, cible: route.headers?.Location?.replace(/\$(\d)/g, (_, n: string) => new RegExp(route.src!).exec(chemin)![Number(n)] ?? '') };
  };
  for (const [ancienne, attendue] of Object.entries(ANCIENNES_ADRESSES)) {
    for (const chemin of [ancienne, ancienne.replace(/\/$/, '')]) {
      expect({ chemin, redirection: publiee(chemin) }).toEqual({ chemin, redirection: { status: 308, cible: attendue } });
    }
  }
  expect(publiee(ANCIEN_DOSSIER_PDF)).toEqual({ status: 308, cible: '/inscriptions-petons' });
  // Adresses sans « .html » : la page est servie telle quelle, l’ancienne forme et la barre finale y redirigent.
  expect(publiee('/contact-petons')).toBeUndefined();
  expect(publiee('/contact-petons.html')).toEqual({ status: 308, cible: '/contact-petons' });
  expect(publiee('/contact-petons/')).toEqual({ status: 308, cible: '/contact-petons' });
  expect(publiee('/index.html')).toEqual({ status: 308, cible: '/' });
  const pages = [...new Bun.Glob('*.html').scanSync('.vercel/output/static')].filter((page) => page !== 'index.html');
  expect(pages.length).toBeGreaterThan(10);
  for (const page of pages) {
    expect({ page, servie: overrides?.[page]?.path }).toEqual({ page, servie: page.replace(/\.html$/, '') });
  }
});
