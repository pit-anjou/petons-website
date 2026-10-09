// Accessibilité du site publié : règles vérifiables sans navigateur, sur chaque page de dist/.
// Lancer « bun run check » ou « bun run build » avant.
import { expect, test } from 'bun:test';
import type { HTMLElement } from 'node-html-parser';
import { chargerHtml } from './outils/html';

const pages = await Promise.all(
  [...new Bun.Glob('*.html').scanSync('dist')].sort().map(async (fichier) => ({ fichier, html: await chargerHtml(`dist/${fichier}`) })),
);

/** Nom accessible simplifié : aria-labelledby, aria-label, puis texte et alt des images. */
const nomAccessible = (element: HTMLElement, page: HTMLElement): string => {
  const references = element.getAttribute('aria-labelledby');
  if (references) return references.split(/\s+/).map((id) => page.querySelector(`#${id}`)?.text ?? '').join(' ').trim();
  const etiquette = element.getAttribute('aria-label')?.trim();
  if (etiquette) return etiquette;
  const images = element.querySelectorAll('img').map((image) => image.getAttribute('alt') ?? '');
  return `${element.text} ${images.join(' ')}`.replace(/\s+/g, ' ').trim();
};

test('chaque page déclare le français, un seul h1, les repères et un lien d’évitement valide', () => {
  for (const { fichier, html } of pages) {
    const evitement = html.querySelector('a.skip')?.getAttribute('href') ?? '';
    expect({
      fichier,
      langue: html.querySelector('html')?.getAttribute('lang'),
      h1: html.querySelectorAll('h1').length,
      reperes: ['header', 'nav', 'main', 'footer'].filter((balise) => !html.querySelector(balise)),
      evitement: evitement.startsWith('#') && html.querySelector(evitement) !== null,
    }).toEqual({ fichier, langue: 'fr', h1: 1, reperes: [], evitement: true });
  }
});

test('les niveaux de titre ne sautent jamais un niveau', () => {
  for (const { fichier, html } of pages) {
    const niveaux = html.querySelectorAll('h1, h2, h3, h4, h5, h6').map((titre) => Number(titre.rawTagName.slice(1)));
    const sauts = niveaux.flatMap((niveau, i) => (i > 0 && niveau > niveaux[i - 1]! + 1 ? [`h${niveaux[i - 1]}→h${niveau}`] : []));
    expect({ fichier, sauts }).toEqual({ fichier, sauts: [] });
  }
});

test('chaque image a un attribut alt, et chaque illustration SVG est décrite ou masquée', () => {
  for (const { fichier, html } of pages) {
    const sansAlt = html.querySelectorAll('img').filter((image) => !image.hasAttribute('alt')).map((image) => image.getAttribute('src'));
    const svgMuets = html
      .querySelectorAll('svg')
      .filter((svg) => !svg.closest('[aria-hidden="true"], [role="img"]') && svg.getAttribute('role') !== 'img')
      .map((svg) => svg.getAttribute('class') ?? svg.parentNode?.rawTagName);
    const imagesSansNom = html
      .querySelectorAll('[role="img"]')
      .filter((element) => !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
      .map((element) => element.getAttribute('class'));
    expect({ fichier, sansAlt, svgMuets, imagesSansNom }).toEqual({ fichier, sansAlt: [], svgMuets: [], imagesSansNom: [] });
  }
});

test('chaque lien et chaque bouton a un nom accessible', () => {
  for (const { fichier, html } of pages) {
    const muets = html
      .querySelectorAll('a[href], button')
      .filter((element) => !element.closest('[aria-hidden="true"]') && nomAccessible(element, html) === '')
      .map((element) => element.toString().slice(0, 80));
    expect({ fichier, muets }).toEqual({ fichier, muets: [] });
  }
});

test('chaque champ de formulaire a une étiquette', () => {
  for (const { fichier, html } of pages) {
    const sansEtiquette = html
      .querySelectorAll('input, select, textarea')
      .filter((champ) => !['hidden', 'submit', 'button'].includes(champ.getAttribute('type') ?? ''))
      .filter((champ) => {
        const id = champ.getAttribute('id');
        return !(champ.getAttribute('aria-label') || champ.getAttribute('aria-labelledby') || champ.closest('label') ||
          (id && html.querySelector(`label[for="${id}"]`)));
      })
      .map((champ) => champ.getAttribute('id') ?? champ.getAttribute('name'));
    expect({ fichier, sansEtiquette }).toEqual({ fichier, sansEtiquette: [] });
  }
});

test('les références ARIA pointent vers des id existants, et aucun id n’est en double', () => {
  for (const { fichier, html } of pages) {
    const ids = html.querySelectorAll('[id]').map((element) => element.id);
    const doublons = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    const orphelines = html.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls]').flatMap((element) =>
      ['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap((attribut) =>
        (element.getAttribute(attribut) ?? '').split(/\s+/).filter((id) => id && !html.querySelector(`#${id}`)),
      ),
    );
    expect({ fichier, doublons, orphelines }).toEqual({ fichier, doublons: [], orphelines: [] });
  }
});

test('chaque lien qui ouvre un nouvel onglet le dit aux lecteurs d’écran', () => {
  for (const { fichier, html } of pages) {
    const silencieux = html
      .querySelectorAll('a[target="_blank"]')
      .filter((lien) => !/nouvel onglet/i.test(nomAccessible(lien, html)))
      .map((lien) => lien.getAttribute('href'));
    expect({ fichier, silencieux }).toEqual({ fichier, silencieux: [] });
  }
});

test('le texte réservé aux lecteurs d’écran est masqué à l’écran sur chaque page qui l’emploie', async () => {
  for (const { fichier, html } of pages) {
    const feuilles = await Promise.all(
      html
        .querySelectorAll('link[rel="stylesheet"]')
        .map((lien) => (lien.getAttribute('href') ?? '').split('?')[0]!)
        .map(async (href) => ((await Bun.file(`dist/${href}`).exists()) ? Bun.file(`dist/${href}`).text() : '')),
    );
    const css = html.querySelectorAll('style').map((style) => style.text).join('') + feuilles.join('');
    for (const classe of ['sr-only', 'visually-hidden']) {
      if (!html.querySelector(`.${classe}`)) continue;
      expect({ fichier, classe, definie: new RegExp(`\\.${classe}\\s*[{,]`).test(css) }).toEqual({ fichier, classe, definie: true });
    }
  }
});
