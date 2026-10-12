import { expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';
import { DOSSIER_PAGES, chargerHtml } from './outils/html';
import { adapterBalise, adapterHtml, cheminVariante, estAdaptable, TAILLES_PAR_DEFAUT, variantes } from '../src/integrations/images-adaptees';

test('seules les images matricielles de assets/img sont déclinées', () => {
  expect(estAdaptable('assets/img/actualites/stage.png')).toBe(true);
  expect(estAdaptable('/assets/img/photo.JPG')).toBe(true);
  expect(estAdaptable('assets/img/photo.webp')).toBe(true);
  expect(estAdaptable('assets/img/logo.svg')).toBe(false);
  expect(estAdaptable('assets/img/anim/atlas.webp')).toBe(false);
  expect(estAdaptable('assets/img/partage/les-petons.jpg')).toBe(false);
  expect(estAdaptable('assets/img/_tailles/photo-480.webp')).toBe(false);
  expect(estAdaptable('https://exemple.fr/assets/img/photo.webp')).toBe(false);
});

test('les versions vont dans assets/img/_tailles, en WebP', () => {
  expect(cheminVariante('assets/img/actualites/stage.png', 480)).toBe('assets/img/_tailles/actualites/stage-480.webp');
  expect(cheminVariante('/assets/img/photo.jpeg', 800)).toBe('/assets/img/_tailles/photo-800.webp');
});

test('un WebP de 1254 px sert lui-même de plus grande version', () => {
  expect(variantes('assets/img/a.webp', 1254)).toEqual([
    { url: 'assets/img/_tailles/a-320.webp', largeur: 320 },
    { url: 'assets/img/_tailles/a-480.webp', largeur: 480 },
    { url: 'assets/img/_tailles/a-800.webp', largeur: 800 },
    { url: 'assets/img/_tailles/a-1200.webp', largeur: 1200 },
    { url: 'assets/img/a.webp', largeur: 1254 },
  ]);
});

test('un PNG n’est jamais proposé tel quel, et rien ne dépasse 1600 px', () => {
  expect(variantes('assets/img/a.png', 1448).at(-1)).toEqual({ url: 'assets/img/_tailles/a-1448.webp', largeur: 1448 });
  expect(variantes('assets/img/a.webp', 3000).at(-1)).toEqual({ url: 'assets/img/_tailles/a-1600.webp', largeur: 1600 });
});

const liste = variantes('assets/img/a.webp', 900);

test('adapterBalise ajoute srcset et sizes, et garde le src', () => {
  expect(adapterBalise('<img src="assets/img/a.webp" alt="" width="900" height="600">', liste)).toBe(
    `<img src="assets/img/a.webp" alt="" width="900" height="600" srcset="assets/img/_tailles/a-320.webp 320w, assets/img/_tailles/a-480.webp 480w, assets/img/_tailles/a-800.webp 800w, assets/img/a.webp 900w" sizes="${TAILLES_PAR_DEFAUT}">`,
  );
});

test('pas de sizes="auto" : il ferait compter l’image pour 300 × 150 px dans la mise en page', () => {
  expect(adapterBalise('<img src="assets/img/a.webp" width="900" height="600" loading="lazy">', liste)).toContain(`sizes="${TAILLES_PAR_DEFAUT}"`);
});

test('une image sans width et height est laissée telle quelle (sa taille dépendrait du srcset)', () => {
  const sansDimensions = '<img src="assets/img/a.webp" loading="lazy">';
  expect(adapterBalise(sansDimensions, liste)).toBe(sansDimensions);
});

test('le sizes et le srcset écrits dans la page sont respectés', () => {
  expect(adapterBalise('<img src="assets/img/a.webp" width="900" height="600" sizes="50vw">', liste)).not.toContain(TAILLES_PAR_DEFAUT);
  const dejaAdaptee = '<img src="assets/img/a.webp" width="900" height="600" srcset="assets/img/a.webp 900w">';
  expect(adapterBalise(dejaAdaptee, liste)).toBe(dejaAdaptee);
});

test('adapterHtml ne touche ni aux SVG ni aux <image> des illustrations animées', () => {
  const html = '<img src="assets/img/logo.svg"><svg><image href="assets/img/anim/atlas.webp"/></svg><img src="assets/img/a.webp" width="900" height="600" />';
  expect(adapterHtml(html, () => liste)).toBe(
    '<img src="assets/img/logo.svg"><svg><image href="assets/img/anim/atlas.webp"/></svg>'
      + '<img src="assets/img/a.webp" width="900" height="600" srcset="assets/img/_tailles/a-320.webp 320w, assets/img/_tailles/a-480.webp 480w, assets/img/_tailles/a-800.webp 800w, assets/img/a.webp 900w" sizes="(max-width: 700px) 100vw, 600px">',
  );
});

const pagesConstruites = async () => (await readdir(DOSSIER_PAGES)).filter((fichier) => fichier.endsWith('.html'));

test('chaque image PNG, JPEG ou WebP des pages a width et height (sinon elle n’est pas adaptée)', async () => {
  const sansDimensions: string[] = [];
  for (const page of await pagesConstruites()) {
    for (const image of (await chargerHtml(`${DOSSIER_PAGES}/${page}`)).querySelectorAll('img')) {
      const src = image.getAttribute('src') ?? '';
      if (estAdaptable(src) && !(image.hasAttribute('width') && image.hasAttribute('height'))) sansDimensions.push(`${page} : ${src}`);
    }
  }
  expect(sansDimensions).toEqual([]);
});

test('après le build, chaque grande image a un srcset dont les fichiers existent', async () => {
  const manquants: string[] = [];
  let adaptees = 0;
  for (const page of await pagesConstruites()) {
    for (const image of (await chargerHtml(`${DOSSIER_PAGES}/${page}`)).querySelectorAll('img[srcset]')) {
      adaptees++;
      for (const candidat of image.getAttribute('srcset')!.split(',')) {
        const url = candidat.trim().split(/\s+/)[0]!.replace(/^\//, '');
        if (!(await Bun.file(`${DOSSIER_PAGES}/${url}`).exists())) manquants.push(`${page} : ${url}`);
      }
    }
  }
  expect(manquants).toEqual([]);
  expect(adaptees).toBeGreaterThan(100);
});
