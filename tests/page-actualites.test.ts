// Invariants de la page Actualités construite (à lancer après « bun run build »).
import { expect, test } from 'bun:test';
import { Glob } from 'bun';
import { chargerHtml } from './outils/html';

const page = await chargerHtml('dist/actualites-petons.html');

test('chaque bouton data-open ouvre une fenêtre qui existe', () => {
  const fenetres = new Set(page.querySelectorAll('dialog').map((fenetre) => fenetre.id));
  const orphelins = page.querySelectorAll('[data-open]').map((bouton) => bouton.getAttribute('data-open')).filter((cible) => !fenetres.has(cible ?? ''));
  expect(orphelins).toEqual([]);
});

test('chaque fenêtre a un bouton de fermeture et un titre', () => {
  for (const fenetre of page.querySelectorAll('dialog')) {
    expect(fenetre.querySelector('[data-close]')).not.toBeNull();
    expect(fenetre.querySelector(`[id="${fenetre.getAttribute('aria-labelledby')}"]`)).not.toBeNull();
  }
});

test('les identifiants sont uniques', () => {
  const ids = page.querySelectorAll('[id]').map((element) => element.id);
  expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
});

test('les ancres visées depuis les autres pages existent', async () => {
  const manquantes: string[] = [];
  for (const fichier of new Glob('*.html').scanSync('dist')) {
    const autre = await chargerHtml(`dist/${fichier}`);
    for (const lien of autre.querySelectorAll('a[href^="actualites-petons.html#"]')) {
      const ancre = lien.getAttribute('href')!.split('#')[1]!;
      if (!page.querySelector(`[id="${ancre}"]`)) manquantes.push(`${fichier} → #${ancre}`);
    }
  }
  expect(manquantes).toEqual([]);
});
