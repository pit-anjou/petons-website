// Test TEMPORAIRE de la migration vers Page CMS : compare la page construite
// à la photo prise avant la migration. Supprimé à la tâche 8, car ensuite le
// contenu change normalement via Page CMS.
import { describe, expect, test } from 'bun:test';
import type { HTMLElement } from 'node-html-parser';
import { chargerHtml, nomsImages, texteCompact } from './outils/html';

const avant = await chargerHtml('tests/fixtures/actualites-avant.html');
const apres = await chargerHtml('dist/actualites-petons.html');

const trouver = (racine: HTMLElement, selecteur: string): HTMLElement => {
  const element = racine.querySelector(selecteur);
  if (!element) throw new Error(`${selecteur} introuvable`);
  return element;
};

/** Carte (article) qui ouvre la fenêtre donnée. */
const carteDe = (racine: HTMLElement, dialogue: string): HTMLElement => {
  const carte = trouver(racine, `[aria-controls="${dialogue}"]`).closest('article');
  if (!carte) throw new Error(`Carte de ${dialogue} introuvable`);
  return carte;
};

/** Même texte (à des changements assumés près) et mêmes images, dans le même ordre. */
const comparer = (ancien: HTMLElement, nouveau: HTMLElement, changementsAssumes: ReadonlyArray<readonly [string, string]> = []) => {
  const compacter = (texte: string) => texte.replace(/\s+/g, '');
  const attendu = changementsAssumes.reduce((texte, [de, vers]) => texte.replace(compacter(de), compacter(vers)), texteCompact(ancien));
  expect(texteCompact(nouveau)).toBe(attendu);
  expect(nomsImages(nouveau)).toEqual(nomsImages(ancien));
};

/** Mêmes passages surlignés (soft-mark, orange-mark), dans le même ordre. */
const memesSurlignages = (ancien: HTMLElement, nouveau: HTMLElement) => {
  const surlignages = (racine: HTMLElement) => racine.querySelectorAll('.soft-mark, .orange-mark').map((e) => `${e.classNames}:${e.text}`);
  expect(surlignages(nouveau)).toEqual(surlignages(ancien));
};

test('la photo d’origine contient 8 cartes et 9 fenêtres', () => {
  expect(avant.querySelectorAll('.news-card')).toHaveLength(8);
  expect(avant.querySelectorAll('dialog')).toHaveLength(9);
});

describe('stages', () => {
  const ids = ['stage-fevrier-2027', 'stage-avril-2027', 'stage-juillet-2027', 'stage-ados-juillet-2027'];

  test('mêmes cartes, dans le même ordre', () => {
    expect(apres.querySelectorAll('.stage-card').map((carte) => carte.id)).toEqual(ids);
  });

  test('même intitulé de section', () => {
    comparer(trouver(avant, '.stage-section-label'), trouver(apres, '.stage-section-label'));
  });

  for (const id of ids) {
    test(`carte ${id}`, () => comparer(trouver(avant, `#${id}`), trouver(apres, `#${id}`)));
    test(`fenêtre ${id}`, () => {
      comparer(trouver(avant, `#${id}-dialog`), trouver(apres, `#${id}-dialog`));
      memesSurlignages(trouver(avant, `#${id}-dialog`), trouver(apres, `#${id}-dialog`));
    });
  }
});
