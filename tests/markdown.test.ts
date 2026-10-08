import { expect, test } from 'bun:test';
import { enBlocs, enLigne } from '../src/lib/markdown';

test('enLigne met en gras sans ajouter de paragraphe', () => {
  expect(enLigne('**Ouvert à tous** · enfants')).toBe('<strong>Ouvert à tous</strong> · enfants');
});

test('enLigne reconnaît les surlignages vert (==) et orange (++)', () => {
  expect(enLigne('veut ==penser par lui-même==. Et ++donne forme à ses idées++, ok')).toBe(
    'veut <strong class="soft-mark">penser par lui-même</strong>. Et <strong class="orange-mark">donne forme à ses idées</strong>, ok',
  );
});

test('enLigne laisse == et ++ isolés tels quels', () => {
  expect(enLigne('a == b et 3 ++ 4')).toBe('a == b et 3 ++ 4');
});

test('enLigne accepte du gras dans un surlignage', () => {
  expect(enLigne('==**gras** dedans==')).toBe('<strong class="soft-mark"><strong>gras</strong> dedans</strong>');
});

test('enBlocs produit des paragraphes', () => {
  expect(enBlocs('Un.\n\nDeux ==x==.')).toBe('<p>Un.</p>\n<p>Deux <strong class="soft-mark">x</strong>.</p>\n');
});
