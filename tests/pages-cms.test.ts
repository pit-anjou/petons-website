// .pages.yml doit décrire exactement les champs des schémas : Page CMS efface à
// l’enregistrement les champs qu’il ne connaît pas, et le build refuse ceux qui manquent.
import { describe, expect, test } from 'bun:test';
import { articleSchema, programmeSchema, rendezVousSchema, stageSchema } from '../src/content/schemas';

interface ChampCms {
  name: string;
  type?: string;
  component?: string;
  required?: boolean;
  list?: unknown;
  fields?: ChampCms[];
  blockKey?: string;
  blocks?: Array<{ name: string; fields?: ChampCms[] }>;
  options?: { values?: Array<string | { value: string }> };
}

const config = Bun.YAML.parse(await Bun.file('.pages.yml').text()) as {
  media: { input: string; output: string };
  components: Record<string, Omit<ChampCms, 'name'>>;
  content: Array<{ name: string; path: string; format: string; fields: ChampCms[] }>;
};

// Lecture de la définition interne des schémas zod 4.
interface Schema {
  _zod: { def: { type: string; innerType?: Schema; shape?: Record<string, Schema>; element?: Schema; options?: Schema[]; values?: unknown[]; entries?: Record<string, string> } };
}

const deballer = (schema: Schema): Schema =>
  ['optional', 'default', 'nullable', 'prefault'].includes(schema._zod.def.type) ? deballer(schema._zod.def.innerType!) : schema;
const estRequis = (schema: Schema): boolean => !['optional', 'default'].includes(schema._zod.def.type);
const resoudre = (champ: ChampCms): ChampCms => (champ.component ? { ...config.components[champ.component], ...champ } : champ);
const valeurs = (champ: ChampCms): string[] => (champ.options?.values ?? []).map((v) => (typeof v === 'string' ? v : v.value)).sort();

const comparerChamps = (chemin: string, champs: ReadonlyArray<ChampCms>, schema: Schema): string[] => {
  const forme = deballer(schema)._zod.def.shape!;
  const erreurs: string[] = [];
  const noms = champs.map((champ) => champ.name);
  for (const cle of Object.keys(forme)) {
    if (!noms.includes(cle)) erreurs.push(`${chemin}.${cle} : absent de .pages.yml`);
  }
  for (const champ of champs.map(resoudre)) {
    const sousSchema = forme[champ.name];
    if (!sousSchema) {
      erreurs.push(`${chemin}.${champ.name} : absent de src/content/schemas.ts`);
      continue;
    }
    if (Boolean(champ.required) !== estRequis(sousSchema)) erreurs.push(`${chemin}.${champ.name} : « required » doit valoir ${estRequis(sousSchema)}`);
    const interne = deballer(sousSchema);
    const estListe = interne._zod.def.type === 'array';
    if (Boolean(champ.list) !== estListe) erreurs.push(`${chemin}.${champ.name} : « list » doit valoir ${estListe}`);
    const element = estListe ? deballer(interne._zod.def.element!) : interne;
    if (champ.type === 'select') {
      const attendues = Object.values(element._zod.def.entries ?? {}).sort();
      if (JSON.stringify(valeurs(champ)) !== JSON.stringify(attendues)) erreurs.push(`${chemin}.${champ.name} : valeurs ${valeurs(champ)} au lieu de ${attendues}`);
    }
    if (champ.type === 'object') erreurs.push(...comparerChamps(`${chemin}.${champ.name}`, champ.fields ?? [], element));
    if (champ.type === 'block') {
      const options = element._zod.def.options!;
      if ((champ.blocks ?? []).length !== options.length) erreurs.push(`${chemin}.${champ.name} : ${options.length} blocs attendus`);
      for (const bloc of champ.blocks ?? []) {
        const option = options.find((o) => deballer(o)._zod.def.shape!.type!._zod.def.values!.includes(bloc.name));
        if (!option) {
          erreurs.push(`${chemin}.${champ.name} : bloc « ${bloc.name} » absent du schéma`);
          continue;
        }
        const discriminant: ChampCms = { name: champ.blockKey ?? '_block', required: true };
        erreurs.push(...comparerChamps(`${chemin}.${champ.name}[${bloc.name}]`, [discriminant, ...(bloc.fields ?? [])], option));
      }
    }
  }
  return erreurs;
};

const collections = {
  programmes: { schema: programmeSchema, chemin: 'src/content/programmes', format: 'yaml-frontmatter' },
  stages: { schema: stageSchema, chemin: 'src/content/stages', format: 'yaml' },
  'rendez-vous': { schema: rendezVousSchema, chemin: 'src/content/rendez-vous', format: 'yaml-frontmatter' },
  articles: { schema: articleSchema, chemin: 'src/content/articles', format: 'yaml-frontmatter' },
} as const;

describe('.pages.yml', () => {
  test('déclare exactement les quatre collections', () => {
    expect(config.content.map((entree) => entree.name).sort()).toEqual(Object.keys(collections).sort());
  });

  for (const entree of config.content) {
    test(`${entree.name} : chemin, format et champs alignés sur src/content/schemas.ts`, () => {
      const attendu = collections[entree.name as keyof typeof collections];
      expect(entree.path).toBe(attendu.chemin);
      expect(entree.format).toBe(attendu.format);
      expect(comparerChamps(entree.name, entree.fields, attendu.schema as unknown as Schema)).toEqual([]);
    });
  }

  test('les images envoyées vont dans assets/img/actualites', () => {
    expect(config.media).toMatchObject({ input: 'public/assets/img/actualites', output: 'assets/img/actualites' });
  });
});
