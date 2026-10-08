// Test TEMPORAIRE de la migration vers Page CMS : compare la page construite
// à la photo prise avant la migration. Supprimé à la tâche 8, car ensuite le
// contenu change normalement via Page CMS.
import { expect, test } from 'bun:test';
import { chargerHtml } from './outils/html';

const avant = await chargerHtml('tests/fixtures/actualites-avant.html');

test('la photo d’origine contient 8 cartes et 9 fenêtres', () => {
  expect(avant.querySelectorAll('.news-card')).toHaveLength(8);
  expect(avant.querySelectorAll('dialog')).toHaveLength(9);
});
