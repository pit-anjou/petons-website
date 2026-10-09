// Redirections de l’ancien site WordPress (ecolemontessorinantes.com) vers les pages Astro.
// Le plan complet est dans docs/plan-de-redirection.md ; les règles vivent dans vercel.json.
import { expect, test } from 'bun:test';
import { pathToRegexp } from 'path-to-regexp';

interface Redirection {
  readonly source: string;
  readonly destination: string;
  readonly permanent: boolean;
}

const { redirects } = (await Bun.file('vercel.json').json()) as { redirects: ReadonlyArray<Redirection> };

// Mêmes options que @vercel/routing-utils : une adresse doit correspondre exactement, majuscules comprises.
const correspond = (source: string, chemin: string): boolean =>
  pathToRegexp(source, [], { strict: true, sensitive: true, delimiter: '/' }).test(chemin);

const destinationDe = (chemin: string): string | undefined =>
  redirects.find(({ source }) => correspond(source, chemin))?.destination;

// Toutes les adresses des sitemaps Yoast de l’ancien site (relevé du 9 octobre 2026), avec leur cible.
const ANCIENNES_ADRESSES: Readonly<Record<string, string>> = {
  '/ecole-montessori-nantes/': '/',
  '/lecole/': '/ecole-petons.html',
  '/qui-sommes-nous/': '/equipe-petons.html',
  '/nous-rejoindre/': '/equipe-petons.html#rejoindre',
  '/nos-valeurs/': '/pedagogie-petons.html',
  '/la-vie-a-lecole/': '/vie-pratique-petons.html',
  '/informations-pratiques/': '/vie-pratique-petons.html',
  '/portfolio/': '/vie-pratique-petons.html#familles',
  '/portfolio/role-de-lape/': '/vie-pratique-petons.html#familles',
  '/portfolio/roles-des-membres-de-lape/': '/vie-pratique-petons.html#familles',
  '/portfolio/election-du-bureau/': '/vie-pratique-petons.html#familles',
  '/journees-portes-ouvertes/': '/actualites-petons.html#portes-ouvertes',
  '/tarifs/': '/tarifs-petons.html',
  '/inscription/': '/inscriptions-petons.html',
  '/contact/': '/contact-petons.html',
  '/boite-a-idees/': '/contact-petons.html',
  '/la-creche/': '/',
  '/feed/': '/actualites-petons.html',
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

test('toutes les redirections sont permanentes (308) et chaque règle sert au moins une ancienne adresse', () => {
  expect(redirects.filter(({ permanent }) => !permanent)).toEqual([]);
  const inutiles = redirects.filter(({ source }) => !Object.keys(ANCIENNES_ADRESSES).some((chemin) => correspond(source, chemin)));
  expect(inutiles).toEqual([]);
});

const pageAstro = (destination: string): string => {
  const chemin = destination.split('#')[0]!;
  return chemin === '/' ? 'src/pages/index.astro' : `src/pages/${chemin.replace(/^\//, '').replace(/\.html$/, '')}.astro`;
};

test('chaque destination est une page qui existe, et chaque ancre un id de cette page', async () => {
  for (const { destination } of redirects) {
    const fichier = Bun.file(pageAstro(destination));
    expect({ destination, existe: await fichier.exists() }).toEqual({ destination, existe: true });
    const ancre = destination.split('#')[1];
    if (ancre) expect({ destination, ancre: (await fichier.text()).includes(`id="${ancre}"`) }).toEqual({ destination, ancre: true });
  }
});

test('aucune règle ne capture une page du nouveau site', async () => {
  const pages = [...new Bun.Glob('*.astro').scanSync('src/pages')].map((fichier) =>
    fichier === 'index.astro' ? '/' : `/${fichier.replace(/\.astro$/, '.html')}`,
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
