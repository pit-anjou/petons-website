// Publié à /llms.txt (format https://llmstxt.org) : un sommaire du site en Markdown pour les assistants IA.
// Tout est dérivé du reste du site : rubriques et libellés de footerNav (src/data/site.ts), description de chaque
// page lue dans son <Referencement … />, coordonnées de `contact`. Une nouvelle page y entre toute seule (rubrique
// « Autres pages » si elle n’est pas dans le footer) ; une page marquée noindex en est exclue, comme du sitemap.
import type { APIRoute } from 'astro';
import { contact, footerNav } from '../data/site';

const sources = import.meta.glob<string>('./*.astro', { query: '?raw', import: 'default', eager: true });
const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/;

interface Page {
  readonly titre: string;
  readonly description: string;
}

/** Valeur d’un attribut de <Referencement … />, écrit `nom={"…"}` ou `nom="…"`. */
const attribut = (source: string, nom: string, chemin: string): string => {
  const trouve = source.match(new RegExp(`<Referencement\\b[^>]*?\\b${nom}=\\{?"([^"]*)"`));
  if (!trouve) throw new Error(`${chemin} : attribut « ${nom} » introuvable dans <Referencement … />.`);
  return trouve[1]!;
};

const pages = new Map<string, Page>(
  Object.entries(sources)
    .filter(([, source]) => !noindex.test(source))
    .map(([chemin, source]) => {
      const nom = chemin.replace(/^\.\//, '').replace(/\.astro$/, '');
      const page = { titre: attribut(source, 'title', chemin), description: attribut(source, 'description', chemin) };
      return [nom === 'index' ? '/' : nom, page] as const;
    }),
);

/** « Dons et solidarité · Soutenir Les Petons… » → « Dons et solidarité » : libellé d’une page absente du footer. */
const libelleCourt = (titre: string): string => titre.split(/ [|·—] /)[0]!;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
  const accueil = pages.get('/');
  if (!accueil) throw new Error('La page d’accueil (src/pages/index.astro) est introuvable.');

  const ligne = (href: string, libelle: string): string => {
    const page = pages.get(href)!;
    return `- [${libelle}](${new URL(href, site).href}): ${page.description}`;
  };
  const dansLeFooter = new Set(footerNav.flatMap((rubrique) => rubrique.links.map((lien) => lien.href)));
  const rubriques = footerNav.map((rubrique) => ({
    titre: rubrique.title,
    lignes: rubrique.links.filter((lien) => pages.has(lien.href)).map((lien) => ligne(lien.href, lien.label)),
  }));
  const autres = [...pages.keys()]
    .filter((href) => !dansLeFooter.has(href))
    .sort()
    .map((href) => ligne(href, libelleCourt(pages.get(href)!.titre)));
  if (autres.length > 0) rubriques.push({ titre: 'Autres pages', lignes: autres });

  const texte = [
    '# Les Petons dans l’Herbe',
    '',
    `> ${accueil.description}`,
    '',
    'Les Petons dans l’Herbe est une école Montessori associative à Nantes Nord, pour les enfants de 3 à 12 ans.',
    `Adresse : ${contact.address.join(', ')}. Courriel : ${contact.email}. Instagram : ${contact.instagram.href}`,
    ...rubriques.flatMap((rubrique) => ['', `## ${rubrique.titre}`, '', ...rubrique.lignes]),
    '',
  ].join('\n');
  return new Response(texte, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
