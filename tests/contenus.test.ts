// Chaque fichier de contenu respecte son schéma, ses images existent et chaque stage cite un programme existant.
import { describe, expect, test } from 'bun:test';
import { Glob } from 'bun';
import { articleSchema, programmeSchema, rendezVousSchema, stageSchema } from '../src/content/schemas';

const lireDonnees = async (chemin: string): Promise<unknown> => {
  const texte = await Bun.file(chemin).text();
  if (!chemin.endsWith('.md')) return Bun.YAML.parse(texte);
  const entete = /^---\n([\s\S]*?)\n---/.exec(texte);
  if (!entete) throw new Error(`${chemin} : en-tête YAML manquant`);
  return Bun.YAML.parse(entete[1]!);
};

const imagesCitees = (valeur: unknown): string[] => {
  if (typeof valeur === 'string') return valeur.startsWith('assets/img/') ? [valeur] : [];
  if (Array.isArray(valeur)) return valeur.flatMap(imagesCitees);
  if (valeur && typeof valeur === 'object') return Object.values(valeur).flatMap(imagesCitees);
  return [];
};

const collections = [
  { dossier: 'src/content/programmes', motif: '*.md', schema: programmeSchema },
  { dossier: 'src/content/stages', motif: '*.yml', schema: stageSchema },
  { dossier: 'src/content/rendez-vous', motif: '*.md', schema: rendezVousSchema },
  { dossier: 'src/content/articles', motif: '*.md', schema: articleSchema },
] as const;

for (const { dossier, motif, schema } of collections) {
  describe(dossier, () => {
    const fichiers = [...new Glob(motif).scanSync(dossier)].sort();

    test('contient au moins une entrée', () => expect(fichiers.length).toBeGreaterThan(0));

    for (const fichier of fichiers) {
      test(`${fichier} respecte le schéma et ses images existent`, async () => {
        const donnees = await lireDonnees(`${dossier}/${fichier}`);
        expect(schema.safeParse(donnees).error?.issues ?? []).toEqual([]);
        for (const image of imagesCitees(donnees)) {
          expect(await Bun.file(`public/${image}`).exists()).toBe(true);
        }
      });
    }
  });
}

test('chaque stage cite un programme existant', async () => {
  for (const fichier of new Glob('*.yml').scanSync('src/content/stages')) {
    const { programme } = (await lireDonnees(`src/content/stages/${fichier}`)) as { programme: string };
    expect(await Bun.file(`src/content/programmes/${programme}`).exists()).toBe(true);
  }
});
