// La fonction Vercel (/api/formulaire) doit se charger avec ses seuls fichiers, comme sur Vercel.
// Régression : l’adaptateur laissait `import "rolldown"` (outil de build, module natif) dans la fonction,
// qui plantait au chargement : « Cannot find native binding » et erreur 500. À lancer après « bun run build ».
import { expect, test } from 'bun:test';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FONCTION = '.vercel/output/functions/_render.func';

test('la fonction se charge hors du dépôt, sans les dépendances de build', async () => {
  // Copiée hors du dépôt : sinon Node trouverait les node_modules complets du projet en remontant.
  const dossier = mkdtempSync(join(tmpdir(), 'fonction-vercel-'));
  try {
    cpSync(FONCTION, dossier, { recursive: true });
    const entree = join(dossier, '.vercel/output/server/entry.mjs');
    const module = await import(entree);
    expect(typeof module.default).not.toBe('undefined');
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test('la fonction n’importe aucun outil de build', async () => {
  const entree = await Bun.file(`${FONCTION}/.vercel/output/server/entry.mjs`).text();
  expect(entree.match(/^import\s+["'](rolldown|@vercel\/routing-utils)["'];?$/gm) ?? []).toEqual([]);
});
