// Couplages invisibles : ces valeurs doivent exister à deux endroits, sans quoi un choix de l’éditeur
// s’afficherait sans style ou sans composant, sans aucune erreur de build.
import { expect, test } from 'bun:test';
import { COULEURS_STAGE, FONDS, ILLUSTRATIONS, PRESENTATIONS_SECTION } from '../src/content/schemas';

test('chaque illustration du schéma a un composant, et inversement', async () => {
  const index = await Bun.file('src/components/illustrations/index.ts').text();
  const objet = /export const illustrations = \{([^}]*)\}/.exec(index);
  expect(objet).not.toBeNull();
  const declarees = [...objet![1]!.matchAll(/(\w+)\s*:\s*(\w+)/g)].map((trouve) => ({ cle: trouve[1]!, composant: trouve[2]! }));
  expect(declarees.map(({ cle }) => cle).sort()).toEqual([...ILLUSTRATIONS].sort());
  for (const { composant } of declarees) {
    const importe = new RegExp(`import ${composant} from '\\./(\\w+)\\.astro'`).exec(index);
    expect(importe).not.toBeNull();
    expect(await Bun.file(`src/components/illustrations/${importe![1]}.astro`).exists()).toBe(true);
  }
});

const css = await Bun.file('src/pages/actualites-petons.astro').text();
const aUneRegle = (classe: string): boolean => new RegExp(`\\.${classe}(?![\\w-])`).test(css);

test('chaque couleur de stage (hors vert, la couleur de base) a sa règle .stage-card--couleur', () => {
  const classes = COULEURS_STAGE.filter((couleur) => couleur !== 'vert').map((couleur) => `stage-card--${couleur}`);
  expect(classes).toEqual(['stage-card--menthe', 'stage-card--orange', 'stage-card--bleu']);
  expect(classes.filter((classe) => !aUneRegle(classe))).toEqual([]);
});

test('chaque fond de visuel a sa règle .article-visual--fond', () => {
  const classes = FONDS.map((fond) => `article-visual--${fond}`);
  expect(classes).toEqual(['article-visual--photo', 'article-visual--vert', 'article-visual--sable']);
  expect(classes.filter((classe) => !aUneRegle(classe))).toEqual([]);
});

test('chaque présentation de section a sa règle (« simple » n’en demande pas)', () => {
  const classes = { simple: undefined, separee: 'stage-programme', 'mise-en-avant': 'stage-finale' } as const;
  expect(Object.keys(classes).sort()).toEqual([...PRESENTATIONS_SECTION].sort());
  expect(['stage-programme', 'stage-finale'].filter((classe) => !aUneRegle(classe))).toEqual([]);
});

test('le contrôle de couplage CSS détecte une classe absente', () => {
  expect(aUneRegle('stage-card--fuchsia')).toBe(false);
});
