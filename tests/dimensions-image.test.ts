import { expect, test } from 'bun:test';
import { dimensionsImage } from '../src/lib/dimensions-image';

test('lit les dimensions d’une image de public/', async () => {
  expect(await dimensionsImage('assets/img/actualites/stage-theatre-fevrier.png')).toEqual({ width: 1448, height: 1086 });
  expect(await dimensionsImage('assets/img/actualites/eco-ecole.svg')).toEqual({ width: 39, height: 49 });
});

test('échoue si l’image n’existe pas', async () => {
  await expect(dimensionsImage('assets/img/actualites/absente.png')).rejects.toThrow('ENOENT');
});
