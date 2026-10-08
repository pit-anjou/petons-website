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

test('enLigne échappe le HTML brut au lieu de l’interpréter', () => {
  const html = enLigne('<img src=x onerror=alert(1)> et <b>gras</b>');
  expect(html).not.toContain('<img');
  expect(html).not.toContain('<b>');
  expect(html).toBe('&lt;img src=x onerror=alert(1)&gt; et &lt;b&gt;gras&lt;/b&gt;');
});

test('enBlocs échappe le HTML brut, y compris un bloc <script>', () => {
  const html = enBlocs('<script>x</script>\n\nTexte avec <iframe src="a"></iframe>');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('<iframe');
  expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
  expect(html).toContain('&lt;iframe src=&quot;a&quot;&gt;&lt;/iframe&gt;');
});

test('le Markdown courant reste inchangé par l’échappement du HTML brut', () => {
  expect(enLigne('Tom & Jerry **ok**')).toBe('Tom &amp; Jerry <strong>ok</strong>');
});
