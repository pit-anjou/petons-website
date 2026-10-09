// Référencement du site publié : canonical, sitemap.xml, robots.txt et JSON-LD dérivent tous de `site`
// (astro.config.mjs). Ce test lit dist/ : lancer « bun run check » ou « bun run build » avant.
import { expect, test } from 'bun:test';
import config from '../astro.config.mjs';
import { chargerHtml, DOSSIER_PAGES } from './outils/html';

const site = config.site;
if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
const adresse = (fichier: string): string => new URL(fichier === 'index.html' ? '/' : fichier, site).href;

const pagesPubliees = [...new Bun.Glob('*.html').scanSync(DOSSIER_PAGES)].sort();

test('le build publie une page par fichier de src/pages', () => {
  const sources = [...new Bun.Glob('*.astro').scanSync('src/pages')].map((fichier) => fichier.replace(/\.astro$/, '.html'));
  expect(pagesPubliees).toEqual(sources.sort());
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

test('le JSON-LD se lit et désigne la page et le site sur le bon domaine', async () => {
  let blocs = 0;
  for (const fichier of pagesPubliees) {
    for (const script of (await chargerHtml(`${DOSSIER_PAGES}/${fichier}`)).querySelectorAll('script[type="application/ld+json"]')) {
      const donnees = JSON.parse(script.text) as { url: string; isPartOf: { url: string } };
      expect({ fichier, url: donnees.url, site: donnees.isPartOf.url }).toEqual({ fichier, url: adresse(fichier), site: adresse('index.html') });
      blocs += 1;
    }
  }
  expect(blocs).toBe(3);
});

test('sitemap.xml liste toutes les pages publiées, et elles seules', async () => {
  const xml = await Bun.file(`${DOSSIER_PAGES}/sitemap.xml`).text();
  const listees = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((trouve) => trouve[1]!);
  expect(listees.sort()).toEqual(pagesPubliees.map(adresse).sort());
});

test('robots.txt laisse tout indexer et annonce le sitemap', async () => {
  const robots = await Bun.file(`${DOSSIER_PAGES}/robots.txt`).text();
  expect(robots).toContain('User-agent: *');
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(robots).toContain(`Sitemap: ${new URL('/sitemap.xml', site).href}`);
});

test('aucune adresse de prévisualisation Vercel ne reste dans le site publié', async () => {
  const fichiers = [...new Bun.Glob('**/*.{html,xml,txt}').scanSync(DOSSIER_PAGES)];
  const restes: string[] = [];
  for (const fichier of fichiers) if ((await Bun.file(`${DOSSIER_PAGES}/${fichier}`).text()).includes('.vercel.app')) restes.push(fichier);
  expect(restes).toEqual([]);
});
