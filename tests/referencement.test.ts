// Référencement du site publié : canonical, sitemap.xml, robots.txt et JSON-LD dérivent tous de `site`
// (astro.config.mjs). Ce test lit dist/ : lancer « bun run check » ou « bun run build » avant.
import { expect, test } from 'bun:test';
import config from '../astro.config.mjs';
import { chargerHtml, DOSSIER_PAGES } from './outils/html';
import { contact } from '../src/data/site';
import { openHouse } from '../src/data/openHouse';

const site = config.site;
if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
/** Adresse publique d’un fichier du build : tarifs-petons.html est publié à /tarifs-petons, index.html à /. */
const adresse = (fichier: string): string => new URL(fichier === 'index.html' ? '/' : fichier.replace(/\.html$/, ''), site).href;

const pagesPubliees = [...new Bun.Glob('*.html').scanSync(DOSSIER_PAGES)].sort();

test('le build publie une page par fichier de src/pages', () => {
  const sources = [...new Bun.Glob('*.astro').scanSync('src/pages')].map((fichier) => fichier.replace(/\.astro$/, '.html'));
  expect(pagesPubliees).toEqual(sources.sort());
});

test('les liens internes visent une page publiée, sans « .html »', async () => {
  const pages = new Set(pagesPubliees.map((fichier) => (fichier === 'index.html' ? '/' : fichier.replace(/\.html$/, ''))));
  const fautifs: string[] = [];
  for (const fichier of pagesPubliees) {
    for (const lien of (await chargerHtml(`${DOSSIER_PAGES}/${fichier}`)).querySelectorAll('a[href]')) {
      const href = lien.getAttribute('href')!;
      if (/^(?:[a-z]+:|\/\/|#|assets\/)/i.test(href)) continue;
      const page = href.split(/[?#]/)[0]!;
      if (!pages.has(page)) fautifs.push(`${fichier} → ${href}`);
    }
  }
  expect(fautifs).toEqual([]);
});

test('chaque page a une seule balise canonical, vers son adresse sur le domaine du site', async () => {
  for (const fichier of pagesPubliees) {
    const html = await chargerHtml(`${DOSSIER_PAGES}/${fichier}`);
    const canoniques = html.querySelectorAll('head link[rel="canonical"]').map((lien) => lien.getAttribute('href'));
    expect({ fichier, canoniques }).toEqual({ fichier, canoniques: [adresse(fichier)] });
  }
});

test('chaque page a un titre, une description et un aperçu de partage complet qui les reprend', async () => {
  for (const fichier of pagesPubliees) {
    const html = await chargerHtml(`${DOSSIER_PAGES}/${fichier}`);
    const meta = (cle: string): string[] =>
      html.querySelectorAll(`head meta[property="${cle}"], head meta[name="${cle}"]`).map((balise) => balise.getAttribute('content') ?? '');
    const titres = html.querySelectorAll('head > title').map((titre) => titre.text);
    expect({ fichier, titres: titres.length }).toEqual({ fichier, titres: 1 });
    const [description] = meta('description');
    expect({ fichier, description: (description ?? '').length > 50 }).toEqual({ fichier, description: true });
    expect({
      fichier,
      type: meta('og:type'),
      locale: meta('og:locale'),
      titre: meta('og:title'),
      description: meta('og:description'),
      url: meta('og:url'),
      carte: meta('twitter:card'),
      largeur: meta('og:image:width'),
      hauteur: meta('og:image:height'),
    }).toEqual({
      fichier,
      type: ['website'],
      locale: ['fr_FR'],
      titre: [titres[0]!],
      description: [description!],
      url: [adresse(fichier)],
      carte: ['summary_large_image'],
      largeur: ['1200'],
      hauteur: ['630'],
    });
    const [image] = meta('og:image');
    expect(image!.startsWith(new URL('/', site).href)).toBe(true);
    expect(await Bun.file(`${DOSSIER_PAGES}/${new URL(image!).pathname}`).exists()).toBe(true);
    expect((meta('og:image:alt')[0] ?? '').length).toBeGreaterThan(20);
  }
});

test('l’image de partage par défaut mesure 1200 × 630', async () => {
  const octets = new Uint8Array(await Bun.file('public/assets/img/partage/les-petons-dans-lherbe.jpg').arrayBuffer());
  // Lit l’en-tête SOF d’un JPEG (marqueurs FFC0 à FFC2) : hauteur puis largeur sur deux octets.
  let i = 2;
  while (i < octets.length && !(octets[i] === 0xff && octets[i + 1]! >= 0xc0 && octets[i + 1]! <= 0xc2)) {
    i += 2 + ((octets[i + 2]! << 8) | octets[i + 3]!);
  }
  const hauteur = (octets[i + 5]! << 8) | octets[i + 6]!;
  const largeur = (octets[i + 7]! << 8) | octets[i + 8]!;
  expect({ largeur, hauteur }).toEqual({ largeur: 1200, hauteur: 630 });
});

type Noeud = Record<string, unknown> & { '@type': string; '@id'?: string };

/** Graphe JSON-LD d’une page publiée (un seul bloc par page). */
const grapheDe = async (fichier: string): Promise<Noeud[]> => {
  const blocs = (await chargerHtml(`${DOSSIER_PAGES}/${fichier}`)).querySelectorAll('script[type="application/ld+json"]');
  expect({ fichier, blocs: blocs.length }).toEqual({ fichier, blocs: 1 });
  const donnees = JSON.parse(blocs[0]!.text) as { '@context': string; '@graph': Noeud[] };
  expect(donnees['@context']).toBe('https://schema.org');
  return donnees['@graph'];
};

test('chaque page décrit l’école, le site et elle-même en JSON-LD, sur le bon domaine', async () => {
  const accueil = adresse('index.html');
  for (const fichier of pagesPubliees) {
    const graphe = await grapheDe(fichier);
    const types = graphe.map((noeud) => noeud['@type']);
    expect({ fichier, types: types.filter((type) => type !== 'Event') }).toEqual({ fichier, types: ['School', 'WebSite', 'WebPage'] });
    const [ecole, siteWeb, page] = graphe as [Noeud, Noeud, Noeud];
    expect(ecole['@id']).toBe(`${accueil}#ecole`);
    expect(ecole.url).toBe(accueil);
    expect(siteWeb.url).toBe(accueil);
    expect({ fichier, url: page.url, site: page.isPartOf, sujet: page.about }).toEqual({
      fichier,
      url: adresse(fichier),
      site: { '@id': `${accueil}#site` },
      sujet: { '@id': `${accueil}#ecole` },
    });
    expect((page.name as string).length).toBeGreaterThan(10);
    // Toute adresse absolue du graphe vise le domaine du site, et ses images existent.
    for (const url of JSON.stringify(graphe).match(/https:\/\/[^"]+/g) ?? []) {
      if (url.startsWith('https://schema.org/') || url.startsWith('https://www.instagram.com/')) continue;
      expect({ fichier, url: url.startsWith(accueil) }).toEqual({ fichier, url: true });
      if (/\.(?:jpe?g|png|webp|svg)$/.test(url)) expect(await Bun.file(`${DOSSIER_PAGES}${new URL(url).pathname}`).exists()).toBe(true);
    }
  }
});

test('l’école est décrite avec ses coordonnées, les âges accueillis, ses horaires et son association', async () => {
  const [ecole] = (await grapheDe('index.html')) as [Noeud];
  expect(ecole).toMatchObject({
    name: 'Les Petons dans l’Herbe',
    email: contact.email,
    address: { streetAddress: contact.address[0], postalCode: '44300', addressLocality: 'Nantes', addressCountry: 'FR' },
    audience: { suggestedMinAge: 3, suggestedMaxAge: 12 },
    openingHoursSpecification: { opens: '08:15', closes: '18:15' },
    parentOrganization: { '@type': 'NGO', name: 'Constellation Montessori' },
    sameAs: [contact.instagram.href],
  });
});

// L’accueil annonce les portes ouvertes dans son bandeau ; la page Actualités les décrit.
const pagesDesPortesOuvertes = ['index.html', 'actualites-petons.html'];

test('les portes ouvertes sont un événement de l’accueil et de la page Actualités, et d’elles seules', async () => {
  for (const fichier of pagesPubliees) {
    const evenements = (await grapheDe(fichier)).filter((noeud) => noeud['@type'] === 'Event');
    expect({ fichier, evenements: evenements.length }).toEqual({ fichier, evenements: pagesDesPortesOuvertes.includes(fichier) ? 1 : 0 });
  }
  const [surLAccueil, surActualites] = await Promise.all(
    pagesDesPortesOuvertes.map(async (fichier) => (await grapheDe(fichier)).find((noeud) => noeud['@type'] === 'Event')!),
  );
  // Un seul événement : le même @id et la même description sur les deux pages.
  expect(surLAccueil).toEqual(surActualites!);
  expect(surActualites!['@id']).toBe(new URL(openHouse.href, site).href);
  const evenement = surActualites!;
  expect(evenement).toMatchObject({
    startDate: openHouse.start,
    endDate: openHouse.end,
    url: new URL(openHouse.href, site).href,
    isAccessibleForFree: true,
    location: { address: { streetAddress: contact.address[0] } },
    organizer: { '@id': `${adresse('index.html')}#ecole` },
  });
  // L’ancre de l’événement existe sur la page.
  const page = await chargerHtml(`${DOSSIER_PAGES}/actualites-petons.html`);
  expect(page.querySelector(`#${openHouse.href.split('#')[1]}`)).not.toBeNull();
});

test('le domaine principal est www.ecolemontessorinantes.com (décision du 12 octobre 2026)', () => {
  expect(new URL(site).origin).toBe('https://www.ecolemontessorinantes.com');
});

const estNoindex = async (fichier: string): Promise<boolean> =>
  (await chargerHtml(`${DOSSIER_PAGES}/${fichier}`))
    .querySelectorAll('head meta[name="robots"]')
    .some((balise) => (balise.getAttribute('content') ?? '').includes('noindex'));

test('sitemap.xml liste toutes les pages publiées indexables, et elles seules', async () => {
  const xml = await Bun.file(`${DOSSIER_PAGES}/sitemap.xml`).text();
  const listees = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((trouve) => trouve[1]!);
  const noindex: string[] = [];
  for (const fichier of pagesPubliees) if (await estNoindex(fichier)) noindex.push(fichier);
  // La Search Console signale « Envoyée mais marquée noindex » pour une page du sitemap qui refuse l’indexation.
  expect(noindex).toContain('lettre-confirmee.html');
  expect(listees.sort()).toEqual(pagesPubliees.filter((fichier) => !noindex.includes(fichier)).map(adresse).sort());
});

test('robots.txt laisse tout indexer et annonce le sitemap', async () => {
  const robots = await Bun.file(`${DOSSIER_PAGES}/robots.txt`).text();
  expect(robots).toContain('User-agent: *');
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(robots).toContain(`Sitemap: ${new URL('/sitemap.xml', site).href}`);
});

test('llms.txt suit le format llmstxt.org et liste les mêmes pages que sitemap.xml', async () => {
  const llms = await Bun.file(`${DOSSIER_PAGES}/llms.txt`).text();
  const xml = await Bun.file(`${DOSSIER_PAGES}/sitemap.xml`).text();
  expect(llms).toMatch(/^# .+\n\n> .+\n/);
  const lignes = [...llms.matchAll(/^- \[[^\]]+\]\(([^)]+)\): \S.*$/gm)].map((trouve) => trouve[1]!);
  const sitemap = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((trouve) => trouve[1]!);
  expect(lignes.sort()).toEqual(sitemap.sort());
});

test('aucune adresse de prévisualisation Vercel ne reste dans le site publié', async () => {
  const fichiers = [...new Bun.Glob('**/*.{html,xml,txt}').scanSync(DOSSIER_PAGES)];
  const restes: string[] = [];
  for (const fichier of fichiers) if ((await Bun.file(`${DOSSIER_PAGES}/${fichier}`).text()).includes('.vercel.app')) restes.push(fichier);
  expect(restes).toEqual([]);
});
