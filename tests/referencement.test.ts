// Référencement du site publié : canonical, sitemap.xml, robots.txt et JSON-LD dérivent tous de `site`
// (astro.config.mjs). Ce test lit dist/ : lancer « bun run check » ou « bun run build » avant.
import { expect, test } from 'bun:test';
import config from '../astro.config.mjs';
import { chargerHtml } from './outils/html';

const site = config.site;
if (!site) throw new Error('Déclarer `site` dans astro.config.mjs.');
const adresse = (fichier: string): string => new URL(fichier === 'index.html' ? '/' : fichier, site).href;

const pagesPubliees = [...new Bun.Glob('*.html').scanSync('dist')].sort();

test('le build publie une page par fichier de src/pages', () => {
  const sources = [...new Bun.Glob('*.astro').scanSync('src/pages')].map((fichier) => fichier.replace(/\.astro$/, '.html'));
  expect(pagesPubliees).toEqual(sources.sort());
});

test('chaque page a une seule balise canonical, vers son adresse sur le domaine du site', async () => {
  for (const fichier of pagesPubliees) {
    const html = await chargerHtml(`dist/${fichier}`);
    const canoniques = html.querySelectorAll('head link[rel="canonical"]').map((lien) => lien.getAttribute('href'));
    expect({ fichier, canoniques }).toEqual({ fichier, canoniques: [adresse(fichier)] });
  }
});

test('le JSON-LD se lit et désigne la page et le site sur le bon domaine', async () => {
  let blocs = 0;
  for (const fichier of pagesPubliees) {
    for (const script of (await chargerHtml(`dist/${fichier}`)).querySelectorAll('script[type="application/ld+json"]')) {
      const donnees = JSON.parse(script.text) as { url: string; isPartOf: { url: string } };
      expect({ fichier, url: donnees.url, site: donnees.isPartOf.url }).toEqual({ fichier, url: adresse(fichier), site: adresse('index.html') });
      blocs += 1;
    }
  }
  expect(blocs).toBe(3);
});

test('sitemap.xml liste toutes les pages publiées, et elles seules', async () => {
  const xml = await Bun.file('dist/sitemap.xml').text();
  const listees = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((trouve) => trouve[1]!);
  expect(listees.sort()).toEqual(pagesPubliees.map(adresse).sort());
});

test('robots.txt laisse tout indexer et annonce le sitemap', async () => {
  const robots = await Bun.file('dist/robots.txt').text();
  expect(robots).toContain('User-agent: *');
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(robots).toContain(`Sitemap: ${new URL('/sitemap.xml', site).href}`);
});

test('aucune adresse de prévisualisation Vercel ne reste dans le site publié', async () => {
  const fichiers = [...new Bun.Glob('**/*.{html,xml,txt}').scanSync('dist')];
  const restes: string[] = [];
  for (const fichier of fichiers) if ((await Bun.file(`dist/${fichier}`).text()).includes('.vercel.app')) restes.push(fichier);
  expect(restes).toEqual([]);
});
