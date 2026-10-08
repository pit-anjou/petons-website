import { expect, test } from 'bun:test';
import { parse } from 'node-html-parser';
import { nomsImages, texteCompact } from './html';

test('texteCompact ignore tous les espaces et décode les entités', () => {
  const racine = parse('<p id="a">Histoires &amp;<br>\n  Objets <b>Inventés</b></p>');
  expect(texteCompact(racine.querySelector('#a'))).toBe('Histoires&ObjetsInventés');
});

test('texteCompact refuse un élément absent', () => {
  expect(() => texteCompact(null)).toThrow('introuvable');
});

test('nomsImages ne garde que le nom de fichier', () => {
  const racine = parse('<div><img src="assets/img/actualites/a.png"><img src="assets/img/b.webp"></div>');
  expect(nomsImages(racine)).toEqual(['a.png', 'b.webp']);
});
