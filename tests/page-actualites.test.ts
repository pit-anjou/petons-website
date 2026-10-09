// Invariants de la page Actualités construite (à lancer après « bun run build »).
import { expect, test } from 'bun:test';
import { Glob } from 'bun';
import { chargerHtml, DOSSIER_PAGES } from './outils/html';

const page = await chargerHtml(`${DOSSIER_PAGES}/actualites-petons.html`);

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
  for (const fichier of new Glob('*.html').scanSync(DOSSIER_PAGES)) {
    const autre = await chargerHtml(`${DOSSIER_PAGES}/${fichier}`);
    for (const lien of autre.querySelectorAll('a[href^="actualites-petons.html#"]')) {
      const ancre = lien.getAttribute('href')!.split('#')[1]!;
      if (!page.querySelector(`[id="${ancre}"]`)) manquantes.push(`${fichier} → #${ancre}`);
    }
  }
  expect(manquantes).toEqual([]);
});

test('les portes ouvertes écrites dans le code ouvrent leur fenêtre, en tête de l’agenda', () => {
  const carte = page.querySelector('#portes-ouvertes');
  expect(carte?.getAttribute('class')).toContain('open-house-card');
  expect(page.querySelectorAll('#open-house-dialog').length).toBe(1);
  expect(carte?.querySelector('[data-open="open-house-dialog"]')).not.toBeNull();
  expect(page.querySelector('.agenda-grid')?.querySelector('.agenda-card')?.id).toBe('portes-ouvertes');
});

test('la carte d’un rendez-vous reprend le bloc de date harmonisé de l’agenda', () => {
  const carte = page.querySelector('#un-carnaval-autour-de-la-sante');
  const meta = carte?.querySelector('.card-content > .stage-meta.agenda-meta');
  expect(meta?.querySelector('.stage-date .stage-season')?.text).toBe('À l’école');
  expect(meta?.querySelector('.stage-date time')?.getAttribute('datetime')).toBe('2027-02-17');
  expect(meta?.querySelector('.stage-date time')?.text).toBe('17Février');
  expect(meta?.querySelector('.stage-tags .stage-tag')?.text).toBe('Pour les enfants de l’école');
});
