# Page CMS pour les actualités — plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** permettre à l'équipe des Petons de créer, modifier et supprimer les programmes et sessions de stages de vacances, les prochains rendez-vous et les articles de « La vie de l'école » depuis Page CMS (app.pagescms.org), sans toucher au HTML. Chaque enregistrement est publié directement sur `main`.

**Architecture :** le contenu codé en dur dans `src/pages/actualites-petons.astro` passe dans quatre *content collections* Astro (`src/content/programmes/*.md`, `src/content/stages/*.yml`, `src/content/rendez-vous/*.md`, `src/content/articles/*.md`), validées par des schémas zod stricts. La page les affiche avec des composants qui reproduisent le HTML actuel. Un fichier `.pages.yml` décrit ces mêmes champs pour Page CMS. Page CMS écrit dans le dépôt GitHub, et Vercel reconstruit le site à chaque commit sur `main`. Si le build échoue, Vercel garde la version précédente en ligne.

**Stack technique :** Astro 7.3.6 (zod 4 via `astro/zod`, chargeur `glob` de `astro/loaders`), Bun 1.3 (`bun test`, `Bun.YAML`), `marked` (Markdown des blocs de texte), `node-html-parser` (tests), Page CMS 2.x hébergé (GitHub App), Vercel.

**Spec :** pas de document séparé. Les décisions de la section « Décisions » ci-dessous ont été validées une à une par Philippe le 8 octobre 2026, dans la conversation qui a produit ce plan.

## Décisions

- **Périmètre : la page Actualités seulement.** Sont éditables : les programmes et les sessions de stage, les rendez-vous de l'agenda et les articles de « La vie de l'école ». Ne changent pas : l'encart « Inscriptions ouvertes » (places 3/4), les tarifs, les coordonnées (`src/data/site.ts`) et le bloc « Vie de l'école » de la page d'accueil.
- **Publication directe sur `main`**, sans branche de relecture. La recette de Page CMS se fait avant la fusion, sur la branche de travail poussée sur GitHub (tâche 9).
- **Plusieurs programmes de stage, créés par les éditeurs dans Page CMS.** Un *programme* (collection `programmes`) décrit la carte (titre, accroche, âges, description) et la fenêtre « Programme & infos » : des sections composées de blocs (texte, intervenants, forces, étapes, illustration, invitation à la restitution), plus « En pratique » (horaires, sac, inscription). Une *session* (collection `stages`) choisit son programme dans une liste, et fixe ses dates, vacances, image, couleur, prix, places et note.
- **Une fiche de programme par public.** « Histoires & Objets Inventés » devient deux fiches, enfants (6–11 ans) et ados (12–16 ans). Un texte commun aux deux se corrige dans les deux fiches.
- **Mise en forme des textes courts :** `**gras**`, `==surligné vert==` (classe `soft-mark`) et `++surligné orange++` (classe `orange-mark`).
- **Les fenêtres des rendez-vous et des articles sont composées de blocs** (texte en Markdown, intertitre avec logo facultatif, photo avec légende). Ce découpage permet d'intercaler des photos légendées, ce qu'un champ de texte riche seul ne permet pas.
- **Les images éditables sont dans un dossier dédié, `public/assets/img/actualites/`.** Les éditeurs ne peuvent donc pas supprimer depuis Page CMS une image utilisée par une autre page. Les 15 images qui ne servent qu'aux stages y sont déplacées. Les 5 images partagées avec d'autres pages y sont copiées.
- **Brouillon :** une case permet de préparer une session, un rendez-vous ou un article sans le publier.
- **Hors périmètre :** le bloc « Vie de l'école » de la page d'accueil reste en dur. Il ne suit pas les modifications faites dans Page CMS.
- **Date du cross :** `2026-06-01`, une approximation acceptée. Elle ne sert qu'au classement.
- **Ancres stables :** `#stage-fevrier-2027` et `#eco-ecole-solidarites` sont liées depuis `index.astro`. Les noms de fichiers des contenus reprennent ces identifiants, et le renommage est désactivé dans Page CMS.
- **Changements visibles acceptés par Philippe** :
  1. Les rendez-vous sont triés par date : le Carnaval (17 février) passe avant les Portes ouvertes (20 mars).
  2. La date de la fenêtre du Carnaval affiche le jour : « Mercredi 17 février ».
  3. La fenêtre de l'article Éco-École passe de 690 à 760 px de large, comme celle du cross.
  4. Le bouton « Lire l'article » du cross affiche « → » comme celui de l'article Éco-École.
  5. La fenêtre orpheline `inscriptions-dialog` est supprimée : aucun bouton ne l'ouvrait.
  6. « (nouvel onglet) » n'apparaît plus à l'écran dans l'article Éco-École : la classe `visually-hidden` n'est pas définie sur cette page, et le plan utilise `sr-only`, qui l'est.
  7. Les `aria-label` sont harmonisés (boutons de fermeture, « du 22 au 26 février 2027 »).
  8. Les identifiants des fenêtres changent (`open-house-dialog` devient `portes-ouvertes-de-printemps-dialog`, etc.). Aucune autre page ne les cite (vérifié par grep).

## Contraintes globales

- Règles d'`AGENTS.md` : toujours `<style is:inline>` et `<script is:inline>`, pas d'accolade dans le texte HTML des `.astro`, liens internes en `nom-de-page.html`, images référencées en `assets/…` sans `/` initial, ne jamais modifier `dist/`.
- Tous les textes visibles et les libellés de Page CMS sont en français, avec l'apostrophe typographique `’`.
- Pas d'Effect TS : le dépôt n'en utilise pas. TypeScript simple, dans le style de `src/data/site.ts`.
- Les dates des contenus sont lues à minuit UTC : utiliser uniquement les accesseurs `getUTC*`.
- Les textes mis en forme passent par `enLigne` ou `enBlocs` (`src/lib/markdown.ts`), jamais par `marked` directement.
- Chaque champ d'un schéma de `src/content/schemas.ts` doit exister dans `.pages.yml`, et inversement : Page CMS efface à l'enregistrement les champs qu'il ne connaît pas (`settings.content.merge` vaut `false` par défaut).
- `bun run check` (build puis tests) doit passer avant chaque commit.
- Messages de commit en français, à l'impératif présent (« Ajoute… », « Passe… »), comme dans l'historique.

## Structure des fichiers

| Fichier | Rôle |
| --- | --- |
| `src/content/schemas.ts` | Schémas zod des 4 collections (importables par `bun test`). |
| `src/content.config.ts` | Déclare les collections Astro (chargeur `glob`). |
| `src/content/programmes/*.md` | Un programme de stage par fichier (en-tête YAML seul). |
| `src/content/stages/*.yml` | Une session de stage par fichier, qui cite son programme. |
| `src/content/rendez-vous/*.md` | Un rendez-vous par fichier (en-tête YAML seul). |
| `src/content/articles/*.md` | Un article par fichier (en-tête YAML seul). |
| `src/lib/dates.ts` | Formats de dates en français (fonctions pures). |
| `src/lib/actualites.ts` | Filtrage des brouillons, tri et association des sessions à leur programme (fonctions pures). |
| `src/lib/markdown.ts` | Markdown des textes saisis dans Page CMS, avec les deux surlignages. |
| `src/lib/dimensions-image.ts` | Lit largeur et hauteur d'une image de `public/` au build. |
| `src/components/actualites/*.astro` | Cartes et fenêtres des stages, rendez-vous et articles, et leurs briques (`ProgrammeSection`, `Visuel`, `Blocs`, `LiensAction`, `Icone`, `TitreLignes`). |
| `src/components/illustrations/Carnaval.astro`, `index.ts` | Illustration animée du carnaval et table des illustrations proposées dans Page CMS. |
| `.pages.yml` | Configuration de Page CMS. |
| `tests/outils/html.ts` | Lecture et comparaison de HTML pour les tests. |
| `tests/*.test.ts` | Tests unitaires, tests de contenu, invariants de la page, alignement avec `.pages.yml`. |
| `tests/migration-actualites.test.ts`, `tests/fixtures/actualites-avant.html` | Test **temporaire** qui compare la page migrée à la page d'origine (supprimé en tâche 8). |
| `docs/page-cms.md` | Guide pour les éditeurs et l'administrateur. |

---

### Tâche 1 : outillage de test et photo de la page d'origine

**Fichiers :**
- Modifier : `package.json`, `bun.lock`
- Créer : `tests/outils/html.ts`, `tests/outils/html.test.ts`, `tests/migration-actualites.test.ts`, `tests/fixtures/actualites-avant.html`
- Modifier (non suivi par git) : `.claude/launch.json`

**Interfaces :**
- Produit : `chargerHtml(chemin: string): Promise<HTMLElement>`, `texteCompact(element: HTMLElement | null): string`, `nomsImages(element: HTMLElement): string[]` (dans `tests/outils/html.ts`) ; scripts `bun run test` et `bun run check`.

- [ ] **Étape 1 : installer node-html-parser et ajouter les scripts**

```bash
bun add -d node-html-parser
```

Puis, dans `package.json`, remplacer le bloc `scripts` par :

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "bun test",
    "check": "astro build && bun test"
  },
```

- [ ] **Étape 2 : écrire le test des outils HTML**

Créer `tests/outils/html.test.ts` :

```ts
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
```

- [ ] **Étape 3 : vérifier que le test échoue**

Lancer : `bun test tests/outils`
Résultat attendu : ÉCHEC avec `Cannot find module './html'`.

- [ ] **Étape 4 : écrire les outils**

Créer `tests/outils/html.ts` :

```ts
// Outils de lecture du HTML produit par le build, pour les tests.
import { parse, type HTMLElement } from 'node-html-parser';

/** Charge un fichier HTML (build ou photo de référence). */
export const chargerHtml = async (chemin: string): Promise<HTMLElement> => {
  const fichier = Bun.file(chemin);
  if (!(await fichier.exists())) {
    throw new Error(`${chemin} introuvable : lancez d’abord « bun run build ».`);
  }
  return parse(await fichier.text());
};

/** Texte d’un élément sans aucun espace : compare le contenu, pas la mise en forme. */
export const texteCompact = (element: HTMLElement | null): string => {
  if (!element) throw new Error('Élément introuvable');
  return element.text.replace(/\s+/g, '');
};

/** Images d’un élément, réduites au nom de fichier (les dossiers peuvent changer). */
export const nomsImages = (element: HTMLElement): string[] =>
  element.querySelectorAll('img').map((image) => (image.getAttribute('src') ?? '').split('/').pop() ?? '');
```

- [ ] **Étape 5 : vérifier que le test passe**

Lancer : `bun test tests/outils`
Résultat attendu : `3 pass`, `0 fail`.

- [ ] **Étape 6 : prendre la photo de la page d'origine**

Sans avoir modifié aucun fichier de `src/` :

```bash
bun run build
mkdir -p tests/fixtures
cp dist/actualites-petons.html tests/fixtures/actualites-avant.html
```

Créer `tests/migration-actualites.test.ts` :

```ts
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
```

Lancer : `bun test`
Résultat attendu : `4 pass`, `0 fail`.

- [ ] **Étape 7 : préparer la comparaison visuelle avant/après**

Construire une copie du site d'origine à côté du worktree :

```bash
git worktree add --detach ../petons-avant HEAD
(cd ../petons-avant && bun install --frozen-lockfile && bun run build)
```

Ajouter deux configurations au tableau `configurations` de `.claude/launch.json`. Ce fichier est exclu de git par `.git/info/exclude` : ne pas le committer.

```json
    {
      "name": "actualites-apres",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["run", "dev"],
      "port": 4321
    },
    {
      "name": "actualites-avant",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "4322", "--directory", "../petons-avant/dist"],
      "port": 4322
    }
```

- [ ] **Étape 8 : committer**

```bash
git add package.json bun.lock tests/
git commit -m "Ajoute l’outillage de test et la photo de la page Actualités avant migration"
```

---

### Tâche 2 : formats de dates en français

**Fichiers :**
- Créer : `src/lib/dates.ts`, `tests/dates.test.ts`

**Interfaces :**
- Produit (dans `src/lib/dates.ts`) :
  - `dateIso(date: Date): string` : `2027-02-22`
  - `jourMois(date: Date): string` : `20 mars`, `1er janvier`
  - `jourSemaine(date: Date): string` : `samedi`
  - `majuscule(texte: string): string`
  - `deMois(date: Date): string` : `de février`, `d’avril`
  - `horaire(debut?: string, fin?: string, separateur = '–'): string`
  - `interface PlageStage { jours; mois; annee; courte; longue }` (toutes des `string`)
  - `plageStage(debut: Date, fin: Date): PlageStage`
  - `anneesStages(debuts: ReadonlyArray<Date>): string` : `2027` ou `2026–2027`

- [ ] **Étape 1 : écrire les tests**

Créer `tests/dates.test.ts` :

```ts
import { describe, expect, test } from 'bun:test';
import { anneesStages, dateIso, deMois, horaire, jourMois, jourSemaine, majuscule, plageStage } from '../src/lib/dates';

// Minuit UTC, comme les dates lues dans les fichiers de contenu.
const d = (iso: string) => new Date(iso);

describe('dates simples', () => {
  test('jourMois', () => {
    expect(jourMois(d('2027-03-20'))).toBe('20 mars');
    expect(jourMois(d('2027-01-01'))).toBe('1er janvier');
  });
  test('jourSemaine', () => expect(jourSemaine(d('2027-02-17'))).toBe('mercredi'));
  test('majuscule', () => expect(majuscule('samedi')).toBe('Samedi'));
  test('dateIso', () => expect(dateIso(d('2027-02-22'))).toBe('2027-02-22'));
  test('deMois élide devant une voyelle', () => {
    expect(deMois(d('2027-02-22'))).toBe('de février');
    expect(deMois(d('2027-04-26'))).toBe('d’avril');
    expect(deMois(d('2027-08-02'))).toBe('d’août');
    expect(deMois(d('2026-10-19'))).toBe('d’octobre');
  });
  test('horaire', () => {
    expect(horaire('10h00', '12h30')).toBe('10h00–12h30');
    expect(horaire('10h00', '12h30', ' – ')).toBe('10h00 – 12h30');
    expect(horaire('18h00', undefined)).toBe('18h00');
    expect(horaire(undefined, undefined)).toBe('');
  });
});

describe('plageStage', () => {
  test('dans un même mois', () => {
    expect(plageStage(d('2027-02-22'), d('2027-02-26'))).toEqual({
      jours: '22–26', mois: 'FÉVRIER', annee: '2027',
      courte: '22–26 février 2027', longue: 'du 22 au 26 février 2027',
    });
  });
  test('à cheval sur deux mois', () => {
    expect(plageStage(d('2027-06-28'), d('2027-07-02'))).toEqual({
      jours: '28–2', mois: 'JUIN–JUILLET', annee: '2027',
      courte: '28 juin–2 juillet 2027', longue: 'du 28 juin au 2 juillet 2027',
    });
  });
  test('à cheval sur deux années', () => {
    expect(plageStage(d('2026-12-28'), d('2027-01-01'))).toEqual({
      jours: '28–1', mois: 'DÉCEMBRE–JANVIER', annee: '2026–2027',
      courte: '28 décembre 2026–1er janvier 2027', longue: 'du 28 décembre 2026 au 1er janvier 2027',
    });
  });
  test('sur une seule journée', () => {
    expect(plageStage(d('2027-04-28'), d('2027-04-28'))).toEqual({
      jours: '28', mois: 'AVRIL', annee: '2027',
      courte: '28 avril 2027', longue: 'le 28 avril 2027',
    });
  });
  test('refuse une fin avant le début', () => {
    expect(() => plageStage(d('2027-02-26'), d('2027-02-22'))).toThrow('précède');
  });
});

describe('anneesStages', () => {
  test('une seule année', () => expect(anneesStages([d('2027-02-22'), d('2027-07-12')])).toBe('2027'));
  test('plusieurs années', () => expect(anneesStages([d('2027-02-22'), d('2026-10-19')])).toBe('2026–2027'));
  test('aucun stage', () => expect(anneesStages([])).toBe(''));
});
```

- [ ] **Étape 2 : vérifier que les tests échouent**

Lancer : `bun test tests/dates.test.ts`
Résultat attendu : ÉCHEC avec `Cannot find module '../src/lib/dates'`.

- [ ] **Étape 3 : écrire l'implémentation**

Créer `src/lib/dates.ts` :

```ts
// Formats de dates en français pour la page Actualités.
// Les dates des contenus sont lues à minuit UTC : on n’utilise que les accesseurs UTC.

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

const mois = (date: Date): string => MOIS[date.getUTCMonth()]!;
const numeroJour = (date: Date): string => (date.getUTCDate() === 1 ? '1er' : `${date.getUTCDate()}`);
const capitales = (texte: string): string => texte.toLocaleUpperCase('fr-FR');

/** « 2027-02-22 », pour l’attribut datetime. */
export const dateIso = (date: Date): string => date.toISOString().slice(0, 10);

/** « 20 mars », « 1er janvier » */
export const jourMois = (date: Date): string => `${numeroJour(date)} ${mois(date)}`;

/** « samedi » */
export const jourSemaine = (date: Date): string => JOURS[date.getUTCDay()]!;

export const majuscule = (texte: string): string => texte.charAt(0).toLocaleUpperCase('fr-FR') + texte.slice(1);

/** « de février », « d’avril » */
export const deMois = (date: Date): string => (/^[aeiou]/.test(mois(date)) ? `d’${mois(date)}` : `de ${mois(date)}`);

/** « 10h00–12h30 », « 10h00 » ou « » ; les fenêtres utilisent le séparateur « – » entouré d’espaces. */
export const horaire = (debut: string | undefined, fin: string | undefined, separateur = '–'): string => {
  if (!debut) return '';
  return fin ? `${debut}${separateur}${fin}` : debut;
};

export interface PlageStage {
  /** Gros chiffres de la carte : « 22–26 » */
  readonly jours: string;
  /** Sous les chiffres : « FÉVRIER » ou « JUIN–JUILLET » */
  readonly mois: string;
  /** « 2027 » ou « 2026–2027 » */
  readonly annee: string;
  /** Fenêtre : « 22–26 février 2027 » */
  readonly courte: string;
  /** Lecteurs d’écran : « du 22 au 26 février 2027 » */
  readonly longue: string;
}

export const plageStage = (debut: Date, fin: Date): PlageStage => {
  if (fin.getTime() < debut.getTime()) {
    throw new Error(`Stage : la fin (${dateIso(fin)}) précède le début (${dateIso(debut)}).`);
  }
  const anneeDebut = debut.getUTCFullYear();
  const anneeFin = fin.getUTCFullYear();
  const annee = anneeDebut === anneeFin ? `${anneeFin}` : `${anneeDebut}–${anneeFin}`;
  const memeMois = anneeDebut === anneeFin && debut.getUTCMonth() === fin.getUTCMonth();

  if (memeMois && debut.getUTCDate() === fin.getUTCDate()) {
    return { jours: `${fin.getUTCDate()}`, mois: capitales(mois(fin)), annee, courte: `${jourMois(fin)} ${anneeFin}`, longue: `le ${jourMois(fin)} ${anneeFin}` };
  }

  const jours = `${debut.getUTCDate()}–${fin.getUTCDate()}`;
  if (memeMois) {
    return {
      jours,
      mois: capitales(mois(fin)),
      annee,
      courte: `${numeroJour(debut)}–${numeroJour(fin)} ${mois(fin)} ${anneeFin}`,
      longue: `du ${numeroJour(debut)} au ${jourMois(fin)} ${anneeFin}`,
    };
  }

  const premierJour = anneeDebut === anneeFin ? jourMois(debut) : `${jourMois(debut)} ${anneeDebut}`;
  return {
    jours,
    mois: capitales(`${mois(debut)}–${mois(fin)}`),
    annee,
    courte: `${premierJour}–${jourMois(fin)} ${anneeFin}`,
    longue: `du ${premierJour} au ${jourMois(fin)} ${anneeFin}`,
  };
};

/** Années couvertes par les stages : « 2027 » ou « 2026–2027 ». */
export const anneesStages = (debuts: ReadonlyArray<Date>): string => {
  const annees = [...new Set(debuts.map((date) => date.getUTCFullYear()))].sort((a, b) => a - b);
  if (annees.length === 0) return '';
  const premiere = annees[0]!;
  const derniere = annees[annees.length - 1]!;
  return premiere === derniere ? `${premiere}` : `${premiere}–${derniere}`;
};
```

- [ ] **Étape 4 : vérifier que les tests passent**

Lancer : `bun test tests/dates.test.ts`
Résultat attendu : `0 fail`.

- [ ] **Étape 5 : committer**

```bash
git add src/lib/dates.ts tests/dates.test.ts
git commit -m "Ajoute les formats de dates en français des actualités"
```

---

### Tâche 3 : schémas, collections, médias et contenus migrés

**Fichiers :**
- Modifier : `package.json`, `bun.lock` (ajout de `marked`)
- Créer : `src/content/schemas.ts`, `src/content.config.ts`, `src/lib/actualites.ts`, `src/lib/dimensions-image.ts`, `src/lib/markdown.ts`
- Créer : `src/content/programmes/histoires-objets-inventes-enfants.md`, `histoires-objets-inventes-ados.md`
- Créer : `src/content/stages/stage-fevrier-2027.yml`, `stage-avril-2027.yml`, `stage-juillet-2027.yml`, `stage-ados-juillet-2027.yml`
- Créer : `src/content/rendez-vous/portes-ouvertes-de-printemps.md`, `un-carnaval-autour-de-la-sante.md`
- Créer : `src/content/articles/eco-ecole-solidarites.md`, `cross-des-petons.md`
- Créer : `public/assets/img/actualites/` (20 images copiées)
- Créer : `tests/markdown.test.ts`, `tests/actualites.test.ts`, `tests/dimensions-image.test.ts`, `tests/contenus.test.ts`

**Interfaces :**
- Produit (dans `src/content/schemas.ts`) : `programmeSchema`, `stageSchema`, `rendezVousSchema`, `articleSchema` ; les listes `VACANCES`, `COULEURS_STAGE`, `PRESENTATIONS_SECTION`, `FONDS`, `ILLUSTRATIONS`, `ICONES`, `STYLES_LIEN` ; les types `Programme`, `SectionProgramme`, `Stage`, `RendezVous`, `Article`, `Visuel`, `Bloc`, `Lien`.
- Produit (dans `src/lib/actualites.ts`) : `interface Entree<T> { id: string; data: T }`, `stagesAffiches(entrees)`, `rendezVousAffiches(entrees)`, `articlesAffiches(entrees)`, `avecProgramme(stages, programmes)`. Les trois premières filtrent les brouillons et trient (stages et rendez-vous du plus proche au plus lointain, articles du plus récent au plus ancien). `avecProgramme` ajoute à chaque stage la propriété `programme: Programme`, ou lève une erreur si le fichier cité n'existe pas.
- Produit (dans `src/lib/markdown.ts`) : `enLigne(texte: string): string` (Markdown d'une ligne, sans `<p>`) et `enBlocs(texte: string): string` (paragraphes). En plus de `**gras**`, ils reconnaissent `==texte==` (`<strong class="soft-mark">`) et `++texte++` (`<strong class="orange-mark">`).
- Produit (dans `src/lib/dimensions-image.ts`) : `dimensionsImage(src: string): Promise<{ width: number; height: number }>`, où `src` vaut par exemple `assets/img/actualites/x.png`.
- Produit : les collections Astro `programmes`, `stages`, `rendezVous`, `articles`. L'identifiant d'une entrée est son nom de fichier sans extension. Le champ `programme` d'un stage contient le nom de fichier complet du programme (`histoires-objets-inventes-enfants.md`) : c'est ce qu'enregistre le champ « référence » de Page CMS avec `value: "{name}"`.

- [ ] **Étape 1 : copier les images dans le dossier média de Page CMS**

```bash
mkdir -p public/assets/img/actualites
for f in stage-theatre-fevrier.png stage-theatre-avril-scene.png stage-theatre-juillet.png stage-ados-apercu-scene.png \
  philippe-leroy-stage.jpg manuella-cortes-thonon-stage.jpg \
  stage-trois-forces-fil-imagination.png stage-corps-voix-main-v2.png stage-histoires-restitution-v2.png \
  stage-ados-trois-forces-v3.png stage-ados-corps-voix-main-v3.png stage-ados-restitution-v3.png \
  stage-sac-repas.png stage-sac-tenue.png stage-sac-blouse.png \
  une-educatrice-accueille-une-mere-et-son-2.webp eco-ecole-vote-solidarites-2026-retouche.jpg \
  un-enfant-prepare-son-dossard-pour-le.webp le-diplome-remis-a-un-enfant-a-larrivee.webp eco-ecole.svg; do
  cp "public/assets/img/$f" public/assets/img/actualites/
done
ls public/assets/img/actualites | wc -l
```

Résultat attendu : `20`. Les 15 premières images ne servent qu'à la page Actualités : leurs originaux sont supprimés à la tâche 4, une fois la page passée aux nouvelles adresses. Les 5 dernières servent aussi sur d'autres pages : elles restent en double.

- [ ] **Étape 2 : ajouter marked et écrire le test du Markdown**

```bash
bun add marked
```

Créer `tests/markdown.test.ts` :

```ts
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
```

Lancer : `bun test tests/markdown.test.ts`
Résultat attendu : ÉCHEC avec `Cannot find module '../src/lib/markdown'`.

- [ ] **Étape 3 : écrire le Markdown**

Créer `src/lib/markdown.ts`. Ce code a été testé avec marked 18 :

```ts
// Markdown des textes saisis dans Page CMS : **gras**, ==surligné vert==, ++surligné orange++.
// Les surlignages reprennent les classes soft-mark et orange-mark de la page Actualités.
import { Marked, type TokenizerAndRendererExtension } from 'marked';

const surlignage = (nom: string, marque: string, classe: string): TokenizerAndRendererExtension => {
  const motif = new RegExp(`^${marque}(?=\\S)([\\s\\S]*?\\S)${marque}`);
  return {
    name: nom,
    level: 'inline',
    start: (source) => source.indexOf(marque.replace(/\\/g, '')),
    tokenizer(source) {
      const trouve = motif.exec(source);
      if (!trouve) return undefined;
      return { type: nom, raw: trouve[0], tokens: this.lexer.inlineTokens(trouve[1]!) };
    },
    renderer(jeton) {
      return `<strong class="${classe}">${this.parser.parseInline(jeton.tokens!)}</strong>`;
    },
  };
};

const markdown = new Marked({
  extensions: [surlignage('surlignageVert', '==', 'soft-mark'), surlignage('surlignageOrange', '\\+\\+', 'orange-mark')],
});

/** Texte d’une ligne (étiquette, présentation…), sans paragraphe autour. */
export const enLigne = (texte: string): string => markdown.parseInline(texte, { async: false }) as string;

/** Texte en paragraphes. */
export const enBlocs = (texte: string): string => markdown.parse(texte, { async: false }) as string;
```

Lancer : `bun test tests/markdown.test.ts`
Résultat attendu : `5 pass`, `0 fail`.

- [ ] **Étape 4 : écrire les tests du tri, des programmes et des dimensions**

Créer `tests/actualites.test.ts` :

```ts
import { expect, test } from 'bun:test';
import { articleSchema, rendezVousSchema, stageSchema, type Programme } from '../src/content/schemas';
import { articlesAffiches, avecProgramme, rendezVousAffiches, stagesAffiches } from '../src/lib/actualites';

const visuel = { image: 'assets/img/actualites/eco-ecole.svg', alt: 'Logo' };

const stage = (id: string, debut: string, brouillon = false, programme = 'p.md') => ({
  id,
  data: stageSchema.parse({ programme, debut, fin: debut, vacances: 'hiver', image: 'assets/img/actualites/eco-ecole.svg', prix: 1, prixFratrie: 1, effectif: 1, brouillon }),
});
const rendezVous = (id: string, date: string, brouillon = false) => ({
  id,
  data: rendezVousSchema.parse({ titre: id, date, mention: 'm', resume: 'r', visuel, surtitre: 's', brouillon }),
});
const article = (id: string, date: string, brouillon = false) => ({
  id,
  data: articleSchema.parse({ titre: id, date, repere: 'r', resume: 'r', visuel, surtitre: 's', intro: 'i', brouillon }),
});

test('les stages sont triés du plus proche au plus lointain, sans les brouillons', () => {
  const ids = stagesAffiches([stage('juillet', '2027-07-12'), stage('fevrier', '2027-02-22'), stage('cache', '2027-01-01', true)]).map((e) => e.id);
  expect(ids).toEqual(['fevrier', 'juillet']);
});

test('les rendez-vous sont triés par date croissante, sans les brouillons', () => {
  const ids = rendezVousAffiches([rendezVous('portes', '2027-03-20'), rendezVous('carnaval', '2027-02-17'), rendezVous('cache', '2027-01-01', true)]).map((e) => e.id);
  expect(ids).toEqual(['carnaval', 'portes']);
});

test('les articles sont triés du plus récent au plus ancien, sans les brouillons', () => {
  const ids = articlesAffiches([article('cross', '2026-06-01'), article('eco', '2026-09-25'), article('cache', '2026-12-01', true)]).map((e) => e.id);
  expect(ids).toEqual(['eco', 'cross']);
});

test('à date égale, l’ordre suit le nom de fichier', () => {
  const ids = stagesAffiches([stage('b', '2027-02-22'), stage('a', '2027-02-22')]).map((e) => e.id);
  expect(ids).toEqual(['a', 'b']);
});

test('avecProgramme associe chaque stage à son programme', () => {
  const programme = { nom: 'Enfants' } as Programme;
  const [associe] = avecProgramme([stage('s', '2027-02-22', false, 'enfants.md')], [{ id: 'enfants', data: programme }]);
  expect(associe!.programme).toBe(programme);
  expect(associe!.id).toBe('s');
});

test('avecProgramme refuse un programme introuvable', () => {
  expect(() => avecProgramme([stage('s', '2027-02-22', false, 'absent.md')], [])).toThrow('absent.md');
});
```

Créer `tests/dimensions-image.test.ts` :

```ts
import { expect, test } from 'bun:test';
import { dimensionsImage } from '../src/lib/dimensions-image';

test('lit les dimensions d’une image de public/', async () => {
  expect(await dimensionsImage('assets/img/actualites/stage-theatre-fevrier.png')).toEqual({ width: 1448, height: 1086 });
  expect(await dimensionsImage('assets/img/actualites/eco-ecole.svg')).toEqual({ width: 39, height: 49 });
});

test('échoue si l’image n’existe pas', async () => {
  await expect(dimensionsImage('assets/img/actualites/absente.png')).rejects.toThrow('ENOENT');
});
```

Lancer : `bun test tests/actualites.test.ts tests/dimensions-image.test.ts`
Résultat attendu : ÉCHEC avec `Cannot find module '../src/content/schemas'` et `Cannot find module '../src/lib/dimensions-image'`.

- [ ] **Étape 5 : écrire les schémas**

Créer `src/content/schemas.ts` :

```ts
// Schémas des actualités modifiables dans Page CMS.
// Chaque champ doit aussi être déclaré dans .pages.yml (vérifié par tests/pages-cms.test.ts) :
// Page CMS efface à l’enregistrement les champs qu’il ne connaît pas.
// Les textes « en ligne » acceptent **gras**, ==surligné vert== et ++surligné orange++ (src/lib/markdown.ts).
import { z } from 'astro/zod';

const texteRequis = z.string().trim().min(1);
const heure = z.string().regex(/^\d{1,2}h\d{2}$/, 'Heure attendue au format 10h00');
const image = z.string().regex(/^assets\/img\/actualites\/[^/]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i, 'Image attendue dans assets/img/actualites/');
const pourcentage = (parDefaut: number) => z.number().int().min(0).max(100).default(parDefaut);

export const VACANCES = ['toussaint', 'noel', 'hiver', 'printemps', 'ete'] as const;
export const COULEURS_STAGE = ['vert', 'menthe', 'orange', 'bleu'] as const;
export const PRESENTATIONS_SECTION = ['simple', 'separee', 'mise-en-avant'] as const;
export const FONDS = ['photo', 'vert', 'sable'] as const;
export const ILLUSTRATIONS = ['carnaval'] as const;
export const ICONES = ['livre', 'bulle', 'famille', 'pousse', 'crayon', 'coeur', 'vent', 'etoile', 'calendrier'] as const;
export const STYLES_LIEN = ['bouton', 'lien'] as const;

/** Élément d’une liste illustrée : une « force » ou une « étape » d’un programme. */
const elementIllustre = z.object({ icone: z.enum(ICONES), titre: texteRequis, texte: texteRequis }).strict();

const blocProgrammeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('texte'), contenu: texteRequis }).strict(),
  z.object({
    type: z.literal('intervenants'),
    personnes: z.array(z.object({ photo: image, alt: texteRequis, nom: texteRequis, presentation: texteRequis }).strict()).min(1),
  }).strict(),
  z.object({ type: z.literal('forces'), elements: z.array(elementIllustre).min(1) }).strict(),
  z.object({ type: z.literal('etapes'), elements: z.array(elementIllustre).min(1) }).strict(),
  z.object({ type: z.literal('illustration'), image, alt: texteRequis }).strict(),
  z.object({ type: z.literal('restitution'), titre: texteRequis, precision: z.string().optional() }).strict(),
]);

const sectionSchema = z.object({
  titre: texteRequis,
  icone: z.enum(ICONES),
  presentation: z.enum(PRESENTATIONS_SECTION).default('simple'),
  blocs: z.array(blocProgrammeSchema).min(1),
}).strict();

/** Contenu de la fenêtre « Programme & infos » d’un stage. Une fiche par public. */
export const programmeSchema = z.object({
  /** Nom de la fiche, visible seulement dans Page CMS. */
  nom: texteRequis,
  /** Une ligne par retour : <br> sur la carte, 2e ligne surlignée dans la fenêtre. */
  titre: texteRequis,
  accroche: texteRequis,
  discipline: texteRequis,
  ages: texteRequis,
  agesDeA: texteRequis,
  etiquette: texteRequis,
  description: texteRequis,
  public: texteRequis,
  participants: texteRequis,
  participantsCarte: z.string().optional(),
  encadrement: texteRequis,
  intro: texteRequis,
  horaires: texteRequis,
  accueil: texteRequis,
  jours: texteRequis,
  lieu: texteRequis,
  restitution: heure.optional(),
  sections: z.array(sectionSchema).min(1),
  sac: z.object({
    titre: texteRequis,
    sousTitre: z.string().optional(),
    objets: z.array(z.object({ image, texte: texteRequis }).strict()).min(1),
  }).strict().optional(),
  inscription: texteRequis,
}).strict().refine(
  (programme) => Boolean(programme.restitution) || !programme.sections.some((section) => section.blocs.some((bloc) => bloc.type === 'restitution')),
  { message: 'Un bloc « Restitution » demande l’heure de restitution', path: ['restitution'] },
);

/** Une session de stage : elle choisit son programme et fixe ses dates, son prix et son nombre de places. */
export const stageSchema = z.object({
  programme: z.string().regex(/^[a-z0-9-]+\.md$/, 'Choisir un programme'),
  debut: z.coerce.date(),
  fin: z.coerce.date(),
  vacances: z.enum(VACANCES),
  image,
  cadrage: pourcentage(5),
  couleur: z.enum(COULEURS_STAGE).default('vert'),
  prix: z.number().int().positive(),
  prixFratrie: z.number().int().positive(),
  effectif: z.number().int().positive(),
  note: z.string().optional(),
  brouillon: z.boolean().default(false),
}).strict().refine((stage) => stage.fin >= stage.debut, { message: 'La date de fin précède la date de début', path: ['fin'] });

const visuelSchema = z.object({
  image: image.optional(),
  illustration: z.enum(ILLUSTRATIONS).optional(),
  alt: texteRequis,
  fond: z.enum(FONDS).default('photo'),
  cadrage: pourcentage(50),
  etiquette: z.string().optional(),
}).strict().refine((visuel) => Boolean(visuel.image) !== Boolean(visuel.illustration), {
  message: 'Choisir une image ou une illustration animée, pas les deux',
});

const lienSchema = z.object({
  libelle: texteRequis,
  url: texteRequis,
  style: z.enum(STYLES_LIEN).default('lien'),
  nouvelOnglet: z.boolean().default(false),
}).strict();

const blocSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('texte'), contenu: texteRequis }).strict(),
  z.object({ type: z.literal('intertitre'), titre: texteRequis, logo: image.optional(), logoAlt: z.string().optional() }).strict(),
  z.object({ type: z.literal('photo'), image, alt: texteRequis, legende: z.string().optional() }).strict(),
]);

/** Champs communs aux rendez-vous et aux articles. */
const communs = {
  titre: texteRequis,
  /** Titre de la fenêtre ; chaque retour à la ligne devient <br>. */
  titreModale: z.string().optional(),
  date: z.coerce.date(),
  resume: texteRequis,
  visuel: visuelSchema,
  surtitre: texteRequis,
  blocs: z.array(blocSchema).default([]),
  liens: z.array(lienSchema).default([]),
  brouillon: z.boolean().default(false),
};

export const rendezVousSchema = z.object({
  ...communs,
  heureDebut: heure.optional(),
  heureFin: heure.optional(),
  mention: texteRequis,
  bouton: texteRequis.default('Voir les détails'),
  intro: z.string().optional(),
  pointsForts: z.array(elementIllustre).default([]),
  encadre: z.object({ titre: texteRequis, texte: z.string().optional() }).strict().optional(),
}).strict();

export const articleSchema = z.object({
  ...communs,
  rubrique: texteRequis.default('Retour sur un événement'),
  repere: texteRequis,
  intro: texteRequis,
}).strict();

export type Programme = z.infer<typeof programmeSchema>;
export type SectionProgramme = Programme['sections'][number];
export type Stage = z.infer<typeof stageSchema>;
export type RendezVous = z.infer<typeof rendezVousSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Visuel = RendezVous['visuel'];
export type Bloc = RendezVous['blocs'][number];
export type Lien = RendezVous['liens'][number];
```

- [ ] **Étape 6 : écrire le tri, l'association aux programmes et la lecture des dimensions**

Créer `src/lib/actualites.ts` :

```ts
// Filtrage des brouillons, tri et association aux programmes. Ces fonctions ne dépendent pas d’Astro, pour être testées par bun test.
import type { Article, Programme, RendezVous, Stage } from '../content/schemas';

export interface Entree<T> {
  readonly id: string;
  readonly data: T;
}

const publiees = <T extends { brouillon: boolean }, E extends Entree<T>>(entrees: ReadonlyArray<E>): E[] =>
  entrees.filter((entree) => !entree.data.brouillon);

const parDate = <T, E extends Entree<T>>(date: (data: T) => Date, sens: 1 | -1) => (a: E, b: E): number =>
  sens * (date(a.data).getTime() - date(b.data).getTime()) || a.id.localeCompare(b.id);

/** Stages publiés, du plus proche au plus lointain. */
export const stagesAffiches = <E extends Entree<Stage>>(entrees: ReadonlyArray<E>): E[] =>
  publiees<Stage, E>(entrees).sort(parDate<Stage, E>((stage) => stage.debut, 1));

/** Rendez-vous publiés, du plus proche au plus lointain. */
export const rendezVousAffiches = <E extends Entree<RendezVous>>(entrees: ReadonlyArray<E>): E[] =>
  publiees<RendezVous, E>(entrees).sort(parDate<RendezVous, E>((rendezVous) => rendezVous.date, 1));

/** Articles publiés, du plus récent au plus ancien. */
export const articlesAffiches = <E extends Entree<Article>>(entrees: ReadonlyArray<E>): E[] =>
  publiees<Article, E>(entrees).sort(parDate<Article, E>((article) => article.date, -1));

/** Ajoute à chaque stage le programme qu’il cite ; un programme introuvable fait échouer le build. */
export const avecProgramme = <E extends Entree<Stage>>(
  stages: ReadonlyArray<E>,
  programmes: ReadonlyArray<Entree<Programme>>,
): Array<E & { readonly programme: Programme }> =>
  stages.map((stage) => {
    const trouve = programmes.find((programme) => `${programme.id}.md` === stage.data.programme);
    if (!trouve) {
      throw new Error(`Stage « ${stage.id} » : programme « ${stage.data.programme} » introuvable dans src/content/programmes/.`);
    }
    return { ...stage, programme: trouve.data };
  });
```

Créer `src/lib/dimensions-image.ts` :

```ts
// Largeur et hauteur d’une image de public/, lues au build pour les attributs width et height.
// Une image absente fait échouer le build : Vercel garde alors la version en ligne.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';

export const dimensionsImage = async (src: string): Promise<{ width: number; height: number }> => {
  const donnees = await readFile(join(process.cwd(), 'public', src));
  const { width, height } = await imageMetadata(donnees, src);
  return { width, height };
};
```

`process.cwd()` est volontaire : au build, `import.meta.url` désigne le dossier des fichiers compilés, pas `src/`.

- [ ] **Étape 7 : vérifier que les tests passent**

Lancer : `bun test tests/markdown.test.ts tests/actualites.test.ts tests/dimensions-image.test.ts`
Résultat attendu : `13 pass`, `0 fail`.

- [ ] **Étape 8 : déclarer les collections**

Créer `src/content.config.ts` :

```ts
// Collections de la page Actualités, modifiables dans Page CMS (voir .pages.yml et docs/page-cms.md).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { articleSchema, programmeSchema, rendezVousSchema, stageSchema } from './content/schemas';

export const collections = {
  programmes: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/programmes' }), schema: programmeSchema }),
  stages: defineCollection({ loader: glob({ pattern: '*.yml', base: './src/content/stages' }), schema: stageSchema }),
  rendezVous: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/rendez-vous' }), schema: rendezVousSchema }),
  articles: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/articles' }), schema: articleSchema }),
};
```

- [ ] **Étape 9 : écrire le test des contenus**

Créer `tests/contenus.test.ts` :

```ts
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
```

Lancer : `bun test tests/contenus.test.ts`
Résultat attendu : ÉCHEC, car les dossiers de contenu n'existent pas encore (erreur `ENOENT` à la lecture des dossiers, ou échec de « contient au moins une entrée »).

- [ ] **Étape 10 : écrire les 2 programmes**

En YAML, toute valeur qui commence par `*` ou qui contient « : » (deux-points suivi d'une espace) doit être entre guillemets. Les textes reprennent mot pour mot la page d'origine. En cas de doute sur un caractère (`’`, `«`, `…`, `–`), recopier depuis `tests/fixtures/actualites-avant.html`.

Créer `src/content/programmes/histoires-objets-inventes-enfants.md` :

```markdown
---
nom: Histoires & Objets Inventés — enfants de 6 à 11 ans
titre: |-
  Histoires &
  Objets Inventés
accroche: IMAGINER · CRÉER · PARTAGER
discipline: Stage théâtre & arts plastiques
ages: 6–11 ans
agesDeA: 6 à 11 ans
etiquette: "**Ouvert à tous** · enfants des Petons et d’ailleurs"
description: "Le corps qui bouge, la voix qui ose, la main qui façonne : **cinq jours pour inventer un personnage, rêver une histoire et fabriquer l’objet qui la porte.**"
public: "**Ouvert à tous les enfants de 6 à 11 ans,** des Petons ou d’ailleurs."
participants: enfants
encadrement: deux intervenants
intro: "**Il était une fois un souffle, un geste, une couleur, un mot… et un objet qui n’existait pas encore.** Pendant cinq jours, les enfants partent à la rencontre de ce qui vit en eux. Le corps qui bouge et qui ressent, la voix qui ose, la main qui trace et qui façonne : ==tout devient matière à inventer==. Chacun, avec sa sensibilité, fait naître un personnage, rêve une histoire, fabrique l’objet qui la porte, et découvre qu’il a sa place dans un récit plus grand que lui."
horaires: 10h–17h
accueil: 9h
jours: Du lundi au vendredi
lieu: Nantes
restitution: 16h30
sections:
  - titre: Qui accompagne les enfants ?
    icone: famille
    blocs:
      - type: intervenants
        personnes:
          - photo: assets/img/actualites/philippe-leroy-stage.jpg
            alt: Philippe Leroy, intervenant du stage Histoires & Objets Inventés
            nom: Philippe Leroy
            presentation: "**Comédien et clown.** Intervenant en prise de parole adulte, **éducateur Montessori 6–12 ans (AMI)**. Il crée actuellement des visites sensibles au Musée Fabre de Montpellier et au MRAC de Sérignan et anime des ateliers théâtre et philo."
          - photo: assets/img/actualites/manuella-cortes-thonon-stage.jpg
            alt: Manuella Cortès-Thonon, intervenante du stage Histoires & Objets Inventés
            nom: Manuella Cortès-Thonon
            presentation: Artiste peintre et chorégraphique, danseuse, **plasticienne** et **praticienne Qi Gong**. Elle accompagne dans différents cadres, sociaux et éducatifs, des enfants et jeunes en arts plastiques et pratiques corporelles.
  - titre: Trois forces à éveiller
    icone: pousse
    presentation: separee
    blocs:
      - type: texte
        contenu: "Vers six ans, l’enfant entre dans un nouvel âge. Plus robuste, plus stable, débordant d’énergie, il ne se contente plus de découvrir le monde : il veut le comprendre, s’y mesurer et y trouver sa place. Le stage accueille ces besoins profonds et invite chacun à entrer en connexion avec ses potentiels, à travers trois forces qui grandissent ensemble."
      - type: forces
        elements:
          - icone: livre
            titre: Un esprit pour penser et imaginer
            texte: "C’est l’âge des « pourquoi » et des « comment ». L’esprit raisonneur s’éveille : il cherche les causes, les liens entre les choses, veut ==penser par lui-même==. Son imagination, immense, l’emmène bien au-delà de ce qu’il voit et touche. Il a besoin de grands récits, de questions ouvertes et d’espace pour inventer : si nous semons des graines, son imagination les fait germer."
          - icone: crayon
            titre: Une main pour construire et fabriquer
            texte: "C’est par la main que l’intelligence prend corps. En transformant la matière, l’enfant ++donne forme à ses idées++, éprouve ses hypothèses, se trompe et recommence. Il aime les vrais défis, les grands chantiers, l’effort qui a du sens. Le corps tout entier s’y engage : le mouvement prépare le geste, le geste guide le trait, et le trait devient objet."
          - icone: coeur
            titre: Un cœur pour aimer et partager
            texte: "C’est aussi l’âge du groupe et de la conscience morale. L’enfant recherche ses pairs, a besoin d’appartenir, de coopérer, de s’accorder sur des règles communes ; il s’interroge sur le juste et l’injuste avec une exigence nouvelle. Dans le jeu et la création collective, il apprend à écouter, ==à accueillir la différence==, à prendre sa part et à faire place à l’autre."
      - type: illustration
        image: assets/img/actualites/stage-trois-forces-fil-imagination.png
        alt: Des enfants imaginent une histoire, fabriquent un oiseau et dansent ensemble.
  - titre: Le corps, la voix, la main
    icone: crayon
    blocs:
      - type: etapes
        elements:
          - icone: vent
            titre: On commence par se poser.
            texte: "Respirer, écouter, sentir : quelques gestes simples inspirés du Qi Gong ouvrent la journée et rassemblent le groupe. Les sens s’éveillent et deviennent autant de portes vers l’imaginaire. Puis le mouvement s’invite, avec ses rythmes, ses silences et ses élans, et le corps devient un premier langage."
          - icone: bulle
            titre: Peu à peu, le jeu prend sa place.
            texte: "Improvisation, jeux de regard, un soupçon de clown : chacun apprivoise sa voix, ose la parole devant les autres et laisse apparaître un personnage qui lui ressemble… ou pas du tout."
          - icone: crayon
            titre: Et la main prend le relais.
            texte: "Le trait suit le geste, la couleur suit l’émotion. Avec des matériaux glanés, assemblés, transformés, naît l’objet qui portera l’histoire : un accessoire, un talisman, un trésor, une clé."
          - icone: pousse
            titre: Un cadre qui libère.
            texte: "Un espace préparé avec soin, des matériaux choisis, quelques règles partagées : dans ce cadre, l’enfant est libre de chercher, d’essayer, de se tromper et de recommencer, à son rythme. Les adultes observent, proposent, accompagnent, et laissent à chacun le temps de trouver son propre chemin."
      - type: illustration
        image: assets/img/actualites/stage-corps-voix-main-v2.png
        alt: Des enfants respirent calmement, jouent une scène et peignent un objet fabriqué pour leur histoire.
  - titre: Une histoire où chacun trouve sa place
    icone: etoile
    presentation: mise-en-avant
    blocs:
      - type: restitution
        titre: Un moment à partager en famille
        precision: Les familles sont invitées à nous rejoindre.
      - type: illustration
        image: assets/img/actualites/stage-histoires-restitution-v2.png
        alt: Des enfants présentent leurs histoires et leurs objets fabriqués devant les familles, dans un décor de théâtre en carton.
      - type: texte
        contenu: "Suite de récits singuliers ou grande histoire tissée de toutes les singularités : la forme naît du groupe, au fil de la semaine. Ce qui compte, c’est que ++chaque enfant, chaque personnage et chaque objet y trouve sa place++. Comme dans le grand récit du vivant, où chaque être a son rôle et contribue à l’ensemble, chacun apporte ici sa part, unique et nécessaire."
sac:
  titre: Dans le sac…
  sousTitre: car la création, ça creuse !
  objets:
    - image: assets/img/actualites/stage-sac-repas.png
      texte: Une **gourde**, un repas pour le midi et un goûter.
    - image: assets/img/actualites/stage-sac-tenue.png
      texte: Une **tenue souple** pour bouger et jouer.
    - image: assets/img/actualites/stage-sac-blouse.png
      texte: Une **grande chemise** en guise de blouse pour les arts plastiques.
inscription: Un **acompte de 100 €** valide l’inscription, par Wero ou virement bancaire. Contactez l’école pour connaître les modalités.
---
```

Créer `src/content/programmes/histoires-objets-inventes-ados.md`. C'est la même fiche, sauf aux endroits où la page d'origine diffère pour les adolescents :

```markdown
---
nom: Histoires & Objets Inventés — adolescents de 12 à 16 ans
titre: |-
  Histoires &
  Objets Inventés
accroche: IMAGINER · CRÉER · PARTAGER
discipline: Stage théâtre & arts plastiques
ages: 12–16 ans
agesDeA: 12 à 16 ans
etiquette: "**Ouvert à tous** · ados des Petons et d’ailleurs"
description: "Le corps qui bouge, la voix qui ose, la main qui façonne : **cinq jours pour inventer un personnage, rêver une histoire et fabriquer l’objet qui la porte.**"
public: "**Ouvert à tous les adolescents de 12 à 16 ans,** des Petons ou d’ailleurs."
participants: adolescents
participantsCarte: ados
encadrement: deux intervenants
intro: "**Il était une fois un souffle, un geste, une couleur, un mot… et un objet qui n’existait pas encore.** Pendant cinq jours, les adolescents partent à la rencontre de ce qui vit en eux. Le corps qui bouge et qui ressent, la voix qui ose, la main qui trace et qui façonne : ==tout devient matière à inventer==. Chacun, avec sa sensibilité, fait naître un personnage, rêve une histoire, fabrique l’objet qui la porte, et découvre qu’il a sa place dans un récit plus grand que lui."
horaires: 10h–17h
accueil: 9h
jours: Du lundi au vendredi
lieu: Nantes
restitution: 16h30
sections:
  - titre: Qui accompagne les adolescents ?
    icone: famille
    blocs:
      - type: intervenants
        personnes:
          - photo: assets/img/actualites/philippe-leroy-stage.jpg
            alt: Philippe Leroy, intervenant du stage Histoires & Objets Inventés
            nom: Philippe Leroy
            presentation: "**Comédien et clown.** Intervenant en prise de parole adulte, **éducateur Montessori 6–12 ans (AMI)**. Il crée actuellement des visites sensibles au Musée Fabre de Montpellier et au MRAC de Sérignan et anime des ateliers théâtre et philo."
          - photo: assets/img/actualites/manuella-cortes-thonon-stage.jpg
            alt: Manuella Cortès-Thonon, intervenante du stage Histoires & Objets Inventés
            nom: Manuella Cortès-Thonon
            presentation: Artiste peintre et chorégraphique, danseuse, **plasticienne** et **praticienne Qi Gong**. Elle accompagne dans différents cadres, sociaux et éducatifs, des enfants et jeunes en arts plastiques et pratiques corporelles.
  - titre: Trois forces à éveiller
    icone: pousse
    presentation: separee
    blocs:
      - type: texte
        contenu: "À l’adolescence, chacun cherche à mieux comprendre le monde, à s’y mesurer et à y trouver sa place. Exprimer ses idées, expérimenter et créer avec les autres ouvrent de nouveaux possibles. Le stage accueille ces besoins profonds et invite chacun à entrer en connexion avec ses potentiels, à travers trois forces qui grandissent ensemble."
      - type: forces
        elements:
          - icone: livre
            titre: Un esprit pour penser et imaginer
            texte: "Les « pourquoi » et les « comment » ouvrent de nouvelles pistes. L’esprit critique s’affirme : il cherche les causes, les liens entre les choses, veut ==penser par lui-même==. Son imagination, immense, l’emmène bien au-delà de ce qu’il voit et touche. Il a besoin de grands récits, de questions ouvertes et d’espace pour inventer : si nous semons des graines, son imagination les fait germer."
          - icone: crayon
            titre: Une main pour construire et fabriquer
            texte: "C’est par la main que l’intelligence prend corps. En transformant la matière, l’adolescent ++donne forme à ses idées++, éprouve ses hypothèses, se trompe et recommence. Il aime les vrais défis, les grands chantiers, l’effort qui a du sens. Le corps tout entier s’y engage : le mouvement prépare le geste, le geste guide le trait, et le trait devient objet."
          - icone: coeur
            titre: Un cœur pour aimer et partager
            texte: "Le groupe et le besoin d’appartenance occupent une place importante. L’adolescent recherche ses pairs, a besoin d’appartenir, de coopérer, de s’accorder sur des règles communes ; il s’interroge sur le juste et l’injuste avec une exigence nouvelle. Dans le jeu et la création collective, il apprend à écouter, ==à accueillir la différence==, à prendre sa part et à faire place à l’autre."
      - type: illustration
        image: assets/img/actualites/stage-ados-trois-forces-v3.png
        alt: Des adolescents échangent leurs idées, dessinent et fabriquent ensemble un masque et des éléments de décor.
  - titre: Le corps, la voix, la main
    icone: crayon
    blocs:
      - type: etapes
        elements:
          - icone: vent
            titre: On commence par se poser.
            texte: "Respirer, écouter, sentir : quelques gestes simples inspirés du Qi Gong ouvrent la journée et rassemblent le groupe. Les sens s’éveillent et deviennent autant de portes vers l’imaginaire. Puis le mouvement s’invite, avec ses rythmes, ses silences et ses élans, et le corps devient un premier langage."
          - icone: bulle
            titre: Peu à peu, le jeu prend sa place.
            texte: "Improvisation, jeux de regard, un soupçon de clown : chacun apprivoise sa voix, ose la parole devant les autres et laisse apparaître un personnage qui lui ressemble… ou pas du tout."
          - icone: crayon
            titre: Et la main prend le relais.
            texte: "Le trait suit le geste, la couleur suit l’émotion. Avec des matériaux glanés, assemblés, transformés, naît l’objet qui portera l’histoire : un accessoire, un talisman, un trésor, une clé."
          - icone: pousse
            titre: Un cadre qui libère.
            texte: "Un espace préparé avec soin, des matériaux choisis, quelques règles partagées : dans ce cadre, l’adolescent est libre de chercher, d’essayer, de se tromper et de recommencer, à son rythme. Les adultes observent, proposent, accompagnent, et laissent à chacun le temps de trouver son propre chemin."
      - type: illustration
        image: assets/img/actualites/stage-ados-corps-voix-main-v3.png
        alt: Des adolescents improvisent, jouent avec leurs gestes et peignent un décor de théâtre.
  - titre: Une histoire où chacun trouve sa place
    icone: etoile
    presentation: mise-en-avant
    blocs:
      - type: restitution
        titre: Un moment à partager en famille
        precision: Les familles sont invitées à nous rejoindre.
      - type: illustration
        image: assets/img/actualites/stage-ados-restitution-v3.png
        alt: Des adolescents présentent leurs histoires et leurs objets fabriqués devant les familles, dans un décor de théâtre en carton.
      - type: texte
        contenu: "Suite de récits singuliers ou grande histoire tissée de toutes les singularités : la forme naît du groupe, au fil de la semaine. Ce qui compte, c’est que ++chaque adolescent, chaque personnage et chaque objet y trouve sa place++. Comme dans le grand récit du vivant, où chaque être a son rôle et contribue à l’ensemble, chacun apporte ici sa part, unique et nécessaire."
sac:
  titre: Dans le sac…
  sousTitre: car la création, ça creuse !
  objets:
    - image: assets/img/actualites/stage-sac-repas.png
      texte: Une **gourde**, un repas pour le midi et un goûter.
    - image: assets/img/actualites/stage-sac-tenue.png
      texte: Une **tenue souple** pour bouger et jouer.
    - image: assets/img/actualites/stage-sac-blouse.png
      texte: Une **grande chemise** en guise de blouse pour les arts plastiques.
inscription: Un **acompte de 100 €** valide l’inscription, par Wero ou virement bancaire. Contactez l’école pour connaître les modalités.
---
```

- [ ] **Étape 11 : écrire les 4 sessions de stage**

Créer `src/content/stages/stage-fevrier-2027.yml` :

```yaml
programme: histoires-objets-inventes-enfants.md
debut: 2027-02-22
fin: 2027-02-26
vacances: hiver
image: assets/img/actualites/stage-theatre-fevrier.png
couleur: vert
prix: 230
prixFratrie: 200
effectif: 14
```

Créer `src/content/stages/stage-avril-2027.yml` :

```yaml
programme: histoires-objets-inventes-enfants.md
debut: 2027-04-26
fin: 2027-04-30
vacances: printemps
image: assets/img/actualites/stage-theatre-avril-scene.png
cadrage: 58
couleur: menthe
prix: 230
prixFratrie: 200
effectif: 14
```

Créer `src/content/stages/stage-juillet-2027.yml` :

```yaml
programme: histoires-objets-inventes-enfants.md
debut: 2027-07-12
fin: 2027-07-16
vacances: ete
image: assets/img/actualites/stage-theatre-juillet.png
cadrage: 52
couleur: orange
prix: 230
prixFratrie: 200
effectif: 14
```

Créer `src/content/stages/stage-ados-juillet-2027.yml` :

```yaml
programme: histoires-objets-inventes-ados.md
debut: 2027-07-19
fin: 2027-07-23
vacances: ete
image: assets/img/actualites/stage-ados-apercu-scene.png
cadrage: 60
couleur: bleu
prix: 230
prixFratrie: 200
effectif: 14
note: Une session dédiée aux adolescents.
```

- [ ] **Étape 12 : écrire les 2 rendez-vous**

En YAML, toute valeur qui contient « : » (deux-points suivi d'une espace) doit être entre guillemets.

Créer `src/content/rendez-vous/portes-ouvertes-de-printemps.md` :

```markdown
---
titre: Portes ouvertes de printemps
titreModale: |-
  Portes ouvertes
  de printemps
date: 2027-03-20
heureDebut: 10h00
heureFin: 12h30
mention: Sans inscription · Entrée libre
resume: Une matinée pour découvrir les ambiances, rencontrer l’équipe éducative et manipuler le matériel Montessori, en famille.
bouton: Préparer ma visite
visuel:
  image: assets/img/actualites/une-educatrice-accueille-une-mere-et-son-2.webp
  alt: Une éducatrice accueille une mère et son enfant à l’école.
  fond: vert
  etiquette: Visite libre · Sans inscription
surtitre: Rencontrer l’école
intro: Une ambiance Montessori se découvre en la parcourant. Venez visiter l’école en famille et échanger avec l’équipe sur notre projet pédagogique.
pointsForts:
  - icone: livre
    titre: Découvrir les ambiances
    texte: Parcourez les espaces 3–6 ans et 6–12 ans et découvrez le matériel Montessori.
  - icone: bulle
    titre: Rencontrer l’équipe
    texte: Posez vos questions sur la pédagogie et le quotidien des enfants aux Petons.
  - icone: famille
    titre: Venir en famille
    texte: Les enfants sont les bienvenus pour découvrir, eux aussi, l’école et son jardin.
encadre:
  titre: Visite libre, sans inscription.
  texte: 6 rue de la Petite Sensive · 44300 Nantes
liens:
  - libelle: Voir l’itinéraire
    url: "https://www.google.com/maps/dir/?api=1&destination=6%20rue%20de%20la%20Petite%20Sensive%2C%2044300%20Nantes"
    style: bouton
  - libelle: Une question sur la visite ?
    url: contact-petons.html?sujet=visite
---
```

Créer `src/content/rendez-vous/un-carnaval-autour-de-la-sante.md` :

```markdown
---
titre: Un carnaval autour de la santé
titreModale: |-
  Un carnaval
  autour de la santé
date: 2027-02-17
mention: Pour les enfants de l’école
resume: "Clowns d’hôpital, médecins et autres déguisements : le thème de la santé s’invite au carnaval des enfants."
visuel:
  illustration: carnaval
  alt: Les enfants en costumes sur le thème de la santé.
  fond: sable
  etiquette: Pour les enfants de l’école
surtitre: Événement à venir · Vie de l’école
blocs:
  - type: texte
    contenu: Le carnaval des enfants aura pour thème **la santé**. Une occasion de se déguiser et de partager un moment festif à l’école.
encadre:
  titre: Un rendez-vous pour les enfants de l’école.
liens:
  - libelle: Une question sur ce rendez-vous ?
    url: contact-petons.html?sujet=information
---
```

- [ ] **Étape 13 : écrire les 2 articles**

Le champ `date` sert seulement au classement et n'est affiché nulle part. Pour le cross, `2026-06-01` est une approximation (l'article était présent dès la création du site) : **la faire confirmer par Philippe à la relecture**. Seule contrainte : rester antérieure au 25 septembre 2026, pour garder l'ordre actuel.

Créer `src/content/articles/eco-ecole-solidarites.md` :

```markdown
---
titre: La solidarité, un fil conducteur pour cette année
titreModale: "Éco-École : les enfants organisent le choix du thème de l’année"
date: 2026-09-25
repere: Vote Éco-École
resume: Les Papillons ont préparé le vote et invité les enfants et les familles à choisir le thème de notre projet Éco-École. Cette année, place à la solidarité !
visuel:
  image: assets/img/actualites/eco-ecole-vote-solidarites-2026-retouche.jpg
  alt: Les enfants réunis autour de la table de vote à la sortie de l’école.
  fond: photo
  cadrage: 42
  etiquette: Le choix des enfants et des familles
surtitre: Éco-École · Septembre 2026
intro: "Préparer, présenter, se répartir les rôles et inviter chacun à voter : les Papillons se sont mobilisés pour lancer notre nouveau projet Éco-École. Le thème retenu cette année : la solidarité."
blocs:
  - type: photo
    image: assets/img/actualites/eco-ecole-vote-solidarites-2026-retouche.jpg
    alt: Les enfants réunis autour de la table de vote à la sortie de l’école.
    legende: Un vote organisé par les Papillons, avec les enfants et les familles.
  - type: intertitre
    titre: Un vote préparé par les Papillons
  - type: texte
    contenu: |-
      Avant de choisir le thème, il fallait organiser le vote ! Les enfants de l’ambiance 6–12 ans ont préparé la présentation des différentes thématiques, le matériel et les petits jetons nécessaires au scrutin.

      Ils se sont aussi réparti les responsabilités : qui présenterait les thèmes ? Qui accueillerait les parents au point de vote à la sortie de l’école ? Qui annoncerait le résultat ?

      **Une organisation collective dans laquelle chacun avait un rôle à jouer.**

      **Vendredi 25 septembre à la sortie de l’école**, les parents ont été conviés à voter.

      Le lundi suivant, les Papillons ont présenté les thèmes aux Chenilles, les enfants de l’ambiance 3–6 ans, puis **tous les enfants de l’école ont voté à leur tour**. La solidarité sera ainsi le fil conducteur de notre projet pour cette année.
  - type: intertitre
    titre: Les solidarités, à l’école et au-delà
  - type: texte
    contenu: |-
      Dans le programme Éco-École, ce thème invite à explorer le vivre-ensemble, le respect des différences et la lutte contre les inégalités et les discriminations. Il ouvre aussi la réflexion sur les liens que l’on peut tisser au-delà de son école.

      Comment être attentif aux autres ? Faire une place à chacun ? Partager ses connaissances et agir ensemble ? Ces questions nourriront les échanges et les projets à construire avec les enfants.
  - type: intertitre
    titre: Un engagement reconnu depuis 2021
    logo: assets/img/actualites/eco-ecole.svg
    logoAlt: Logo Éco-École
  - type: texte
    contenu: |-
      **Les Petons dans l’Herbe sont labellisés Éco-École depuis 2021.** Ce label valorise une démarche d’éducation au développement durable fondée sur des actions concrètes et sur l’implication des élèves et de la communauté éducative.

      En préparant eux-mêmes ce vote, les Papillons en ont déjà fait l’expérience : écouter, coopérer, prendre des responsabilités et permettre à chacun de s’exprimer.

      **Le projet commence dès la façon de le construire ensemble.**
liens:
  - libelle: Découvrir le programme Éco-École
    url: https://www.eco-ecole.org/
    nouvelOnglet: true
---
```

Créer `src/content/articles/cross-des-petons.md` :

```markdown
---
titre: Courir, s’encourager et célébrer les efforts
titreModale: |-
  Le cross des Petons :
  un souvenir partagé
date: 2026-06-01
repere: Le cross des Petons
resume: "Des mois de préparation, des dossards coloriés et des familles au bord du parcours : retour sur un cross joyeux, où les efforts de chacun ont été célébrés."
visuel:
  image: assets/img/actualites/un-enfant-prepare-son-dossard-pour-le.webp
  alt: Un enfant prépare son dossard pour le cross des Petons.
  fond: photo
  cadrage: 52
  etiquette: Retour en images
surtitre: Retour sur un événement · En images
intro: Chaque semaine, pendant plusieurs mois, les enfants se sont préparés pour ce rendez-vous. Le jour du cross, leurs dossards coloriés, les encouragements des familles et les surprises à l’arrivée ont transformé cette préparation en une belle fête partagée.
blocs:
  - type: intertitre
    titre: Une aventure qui commence bien avant le départ
  - type: texte
    contenu: |-
      Le cross ne se résume pas au jour de la course. Pendant plusieurs mois, **les enfants sont allés s’entraîner chaque semaine sur le parcours du chemin des Renards**, accompagnés par les éducateurs. Au fil des séances, ils ont pris leurs repères et se sont préparés à l’effort, chacun à son rythme.

      À l’approche du grand jour, ils ont aussi préparé et colorié leur propre dossard. Une façon de s’approprier ce rendez-vous et d’arriver sur la ligne de départ avec une petite création bien à soi.
  - type: photo
    image: assets/img/actualites/un-enfant-prepare-son-dossard-pour-le.webp
    alt: Un enfant prépare son dossard pour le cross des Petons.
    legende: Un dossard préparé et colorié par les enfants avant la course.
  - type: intertitre
    titre: Le grand jour, tous au bord du parcours !
  - type: texte
    contenu: |-
      Les parents ont joué le jeu : installés le long du parcours, ils ont encouragé les petits champions jusqu’à l’arrivée. **Une ambiance festive, conviviale et joyeuse**, portée par les familles et par le soin apporté à l’organisation par les éducateurs.

      Après les entraînements, place au plaisir de courir ensemble et de partager ce moment avec ceux qui étaient venus les soutenir.
  - type: intertitre
    titre: Des surprises pour célébrer les efforts
  - type: texte
    contenu: |-
      L’APE avait préparé de petites attentions pour les enfants : **des médailles et une collation du sportif** les attendaient après la course. Avec leur petit diplôme, chacun pouvait garder un souvenir de cette journée et du chemin parcouru pour s’y préparer.
  - type: photo
    image: assets/img/actualites/le-diplome-remis-a-un-enfant-a-larrivee.webp
    alt: Le diplôme remis à un enfant à l’arrivée du cross.
    legende: Un souvenir pour célébrer les efforts de chacun.
  - type: texte
    contenu: |-
      Merci aux éducateurs, aux familles et à l’APE d’avoir fait de ce cross un si beau moment de vie de l’école. **Et bravo aux enfants pour leur engagement, des premières séances d’entraînement jusqu’à la ligne d’arrivée !**
---
```

- [ ] **Étape 14 : vérifier tests et build**

Lancer : `bun run check`
Résultat attendu : le build se termine par `12 page(s) built` sans `[ERROR]`. Le build valide aussi les contenus avec les schémas. Les tests : `0 fail`. La page Actualités n'a pas encore changé.

- [ ] **Étape 15 : committer**

```bash
git add package.json bun.lock src/content src/content.config.ts src/lib public/assets/img/actualites tests/
git commit -m "Passe les programmes, stages, rendez-vous et articles en collections de contenu"
```

---

### Tâche 4 : stages affichés depuis les sessions et les programmes

**Fichiers :**
- Créer : `src/components/actualites/Icone.astro`, `TitreLignes.astro`, `StageCard.astro`, `StageDialog.astro`, `ProgrammeSection.astro`
- Modifier : `src/pages/actualites-petons.astro` (en-tête, cartes de stage lignes 296–378, fenêtres de stage lignes 384–433, CSS lignes 157–173)
- Supprimer : les 15 images d'origine qui ne servent qu'aux stages, dans `public/assets/img/`
- Modifier : `tests/migration-actualites.test.ts`

**Interfaces :**
- Consomme : `Programme`, `SectionProgramme`, `Stage` (`src/content/schemas.ts`) ; `plageStage`, `dateIso`, `majuscule`, `jourMois`, `jourSemaine`, `deMois`, `anneesStages` (`src/lib/dates.ts`) ; `dimensionsImage` ; `enLigne`, `enBlocs` ; `stagesAffiches`, `avecProgramme` ; `contact` (`src/data/site.ts`).
- Produit :
  - `<Icone nom={…} class?={string} />`, où `nom` vaut l'une des valeurs de `ICONES` ou `fleche` ou `fermer`, et la classe vaut `icon` par défaut ;
  - `<TitreLignes texte={string} />` (les retours à la ligne deviennent `<br>`) ;
  - `<StageCard id stage programme />` et `<StageDialog id stage programme />`, la fenêtre ayant pour identifiant `${id}-dialog` et son titre `${id}-title` ;
  - `<ProgrammeSection id section restitution? />`.

- [ ] **Étape 1 : étendre le test de migration aux stages**

Remplacer tout le contenu de `tests/migration-actualites.test.ts` par :

```ts
// Test TEMPORAIRE de la migration vers Page CMS : compare la page construite
// à la photo prise avant la migration. Supprimé à la tâche 8, car ensuite le
// contenu change normalement via Page CMS.
import { describe, expect, test } from 'bun:test';
import type { HTMLElement } from 'node-html-parser';
import { chargerHtml, nomsImages, texteCompact } from './outils/html';

const avant = await chargerHtml('tests/fixtures/actualites-avant.html');
const apres = await chargerHtml('dist/actualites-petons.html');

const trouver = (racine: HTMLElement, selecteur: string): HTMLElement => {
  const element = racine.querySelector(selecteur);
  if (!element) throw new Error(`${selecteur} introuvable`);
  return element;
};

/** Carte (article) qui ouvre la fenêtre donnée. */
const carteDe = (racine: HTMLElement, dialogue: string): HTMLElement => {
  const carte = trouver(racine, `[aria-controls="${dialogue}"]`).closest('article');
  if (!carte) throw new Error(`Carte de ${dialogue} introuvable`);
  return carte;
};

/** Même texte (à des changements assumés près) et mêmes images, dans le même ordre. */
const comparer = (ancien: HTMLElement, nouveau: HTMLElement, changementsAssumes: ReadonlyArray<readonly [string, string]> = []) => {
  const compacter = (texte: string) => texte.replace(/\s+/g, '');
  const attendu = changementsAssumes.reduce((texte, [de, vers]) => texte.replace(compacter(de), compacter(vers)), texteCompact(ancien));
  expect(texteCompact(nouveau)).toBe(attendu);
  expect(nomsImages(nouveau)).toEqual(nomsImages(ancien));
};

/** Mêmes passages surlignés (soft-mark, orange-mark), dans le même ordre. */
const memesSurlignages = (ancien: HTMLElement, nouveau: HTMLElement) => {
  const surlignages = (racine: HTMLElement) => racine.querySelectorAll('.soft-mark, .orange-mark').map((e) => `${e.classNames}:${e.text}`);
  expect(surlignages(nouveau)).toEqual(surlignages(ancien));
};

test('la photo d’origine contient 8 cartes et 9 fenêtres', () => {
  expect(avant.querySelectorAll('.news-card')).toHaveLength(8);
  expect(avant.querySelectorAll('dialog')).toHaveLength(9);
});

describe('stages', () => {
  const ids = ['stage-fevrier-2027', 'stage-avril-2027', 'stage-juillet-2027', 'stage-ados-juillet-2027'];

  test('mêmes cartes, dans le même ordre', () => {
    expect(apres.querySelectorAll('.stage-card').map((carte) => carte.id)).toEqual(ids);
  });

  test('même intitulé de section', () => {
    comparer(trouver(avant, '.stage-section-label'), trouver(apres, '.stage-section-label'));
  });

  for (const id of ids) {
    test(`carte ${id}`, () => comparer(trouver(avant, `#${id}`), trouver(apres, `#${id}`)));
    test(`fenêtre ${id}`, () => {
      comparer(trouver(avant, `#${id}-dialog`), trouver(apres, `#${id}-dialog`));
      memesSurlignages(trouver(avant, `#${id}-dialog`), trouver(apres, `#${id}-dialog`));
    });
  }
});
```

- [ ] **Étape 2 : vérifier que la comparaison passe sur la page d'origine**

C'est un test de caractérisation : il doit passer **avant** la modification (cela prouve que la comparaison fonctionne), puis **encore** après.

Lancer : `bun run check`
Résultat attendu : `0 fail`.

- [ ] **Étape 3 : écrire les icônes et le titre sur plusieurs lignes**

Créer `src/components/actualites/Icone.astro`. Les tracés reprennent les icônes de la page d'origine :

```astro
---
// Icônes au trait (24×24, couleur du texte). Les noms de ICONES (src/content/schemas.ts) sont proposés dans Page CMS.
const traces = {
  fleche: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  fermer: '<path d="m6 6 12 12M18 6 6 18"/>',
  livre: '<path d="M12 7C9 4 5 4 2 5v15c4-1 7-1 10 2 3-3 6-3 10-2V5c-4-1-7-1-10 2Zm0 0v15"/>',
  bulle: '<path d="M21 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 19 0Z"/><path d="M7 10h9M7 14h6"/>',
  famille: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m1-17a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2"/>',
  pousse: '<path d="M12 21V11m0 3C4 14 3 10 3 6c6 0 9 3 9 8Zm0-3c0-6 3-9 9-9 0 6-3 9-9 9ZM6 21h12"/>',
  crayon: '<path d="m4 16-1 5 5-1L21 7l-4-4L4 16Zm11-11 4 4M4 16l4 4"/>',
  coeur: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  vent: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h6a3 3 0 1 1-3 3"/>',
  etoile: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z"/>',
  calendrier: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18m-13 4h2m4 0h2"/>',
} as const;

interface Props {
  nom: keyof typeof traces;
  class?: string;
}

const { nom, class: classe = 'icon' } = Astro.props;
---
<svg class={classe} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" set:html={traces[nom]}></svg>
```

Créer `src/components/actualites/TitreLignes.astro` :

```astro
---
// Titre saisi sur plusieurs lignes dans Page CMS : chaque retour à la ligne devient <br>.
interface Props {
  texte: string;
}

const lignes = Astro.props.texte.split('\n').map((ligne) => ligne.trim()).filter(Boolean);
---
{lignes.map((ligne, index) => <Fragment>{index > 0 && <br />}{ligne}</Fragment>)}
```

- [ ] **Étape 4 : écrire la carte de stage**

Créer `src/components/actualites/StageCard.astro`. Il reprend le HTML des lignes 297 à 316 de la page d'origine :

```astro
---
// Carte d’une session de stage (section « Les prochains rendez-vous »).
import type { Programme, Stage } from '../../content/schemas';
import { dateIso, majuscule, plageStage } from '../../lib/dates';
import { dimensionsImage } from '../../lib/dimensions-image';
import { enLigne } from '../../lib/markdown';
import TitreLignes from './TitreLignes.astro';

/** Complète « Vacances » sur la carte : « Vacances d’hiver ». */
const LIBELLES_VACANCES = {
  toussaint: 'de la Toussaint',
  noel: 'de Noël',
  hiver: 'd’hiver',
  printemps: 'de printemps',
  ete: 'd’été',
} as const;

interface Props {
  id: string;
  stage: Stage;
  programme: Programme;
}

const { id, stage, programme } = Astro.props;
const plage = plageStage(stage.debut, stage.fin);
const { width, height } = await dimensionsImage(stage.image);
const dialogue = `${id}-dialog`;
---
<article class={`news-card stage-card stage-card--${stage.couleur}`} id={id} aria-labelledby={`${id}-heading ${id}-date`} data-category="evenements">
  <div class="stage-visual"><img src={stage.image} alt="" width={width} height={height} loading="lazy" decoding="async" style={`object-position:center ${stage.cadrage}%`}><h3 id={`${id}-heading`}><TitreLignes texte={programme.titre} /></h3><small>{programme.accroche}</small><span class="visual-label stage-audience-label" set:html={enLigne(programme.etiquette)}></span></div>
  <div class="card-content">
    <div class="stage-meta">
      <div class="stage-date" id={`${id}-date`}><span class="stage-season">Vacances<br>{LIBELLES_VACANCES[stage.vacances]}</span><time datetime={dateIso(stage.debut)} aria-label={majuscule(plage.longue)}><strong>{plage.jours}</strong><b>{plage.mois}<br>{plage.annee}</b></time></div>
      <div class="stage-meta-details">
      <div class="stage-tags"><span class="stage-tag">{programme.discipline}</span><span class="stage-tag stage-age">{programme.ages}</span></div>
      {stage.note && <p class="stage-session-note">{stage.note}</p>}
      </div>
    </div>
    <p class="stage-description" set:html={enLigne(programme.description)}></p>
    <dl class="stage-essentials">
      <div><dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Horaires</dt><dd><strong>{programme.horaires}</strong><small>Accueil dès {programme.accueil}</small></dd></div>
      <div><dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2"/></svg>Groupe</dt><dd><strong>{stage.effectif}</strong><small>{programme.participantsCarte ?? programme.participants} au plus</small></dd></div>
      <div><dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h15v15H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m10 6h8v6h-8z"/><circle cx="17" cy="13" r=".6"/></svg>Le stage</dt><dd><strong>{stage.prix} €</strong><small>Fratries : {stage.prixFratrie} € / enfant</small></dd></div>
    </dl>
    <div class="stage-card-actions">
      <button type="button" class="button" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue} aria-label={`Programme et infos du stage ${plage.longue}`}>Programme &amp; infos <span aria-hidden="true">→</span></button>
    </div>
  </div>
</article>
```

- [ ] **Étape 5 : écrire une section de programme**

Créer `src/components/actualites/ProgrammeSection.astro`. Chaque type de bloc reproduit la mise en page d'origine : intervenants, liste des forces, étapes, illustration, invitation à la restitution, texte.

```astro
---
// Une section de la fenêtre « Programme & infos » : titre avec icône, puis ses blocs.
import type { SectionProgramme } from '../../content/schemas';
import { dimensionsImage } from '../../lib/dimensions-image';
import { enBlocs, enLigne } from '../../lib/markdown';
import Icone from './Icone.astro';

interface Props {
  id: string;
  section: SectionProgramme;
  /** « vendredi 26 février à 16h30. », si le programme a une restitution. */
  restitution?: string;
}

const { id, section, restitution } = Astro.props;
const CLASSES = { simple: undefined, separee: 'stage-programme', 'mise-en-avant': 'stage-finale' } as const;
const classeIllustration = section.presentation === 'mise-en-avant' ? 'stage-finale-art' : 'stage-programme-art';

const blocs = await Promise.all(section.blocs.map(async (bloc) => {
  switch (bloc.type) {
    case 'intervenants':
      return { ...bloc, personnes: await Promise.all(bloc.personnes.map(async (personne) => ({ ...personne, ...(await dimensionsImage(personne.photo)) }))) };
    case 'illustration':
      return { ...bloc, ...(await dimensionsImage(bloc.image)) };
    default:
      return bloc;
  }
}));
---
<section class={CLASSES[section.presentation]} aria-labelledby={id}><h3 class="stage-section-heading" id={id}><Icone nom={section.icone} class="stage-section-icon" /><span>{section.titre}</span></h3>
{blocs.map((bloc) => {
  switch (bloc.type) {
    case 'texte':
      return <Fragment set:html={enBlocs(bloc.contenu)} />;
    case 'intervenants':
      return <div class="stage-facilitators">{bloc.personnes.map((personne) => <div class="stage-facilitator"><figure class="stage-portrait"><img src={personne.photo} alt={personne.alt} width={personne.width} height={personne.height} loading="lazy" decoding="async"></figure><h4>{personne.nom}</h4><p set:html={enLigne(personne.presentation)}></p></div>)}</div>;
    case 'forces':
      return <ul class="stage-forces">{bloc.elements.map((element) => <li><Icone nom={element.icone} class="stage-force-icon" /><strong class="stage-force-title">{element.titre}</strong><Fragment set:html={enLigne(element.texte)} /></li>)}</ul>;
    case 'etapes':
      return bloc.elements.map((element) => <div class="stage-step"><Icone nom={element.icone} class="stage-section-icon" /><div><h4>{element.titre}</h4><p set:html={enLigne(element.texte)}></p></div></div>);
    case 'illustration':
      return <figure class={classeIllustration}><img src={bloc.image} alt={bloc.alt} width={bloc.width} height={bloc.height} loading="lazy" decoding="async"></figure>;
    case 'restitution':
      return restitution && <div class="stage-restitution-invite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18m-13 4h2m4 0h2"/></svg><div><h4>{bloc.titre}</h4><p>Restitution le <strong>{restitution}</strong>{bloc.precision && <small>{bloc.precision}</small>}</p></div></div>;
  }
})}
</section>
```

- [ ] **Étape 6 : écrire la fenêtre de stage**

Créer `src/components/actualites/StageDialog.astro`. L'en-tête et la partie « En pratique » reprennent les lignes 384 à 390 et 418 à 433 de la page d'origine. Les sections viennent du programme.

```astro
---
// Fenêtre « Programme & infos » d’une session de stage : contenu du programme + dates, prix et places de la session.
import type { Programme, Stage } from '../../content/schemas';
import { contact } from '../../data/site';
import { deMois, jourMois, jourSemaine, plageStage } from '../../lib/dates';
import { dimensionsImage } from '../../lib/dimensions-image';
import { enLigne } from '../../lib/markdown';
import Icone from './Icone.astro';
import ProgrammeSection from './ProgrammeSection.astro';

interface Props {
  id: string;
  stage: Stage;
  programme: Programme;
}

const { id, stage, programme } = Astro.props;
const plage = plageStage(stage.debut, stage.fin);
const [premiereLigne = '', ...autresLignes] = programme.titre.split('\n').map((ligne) => ligne.trim()).filter(Boolean);
const restitution = programme.restitution ? `${jourSemaine(stage.fin)} ${jourMois(stage.fin)} à ${programme.restitution}.` : undefined;
const objets = programme.sac
  ? await Promise.all(programme.sac.objets.map(async (objet) => ({ ...objet, ...(await dimensionsImage(objet.image)) })))
  : [];
---
<dialog id={`${id}-dialog`} class="event-dialog stage-dialog" aria-labelledby={`${id}-title`}><div class="dialog-inner">
<button class="dialog-close" type="button" data-close autofocus aria-label={`Fermer le programme du stage ${deMois(stage.debut)}`}><Icone nom="fermer" /></button>
<div class="stage-tags"><span class="stage-tag">{programme.discipline}</span><span class="stage-tag stage-age">{programme.ages}</span></div>
<p class="stage-audience" set:html={enLigne(programme.public)}></p>
<h2 id={`${id}-title`}>{premiereLigne}{autresLignes.length > 0 && <Fragment> <span class="stage-dialog-title-mark">{autresLignes.join(' ')}</span></Fragment>}</h2>
<p class="dialog-date"><Icone nom="calendrier" class="stage-section-icon" /><strong>{plage.courte} · {programme.horaires}</strong> <span>· {programme.jours} · {programme.lieu}</span></p>
<p class="stage-intro" set:html={enLigne(programme.intro)}></p>
{programme.sections.map((section, index) => <ProgrammeSection id={`${id}-section-${index + 1}`} section={section} restitution={restitution} />)}
<section class="stage-practical" aria-labelledby={`${id}-pratique`}>
<h3 class="stage-section-heading" id={`${id}-pratique`}><Icone nom="calendrier" class="stage-section-icon" /><span>En pratique</span></h3>
<div class="stage-key-facts">
<div class="stage-fact"><span class="stage-fact-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>La journée</span><strong class="stage-fact-value">{programme.horaires}</strong><small>Accueil dès <strong>{programme.accueil}</strong><br>{programme.jours}</small></div>
<div class="stage-fact"><span class="stage-fact-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2"/></svg>Le groupe</span><strong class="stage-fact-value">{stage.effectif} {programme.participants}</strong><small>Au plus, de <strong>{programme.agesDeA}</strong><br>Avec <strong>{programme.encadrement}</strong></small></div>
<div class="stage-fact"><span class="stage-fact-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h15v15H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m10 6h8v6h-8z"/><circle cx="17" cy="13" r=".6"/></svg>Le stage</span><strong class="stage-fact-value">{stage.prix} €</strong><small><strong>{stage.prixFratrie} € par enfant</strong><br>pour les fratries</small></div>
</div>
<div class="stage-arrival">
<div><h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>Rendez-vous aux Petons</span></h4><p>École Montessori « Les Petons dans l’Herbe »<br>{contact.address.join(' · ')}</p></div>
{restitution && <div><h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2"/></svg><span>Un moment à partager en famille</span></h4><p>Restitution le <strong>{restitution}</strong></p></div>}
</div>
{programme.sac && (
<div class="stage-bag"><div class="stage-bag-heading"><h4>{programme.sac.titre}</h4>{programme.sac.sousTitre && <span>{programme.sac.sousTitre}</span>}</div>
<ul>{objets.map((objet) => <li><img src={objet.image} alt="" width={objet.width} height={objet.height} loading="lazy" decoding="async"><span set:html={enLigne(objet.texte)}></span></li>)}</ul></div>
)}
<div class="stage-booking"><div><h4>Pour s’inscrire</h4><p set:html={enLigne(programme.inscription)}></p></div><a class="button" href="contact-petons.html?sujet=vacances#ecrire">S’informer et s’inscrire <span aria-hidden="true">→</span></a></div>
</section>
</div></dialog>
```

- [ ] **Étape 7 : brancher la page sur les collections**

Remplacer les régions par des marqueurs. Les commandes ont été testées sur une copie de la page d'origine :

```bash
F=src/pages/actualites-petons.astro
perl -0pi -e 's/<dialog id="stage-fevrier-2027-dialog".*?<\/dialog>\n(?=<dialog id="open-house-dialog")/__DIALOGUES_STAGES__\n/s' $F
perl -0pi -e 's/<div class="holiday-stages">.*?<\/article>\n<\/div><\/div>\n/__STAGES__\n/s' $F
grep -c '__STAGES__\|__DIALOGUES_STAGES__' $F
```

Résultat attendu : `2`.

Avec l'outil Edit, remplacer la ligne `__STAGES__` par :

```astro
{stages.length > 0 && (
<div class="holiday-stages"><p class="stage-section-label">Stages de vacances · {anneesStages(stages.map(({ data }) => data.debut))}</p><div class="stage-grid">
{stages.map(({ id, data, programme }) => <StageCard id={id} stage={data} programme={programme} />)}
</div></div>
)}
```

Puis remplacer la ligne `__DIALOGUES_STAGES__` par :

```astro
{stages.map(({ id, data, programme }) => <StageDialog id={id} stage={data} programme={programme} />)}
```

Puis remplacer l'en-tête du fichier (lignes 1 à 5) :

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import SiteNavScript from '../components/SiteNavScript.astro';
---
```

par :

```astro
---
import { getCollection } from 'astro:content';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import SiteNavScript from '../components/SiteNavScript.astro';
import StageCard from '../components/actualites/StageCard.astro';
import StageDialog from '../components/actualites/StageDialog.astro';
import { avecProgramme, stagesAffiches } from '../lib/actualites';
import { anneesStages } from '../lib/dates';

// Contenus modifiables dans Page CMS : voir docs/page-cms.md.
const stages = avecProgramme(stagesAffiches(await getCollection('stages')), await getCollection('programmes'));
---
```

- [ ] **Étape 8 : renommer les couleurs de carte dans le CSS**

Les couleurs de carte prennent des noms de couleur au lieu de noms de mois. Le cadrage des images passe dans l'attribut `style` posé par `StageCard` :

```bash
perl -pi -e 's/^\.stage-card--avril\{/.stage-card--menthe{/; s/^\.stage-card--ados\{/.stage-card--bleu{/; s/^\.stage-card--juillet\{/.stage-card--orange{/; $_ = "" if /^\.stage-card--(?:ados|avril|juillet) \.stage-visual img\{object-position:center \d+%\}$/' src/pages/actualites-petons.astro
grep -n 'stage-card--' src/pages/actualites-petons.astro
```

Résultat attendu : exactement 3 lignes, `.stage-card--menthe{…}`, `.stage-card--bleu{…}` et `.stage-card--orange{…}`.

- [ ] **Étape 9 : supprimer les images d'origine des stages**

```bash
IMAGES="stage-theatre-fevrier.png stage-theatre-avril-scene.png stage-theatre-juillet.png stage-ados-apercu-scene.png philippe-leroy-stage.jpg manuella-cortes-thonon-stage.jpg stage-trois-forces-fil-imagination.png stage-corps-voix-main-v2.png stage-histoires-restitution-v2.png stage-ados-trois-forces-v3.png stage-ados-corps-voix-main-v3.png stage-ados-restitution-v3.png stage-sac-repas.png stage-sac-tenue.png stage-sac-blouse.png"
for f in $IMAGES; do grep -rln "assets/img/$f" src public; done
```

Résultat attendu : aucune ligne. Seules les copies de `assets/img/actualites/` restent référencées. Puis :

```bash
for f in $IMAGES; do git rm -q "public/assets/img/$f"; done
```

- [ ] **Étape 10 : vérifier**

Lancer : `bun run check`
Résultat attendu : build sans `[ERROR]`, `0 fail` (les 9 tests du bloc `stages` passent, surlignages compris).

Contrôle visuel : lancer les préviews `actualites-avant` et `actualites-apres`, puis ouvrir `actualites-petons.html#agenda` des deux côtés, en largeur bureau puis mobile (`resize_window` preset `mobile`). Les 4 cartes doivent être identiques : couleurs, cadrage des images, note « Une session dédiée aux adolescents. ». Ouvrir la fenêtre « Programme & infos » de février et celle des ados : contenu, images, surlignages vert et orange, fond orangé de « Une histoire où chacun trouve sa place », tout doit être identique. Ouvrir `actualites-petons.html#stage-fevrier-2027` : la fenêtre de février doit s'ouvrir seule.

- [ ] **Étape 11 : committer**

```bash
git add -A src/components/actualites src/pages/actualites-petons.astro public/assets/img tests/migration-actualites.test.ts
git commit -m "Affiche les stages de vacances depuis les sessions et les programmes"
```

---

### Tâche 5 : rendez-vous affichés depuis la collection

**Fichiers :**
- Créer : `src/components/illustrations/Carnaval.astro`, `src/components/illustrations/index.ts`
- Créer : `src/components/actualites/Visuel.astro`, `Blocs.astro`, `LiensAction.astro`, `RendezVousCard.astro`, `RendezVousDialog.astro`
- Modifier : `src/pages/actualites-petons.astro` (en-tête, grille de l'agenda, fenêtres des rendez-vous et `inscriptions-dialog`, CSS des visuels)
- Modifier : `tests/migration-actualites.test.ts`

**Interfaces :**
- Consomme : `RendezVous`, `Visuel`, `Bloc`, `Lien`, `dimensionsImage`, `enBlocs`, `<Icone>` et `<TitreLignes>` (tâche 4), `jourMois`, `jourSemaine`, `majuscule`, `horaire`, `rendezVousAffiches`.
- Produit :
  - `illustrations: { carnaval: AstroComponent }`, dont chaque composant reçoit `{ label: string; class?: string }`.
  - `<Visuel visuel={Visuel} chargement?={'eager' | 'lazy'} />` (`div.article-visual.article-visual--{fond}`)
  - `<Blocs blocs={ReadonlyArray<Bloc>} />` (`div.article-body`, rien si la liste est vide)
  - `<LiensAction liens={ReadonlyArray<Lien>} />` (`div.dialog-actions`, rien si la liste est vide)
  - `<RendezVousCard id rendezVous premier />` et `<RendezVousDialog id rendezVous />` (fenêtre `${id}-dialog`, titre `${id}-title`)

- [ ] **Étape 1 : étendre le test de migration aux rendez-vous**

Ajouter à la fin de `tests/migration-actualites.test.ts` :

```ts
describe('rendez-vous', () => {
  test('triés par date', () => {
    expect(apres.querySelectorAll('.agenda-card').map((carte) => carte.id)).toEqual(['un-carnaval-autour-de-la-sante', 'portes-ouvertes-de-printemps']);
  });
  test('carte Portes ouvertes', () => comparer(carteDe(avant, 'open-house-dialog'), trouver(apres, '#portes-ouvertes-de-printemps')));
  test('fenêtre Portes ouvertes', () => comparer(trouver(avant, '#open-house-dialog'), trouver(apres, '#portes-ouvertes-de-printemps-dialog')));
  test('carte Carnaval', () => comparer(carteDe(avant, 'carnaval-dialog'), trouver(apres, '#un-carnaval-autour-de-la-sante')));
  test('fenêtre Carnaval (jour de la semaine ajouté)', () => {
    comparer(trouver(avant, '#carnaval-dialog'), trouver(apres, '#un-carnaval-autour-de-la-sante-dialog'), [['17 février', 'Mercredi 17 février']]);
  });
  test('la fenêtre orpheline des inscriptions a disparu', () => {
    expect(apres.querySelector('#inscriptions-dialog')).toBeNull();
  });
  test('les autres blocs de la section agenda sont inchangés', () => {
    for (const selecteur of ['.agenda-hero', '#inscriptions-ouvertes', '#proposer-activite']) {
      comparer(trouver(avant, selecteur), trouver(apres, selecteur));
    }
  });
});
```

Lancer : `bun run check`
Résultat attendu : ÉCHEC sur « triés par date », sur les quatre comparaisons de cartes et de fenêtres (identifiants introuvables) et sur « la fenêtre orpheline… ». « les autres blocs… » passe.

- [ ] **Étape 2 : extraire l'illustration du carnaval en composant**

La commande recopie l'illustration de la carte à l'identique. Elle a été testée et produit un fichier d'environ 2,2 Ko :

```bash
mkdir -p src/components/illustrations
perl -0ne 'if (/<svg class="painted puppet puppet--carnaval"[^>]*>(.*?)<\/svg>(?=<span class="visual-label")/s) { print "---\n// Illustration animée du carnaval. Les animations sont dans public/assets/css/enfants-animes.css.\ninterface Props {\n  label: string;\n  class?: string;\n}\n\nconst { label, class: classe } = Astro.props;\n---\n<svg class:list={[classe, \"painted puppet puppet--carnaval\"]} viewBox=\"0 0 1536 1024\" role=\"img\" aria-label={label}>$1</svg>\n" }' src/pages/actualites-petons.astro > src/components/illustrations/Carnaval.astro
head -c 400 src/components/illustrations/Carnaval.astro; echo; wc -c src/components/illustrations/Carnaval.astro
```

Résultat attendu : le fichier commence par l'en-tête `---` et la balise `<svg class:list=…>`, et il fait environ 2 200 octets.

Créer `src/components/illustrations/index.ts` :

```ts
// Illustrations animées proposées dans Page CMS (champ « Illustration animée »).
// Pour en ajouter une : créer le composant ici, puis l’ajouter à ILLUSTRATIONS (src/content/schemas.ts) et à .pages.yml.
import Carnaval from './Carnaval.astro';

export const illustrations = { carnaval: Carnaval } as const;
```

- [ ] **Étape 3 : écrire les petites briques**

Créer `src/components/actualites/Visuel.astro` :

```astro
---
// Visuel d’une carte : photo, dessin (fond vert ou sable) ou illustration animée.
import type { Visuel } from '../../content/schemas';
import { dimensionsImage } from '../../lib/dimensions-image';
import { illustrations } from '../illustrations';

interface Props {
  visuel: Visuel;
  chargement?: 'eager' | 'lazy';
}

const { visuel, chargement = 'lazy' } = Astro.props;
const Illustration = visuel.illustration ? illustrations[visuel.illustration] : undefined;
const dimensions = visuel.image ? await dimensionsImage(visuel.image) : undefined;
const peint = visuel.fond !== 'photo';
---
<div class={`article-visual article-visual--${visuel.fond}`}>{Illustration
  ? <Illustration label={visuel.alt} />
  : <img src={visuel.image} class={peint ? 'painted' : undefined} alt={visuel.alt} loading={chargement} decoding="async" width={dimensions?.width} height={dimensions?.height} style={peint ? undefined : `object-position:center ${visuel.cadrage}%`}>}{visuel.etiquette && <span class="visual-label">{visuel.etiquette}</span>}</div>
```

Créer `src/components/actualites/Blocs.astro` :

```astro
---
// Contenu d’une fenêtre : textes (Markdown), intertitres (avec logo facultatif) et photos légendées.
import type { Bloc } from '../../content/schemas';
import { dimensionsImage } from '../../lib/dimensions-image';
import { enBlocs } from '../../lib/markdown';

interface Props {
  blocs: ReadonlyArray<Bloc>;
}

const { blocs } = Astro.props;
const elements = await Promise.all(blocs.map(async (bloc) => {
  switch (bloc.type) {
    case 'texte':
      return { type: 'texte' as const, html: enBlocs(bloc.contenu) };
    case 'intertitre':
      return {
        type: 'intertitre' as const,
        titre: bloc.titre,
        logo: bloc.logo ? { src: bloc.logo, alt: bloc.logoAlt ?? '', ...(await dimensionsImage(bloc.logo)) } : undefined,
      };
    case 'photo':
      return { type: 'photo' as const, src: bloc.image, alt: bloc.alt, legende: bloc.legende, ...(await dimensionsImage(bloc.image)) };
  }
}));
---
{elements.length > 0 && (
<div class="article-body">{elements.map((element) => element.type === 'texte'
  ? <Fragment set:html={element.html} />
  : element.type === 'photo'
    ? <figure class="article-photo"><img src={element.src} alt={element.alt} width={element.width} height={element.height} loading="lazy" decoding="async">{element.legende && <figcaption>{element.legende}</figcaption>}</figure>
    : element.logo
      ? <div class="article-heading-logo"><img src={element.logo.src} alt={element.logo.alt} width={element.logo.width} height={element.logo.height} loading="lazy" decoding="async"><h3>{element.titre}</h3></div>
      : <h3>{element.titre}</h3>)}</div>
)}
```

Créer `src/components/actualites/LiensAction.astro` :

```astro
---
// Liens en bas d’une fenêtre. « sr-only » est la classe de texte masqué définie sur la page Actualités.
import type { Lien } from '../../content/schemas';
import Icone from './Icone.astro';

interface Props {
  liens: ReadonlyArray<Lien>;
}

const { liens } = Astro.props;
const classe = (lien: Lien) => (lien.style === 'bouton' ? 'button' : 'text-link');
---
{liens.length > 0 && (
<div class="dialog-actions">{liens.map((lien) => lien.nouvelOnglet
  ? <a class={classe(lien)} href={lien.url} target="_blank" rel="noopener noreferrer">{lien.libelle} <span aria-hidden="true">↗</span><span class="sr-only"> (nouvel onglet)</span></a>
  : <a class={classe(lien)} href={lien.url}>{lien.libelle}<Icone nom="fleche" /></a>)}</div>
)}
```

- [ ] **Étape 4 : écrire la carte et la fenêtre d'un rendez-vous**

Créer `src/components/actualites/RendezVousCard.astro` :

```astro
---
// Carte d’un rendez-vous (grille de l’agenda).
import type { RendezVous } from '../../content/schemas';
import { horaire, jourMois } from '../../lib/dates';
import Icone from './Icone.astro';
import Visuel from './Visuel.astro';

interface Props {
  id: string;
  rendezVous: RendezVous;
  /** La première carte charge son image immédiatement. */
  premier: boolean;
}

const { id, rendezVous, premier } = Astro.props;
const dialogue = `${id}-dialog`;
const heures = horaire(rendezVous.heureDebut, rendezVous.heureFin);
const date = heures ? `${jourMois(rendezVous.date)} · ${heures}` : jourMois(rendezVous.date);
---
<article class="news-card agenda-card" id={id} data-category="evenements"><button type="button" class="cover-button" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue} aria-label={`Lire : ${rendezVous.titre}`}><Visuel visuel={rendezVous.visuel} chargement={premier ? 'eager' : 'lazy'} /></button><div class="card-content"><div class="card-meta"><span class="category-label category-evenements">{rendezVous.mention}</span><span class="article-date">{date}</span></div><h3><button type="button" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue}>{rendezVous.titre}</button></h3><p>{rendezVous.resume}</p><button type="button" class="button event-action" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue}>{rendezVous.bouton}<Icone nom="fleche" /></button></div></article>
```

Créer `src/components/actualites/RendezVousDialog.astro` :

```astro
---
// Fenêtre d’un rendez-vous. Elle prend le style « article » quand elle contient des blocs.
import type { RendezVous } from '../../content/schemas';
import { horaire, jourMois, jourSemaine, majuscule } from '../../lib/dates';
import { enLigne } from '../../lib/markdown';
import { illustrations } from '../illustrations';
import Blocs from './Blocs.astro';
import Icone from './Icone.astro';
import LiensAction from './LiensAction.astro';
import TitreLignes from './TitreLignes.astro';

interface Props {
  id: string;
  rendezVous: RendezVous;
}

const { id, rendezVous } = Astro.props;
const titre = `${id}-title`;
const heures = horaire(rendezVous.heureDebut, rendezVous.heureFin, ' – ');
const Illustration = rendezVous.visuel.illustration ? illustrations[rendezVous.visuel.illustration] : undefined;
---
<dialog id={`${id}-dialog`} class:list={['event-dialog', { 'article-dialog': rendezVous.blocs.length > 0 }]} aria-labelledby={titre}><div class="dialog-inner"><button class="dialog-close" type="button" data-close autofocus aria-label={`Fermer : ${rendezVous.titre}`}><Icone nom="fermer" /></button><span class="eyebrow">{rendezVous.surtitre}</span><h2 id={titre}><TitreLignes texte={rendezVous.titreModale ?? rendezVous.titre} /></h2><p class="dialog-date">{majuscule(jourSemaine(rendezVous.date))} {jourMois(rendezVous.date)}{heures && <Fragment> <span>· {heures}</span></Fragment>}</p>
{Illustration && <Illustration class="dialog-art" label={rendezVous.visuel.alt} />}
{rendezVous.intro && <p class="dialog-intro">{rendezVous.intro}</p>}
{rendezVous.pointsForts.length > 0 && (
<div class="visit-highlights">{rendezVous.pointsForts.map((point) => <div><Icone nom={point.icone} /><div><h3>{point.titre}</h3><p set:html={enLigne(point.texte)}></p></div></div>)}</div>
)}
<Blocs blocs={rendezVous.blocs} />
{rendezVous.encadre && <div class="visit-practical"><strong>{rendezVous.encadre.titre}</strong>{rendezVous.encadre.texte && <span>{rendezVous.encadre.texte}</span>}</div>}
<LiensAction liens={rendezVous.liens} />
</div></dialog>
```

- [ ] **Étape 5 : brancher la page sur la collection des rendez-vous**

```bash
F=src/pages/actualites-petons.astro
perl -0pi -e 's/<dialog id="open-house-dialog".*?<\/dialog>\s*<dialog id="inscriptions-dialog".*?<\/dialog>\s*<dialog id="carnaval-dialog".*?<\/dialog>\n/__DIALOGUES_RENDEZ_VOUS__\n/s' $F
perl -0pi -e 's/<div class="agenda-grid">.*?<\/article><\/div>(?=<aside class="sessions-note")/__RENDEZ_VOUS__/s' $F
grep -c '__RENDEZ_VOUS__\|__DIALOGUES_RENDEZ_VOUS__' $F
```

Résultat attendu : `2`. La ligne vide qui séparait les fenêtres explique le `\s*` entre elles.

Avec l'outil Edit :
- remplacer `__RENDEZ_VOUS__` (en début de ligne, suivi de `<aside class="sessions-note"`) par `<div class="agenda-grid">{rendezVous.map(({ id, data }, index) => <RendezVousCard id={id} rendezVous={data} premier={index === 0} />)}</div>` ;
- remplacer la ligne `__DIALOGUES_RENDEZ_VOUS__` par `{rendezVous.map(({ id, data }) => <RendezVousDialog id={id} rendezVous={data} />)}` ;
- dans l'en-tête, ajouter après `import StageDialog …` :

```astro
import RendezVousCard from '../components/actualites/RendezVousCard.astro';
import RendezVousDialog from '../components/actualites/RendezVousDialog.astro';
```

- remplacer `import { avecProgramme, stagesAffiches } from '../lib/actualites';` par `import { avecProgramme, rendezVousAffiches, stagesAffiches } from '../lib/actualites';` ;
- ajouter après `const stages = …;` :

```astro
const rendezVous = rendezVousAffiches(await getCollection('rendezVous'));
```

- [ ] **Étape 6 : renommer les classes de fond des visuels dans le CSS**

```bash
perl -pi -e 's/\.welcome-visual,\.carnival-visual\{/.article-visual--vert,.article-visual--sable{/g; s/\.welcome-visual\{/.article-visual--vert{/g; s/\.carnival-visual\{/.article-visual--sable{/g' src/pages/actualites-petons.astro
grep -c 'welcome-visual\|carnival-visual' src/pages/actualites-petons.astro
```

Résultat attendu : `0`.

- [ ] **Étape 7 : vérifier**

Lancer : `bun run check`
Résultat attendu : build sans `[ERROR]`, `0 fail`.

Contrôle visuel avant/après (bureau et mobile) : le Carnaval apparaît désormais en premier (changement assumé n°1). Les têtes et les étoiles de l'illustration s'animent dans la carte et dans la fenêtre. La carte des Portes ouvertes garde son fond vert pâle. Les fenêtres affichent les trois points forts avec leurs icônes, l'encadré pratique et les deux liens.

- [ ] **Étape 8 : committer**

```bash
git add src/components src/pages/actualites-petons.astro tests/migration-actualites.test.ts
git commit -m "Affiche les rendez-vous de l’agenda depuis la collection de contenu"
```

---

### Tâche 6 : articles affichés depuis la collection, et invariants de la page

**Fichiers :**
- Créer : `src/components/actualites/ArticleCard.astro`, `src/components/actualites/ArticleDialog.astro`, `tests/page-actualites.test.ts`
- Modifier : `src/pages/actualites-petons.astro` (en-tête, cartes d'articles, fenêtres d'articles, CSS des articles)
- Modifier : `tests/migration-actualites.test.ts`

**Interfaces :**
- Consomme : `Article`, `Visuel`, `Blocs`, `LiensAction`, `Icone`, `TitreLignes`, `articlesAffiches`.
- Produit : `<ArticleCard id article />`, `<ArticleDialog id article />` (fenêtre `${id}-dialog` avec les classes `event-dialog article-dialog journal-dialog`).

- [ ] **Étape 1 : écrire les tests**

Ajouter à la fin de `tests/migration-actualites.test.ts` :

```ts
describe('articles', () => {
  test('du plus récent au plus ancien', () => {
    expect(apres.querySelectorAll('.past-feature').map((carte) => carte.id)).toEqual(['eco-ecole-solidarites', 'cross-des-petons']);
  });
  test('carte Éco-École', () => comparer(trouver(avant, '#eco-ecole-solidarites'), trouver(apres, '#eco-ecole-solidarites')));
  test('fenêtre Éco-École', () => comparer(trouver(avant, '#solidarites-dialog'), trouver(apres, '#eco-ecole-solidarites-dialog')));
  test('carte du cross (flèche « → » comme l’article Éco-École)', () => {
    comparer(carteDe(avant, 'cross-dialog'), trouver(apres, '#cross-des-petons'), [['Lire l’article', 'Lire l’article →']]);
  });
  test('fenêtre du cross', () => comparer(trouver(avant, '#cross-dialog'), trouver(apres, '#cross-des-petons-dialog')));
  test('la lettre des Petons est inchangée', () => comparer(trouver(avant, '#lettre'), trouver(apres, '#lettre')));
});
```

Créer `tests/page-actualites.test.ts`. Ce test est durable : il reste après la migration et vérifie la page construite, quels que soient les contenus.

```ts
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
    expect(fenetre.querySelector(`#${fenetre.getAttribute('aria-labelledby')}`)).not.toBeNull();
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
      if (!page.querySelector(`#${ancre}`)) manquantes.push(`${fichier} → #${ancre}`);
    }
  }
  expect(manquantes).toEqual([]);
});
```

Lancer : `bun run check`
Résultat attendu : ÉCHEC sur « du plus récent au plus ancien », « fenêtre Éco-École » et les deux tests du cross (identifiants introuvables). « carte Éco-École » et « la lettre des Petons » passent déjà, comme les 4 tests de `page-actualites.test.ts`, qui décrivent un état qui doit rester vrai.

- [ ] **Étape 2 : écrire la carte et la fenêtre d'un article**

Créer `src/components/actualites/ArticleCard.astro` :

```astro
---
// Carte d’un article de « La vie de l’école ».
import type { Article } from '../../content/schemas';
import Visuel from './Visuel.astro';

interface Props {
  id: string;
  article: Article;
}

const { id, article } = Astro.props;
const dialogue = `${id}-dialog`;
---
<article class="news-card past-feature" id={id} data-category="retours"><button type="button" class="cover-button" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue} aria-label={`Lire : ${article.titre}`}><Visuel visuel={article.visuel} /></button><div class="card-content"><div class="card-meta"><span class="category-label category-retours">{article.rubrique}</span><span class="article-date">{article.repere}</span></div><h3><button type="button" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue}>{article.titre}</button></h3><p>{article.resume}</p><button type="button" class="article-link" data-open={dialogue} aria-haspopup="dialog" aria-controls={dialogue}>Lire l’article <span aria-hidden="true">→</span></button></div></article>
```

Créer `src/components/actualites/ArticleDialog.astro` :

```astro
---
// Fenêtre d’un article de « La vie de l’école ».
import type { Article } from '../../content/schemas';
import Blocs from './Blocs.astro';
import Icone from './Icone.astro';
import LiensAction from './LiensAction.astro';
import TitreLignes from './TitreLignes.astro';

interface Props {
  id: string;
  article: Article;
}

const { id, article } = Astro.props;
const titre = `${id}-title`;
---
<dialog id={`${id}-dialog`} class="event-dialog article-dialog journal-dialog" aria-labelledby={titre}><div class="dialog-inner"><button class="dialog-close" type="button" data-close autofocus aria-label={`Fermer l’article : ${article.titre}`}><Icone nom="fermer" /></button><span class="eyebrow">{article.surtitre}</span><h2 id={titre}><TitreLignes texte={article.titreModale ?? article.titre} /></h2><p class="dialog-intro"><strong>{article.intro}</strong></p>
<Blocs blocs={article.blocs} />
<LiensAction liens={article.liens} />
</div></dialog>
```

- [ ] **Étape 3 : brancher la page sur la collection des articles**

```bash
F=src/pages/actualites-petons.astro
perl -0pi -e 's/<dialog id="solidarites-dialog".*?<\/dialog>\n<dialog id="cross-dialog".*?<\/dialog>\n/__DIALOGUES_ARTICLES__\n/s' $F
perl -0pi -e 's/<article class="news-card past-feature".*?<\/article>(?=<\/div><\/section>)/__ARTICLES__/s' $F
grep -c '__ARTICLES__\|__DIALOGUES_ARTICLES__' $F
```

Résultat attendu : `2`.

Avec l'outil Edit :
- remplacer `__ARTICLES__` par `{articles.map(({ id, data }) => <ArticleCard id={id} article={data} />)}` ;
- remplacer la ligne `__DIALOGUES_ARTICLES__` par `{articles.map(({ id, data }) => <ArticleDialog id={id} article={data} />)}` ;
- dans l'en-tête, ajouter avant `import RendezVousCard …` :

```astro
import ArticleCard from '../components/actualites/ArticleCard.astro';
import ArticleDialog from '../components/actualites/ArticleDialog.astro';
```

- remplacer `import { avecProgramme, rendezVousAffiches, stagesAffiches } from '../lib/actualites';` par `import { articlesAffiches, avecProgramme, rendezVousAffiches, stagesAffiches } from '../lib/actualites';` ;
- ajouter après `const rendezVous = …;` :

```astro
const articles = articlesAffiches(await getCollection('articles'));
```

- [ ] **Étape 4 : remplacer dans le CSS les règles propres à chaque article**

```bash
perl -pi -e '
  s/\.cross-visual img\{object-fit:cover;object-position:50% 52%\}//g;
  s/\.solidarity-visual img\{object-fit:cover;object-position:center 42%\}/.article-visual.article-visual--photo>img{object-fit:cover}/g;
  s/\.cross-dialog\{/.journal-dialog{/g;
  s/#solidarites-dialog \.eco-label-heading h3/.article-body .article-heading-logo h3/g;
  s/\.eco-label-heading/.article-heading-logo/g;
  s/#solidarites-dialog h3,#cross-dialog h3\{/.article-body h3{/g;
  s/#solidarites-dialog \.article-photo img/.article-body .article-photo img/g;
' src/pages/actualites-petons.astro
grep -c 'solidarites-dialog\|cross-dialog\|cross-visual\|solidarity-visual\|eco-label-heading\|open-house\|carnaval-dialog\|__[A-Z_]*__' src/pages/actualites-petons.astro
```

Résultat attendu : `0`. Vérifier aussi `grep -c 'article-visual--photo>img\|\.journal-dialog{\|\.article-body h3{' src/pages/actualites-petons.astro`, qui doit donner au moins `3`.

Le cadrage des photos (42 % et 52 %) est désormais porté par l'attribut `style` posé par `Visuel`.

- [ ] **Étape 5 : vérifier**

Lancer : `bun run check`
Résultat attendu : build sans `[ERROR]`, `0 fail`.

Contrôle visuel avant/après (bureau et mobile), section « La vie de l'école » : les deux photos gardent le même cadrage. La fenêtre Éco-École garde ses intertitres, la photo légendée et le logo à gauche de « Un engagement reconnu depuis 2021 ». « (nouvel onglet) » n'est plus visible (changement assumé n°6). Elle est un peu plus large (changement assumé n°3). Ouvrir `actualites-petons.html#eco-ecole-solidarites` : la fenêtre s'ouvre seule.

- [ ] **Étape 6 : committer**

```bash
git add src/components/actualites src/pages/actualites-petons.astro tests/
git commit -m "Affiche les articles de la vie de l’école depuis la collection de contenu"
```

---

### Tâche 7 : configuration de Page CMS

**Fichiers :**
- Créer : `.pages.yml`, `tests/pages-cms.test.ts`

**Interfaces :**
- Consomme : `stageSchema`, `rendezVousSchema`, `articleSchema`.
- Produit : `.pages.yml`, lu par app.pagescms.org sur la branche `main`.

- [ ] **Étape 1 : écrire le test d'alignement**

Créer `tests/pages-cms.test.ts` :

```ts
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
```

- [ ] **Étape 2 : vérifier que le test échoue**

Lancer : `bun test tests/pages-cms.test.ts`
Résultat attendu : ÉCHEC, `.pages.yml` introuvable (`ENOENT`).

- [ ] **Étape 3 : écrire `.pages.yml`**

Créer `.pages.yml` à la racine du dépôt :

```yaml
# Page CMS (https://pagescms.org) : édition des actualités du site.
# Chaque champ doit correspondre à src/content/schemas.ts (vérifié par tests/pages-cms.test.ts) :
# Page CMS efface à l’enregistrement les champs qui ne sont pas déclarés ici.
# Guide des éditeurs : docs/page-cms.md.

media:
  input: public/assets/img/actualites
  output: assets/img/actualites
  categories: [image]
  rename: safe

settings:
  commit:
    identity: user
    templates:
      create: "Actualités : ajoute {path} (Page CMS)"
      update: "Actualités : modifie {path} (Page CMS)"
      delete: "Actualités : supprime {path} (Page CMS)"
      rename: "Actualités : renomme {oldPath} en {newPath} (Page CMS)"

components:
  visuel:
    type: object
    label: Visuel de la carte
    required: true
    fields:
      - name: image
        label: Image
        type: image
        description: Une photo ou un dessin. Laisser vide si vous choisissez une illustration animée.
      - name: illustration
        label: Illustration animée
        type: select
        description: À la place d’une image. Ajouter une nouvelle illustration animée demande une intervention dans le code.
        options:
          values:
            - value: carnaval
              label: Carnaval
      - name: alt
        label: Description de l’image
        type: string
        required: true
        description: Ce que montre l’image, en une phrase, pour les personnes qui ne la voient pas.
      - name: fond
        label: Présentation
        type: select
        default: photo
        options:
          values:
            - value: photo
              label: Photo plein cadre
            - value: vert
              label: Dessin sur fond vert
            - value: sable
              label: Dessin sur fond sable
      - name: cadrage
        label: Cadrage vertical de la photo (%)
        type: number
        default: 50
        description: "0 montre le haut de la photo, 100 le bas."
        options:
          min: 0
          max: 100
      - name: etiquette
        label: Étiquette sur l’image
        type: string

  lien:
    type: object
    label: Lien
    fields:
      - name: libelle
        label: Texte du lien
        type: string
        required: true
      - name: url
        label: Adresse
        type: string
        required: true
        description: "Une page du site : contact-petons.html?sujet=visite. Un autre site : https://…"
      - name: style
        label: Apparence
        type: select
        default: lien
        options:
          values:
            - value: bouton
              label: Bouton
            - value: lien
              label: Lien simple
      - name: nouvelOnglet
        label: Ouvrir dans un nouvel onglet
        type: boolean
        default: false

  blocs:
    type: block
    label: Contenu de la fenêtre
    list: true
    blockKey: type
    blocks:
      - name: texte
        label: Texte
        fields:
          - name: contenu
            label: Texte
            type: rich-text
            required: true
            options:
              format: markdown
              media: false
      - name: intertitre
        label: Intertitre
        fields:
          - name: titre
            label: Intertitre
            type: string
            required: true
          - name: logo
            label: Logo à gauche (facultatif)
            type: image
          - name: logoAlt
            label: Description du logo
            type: string
      - name: photo
        label: Photo
        fields:
          - name: image
            label: Photo
            type: image
            required: true
          - name: alt
            label: Description de la photo
            type: string
            required: true
          - name: legende
            label: Légende
            type: string

  icone:
    type: select
    label: Icône
    required: true
    options:
      values:
        - value: livre
          label: Livre ouvert
        - value: bulle
          label: Bulle de dialogue
        - value: famille
          label: Personnes
        - value: pousse
          label: Pousse
        - value: crayon
          label: Crayon
        - value: coeur
          label: Cœur
        - value: vent
          label: Souffle
        - value: etoile
          label: Étoile
        - value: calendrier
          label: Calendrier

  elementIllustre:
    type: object
    label: Élément
    fields:
      - name: icone
        component: icone
      - name: titre
        label: Titre
        type: string
        required: true
      - name: texte
        label: Texte
        type: text
        required: true
        description: "**gras**, ==surligné vert==, ++surligné orange++"

  blocsProgramme:
    type: block
    label: Contenu de la section
    list: true
    required: true
    blockKey: type
    blocks:
      - name: texte
        label: Texte
        fields:
          - name: contenu
            label: Texte
            type: text
            required: true
            description: "Paragraphes séparés par une ligne vide. **gras**, ==surligné vert==, ++surligné orange++"
      - name: intervenants
        label: Intervenants
        fields:
          - name: personnes
            label: Personnes
            type: object
            list: true
            required: true
            fields:
              - name: photo
                label: Photo
                type: image
                required: true
              - name: alt
                label: Description de la photo
                type: string
                required: true
              - name: nom
                label: Nom
                type: string
                required: true
              - name: presentation
                label: Présentation
                type: text
                required: true
                description: "**gras** pour mettre en valeur"
      - name: forces
        label: Liste illustrée (fond coloré)
        fields:
          - name: elements
            label: Éléments
            component: elementIllustre
            list: true
            required: true
      - name: etapes
        label: Étapes
        fields:
          - name: elements
            label: Étapes
            component: elementIllustre
            list: true
            required: true
      - name: illustration
        label: Illustration
        fields:
          - name: image
            label: Image
            type: image
            required: true
          - name: alt
            label: Description de l’image
            type: string
            required: true
      - name: restitution
        label: Invitation à la restitution
        fields:
          - name: titre
            label: Titre
            type: string
            required: true
            description: "La date et l’heure s’ajoutent seules : « Restitution le vendredi 26 février à 16h30. »"
          - name: precision
            label: Précision
            type: string

content:
  - name: programmes
    label: Programmes de stage
    description: "La carte et la fenêtre « Programme & infos » d’un stage. Une fiche par public (enfants, ados…) ; chaque session choisit sa fiche."
    type: collection
    path: src/content/programmes
    format: yaml-frontmatter
    filename:
      template: "{fields.nom}.md"
      field: create
    operations:
      rename: false
    view:
      fields: [nom]
      primary: nom
      sort: [nom]
    fields:
      - name: nom
        label: Nom de la fiche
        type: string
        required: true
        description: Visible seulement dans Page CMS, pour choisir la fiche d’une session.
      - name: titre
        label: Titre
        type: text
        required: true
        description: Sur deux lignes ; la deuxième ligne est surlignée dans la fenêtre.
      - name: accroche
        label: Accroche sous le titre
        type: string
        required: true
      - name: discipline
        label: Discipline
        type: string
        required: true
        description: "Exemple : Stage théâtre & arts plastiques"
      - name: ages
        label: Âges (étiquette)
        type: string
        required: true
        description: "Exemple : 6–11 ans"
      - name: agesDeA
        label: Âges en toutes lettres
        type: string
        required: true
        description: "Exemple : 6 à 11 ans"
      - name: etiquette
        label: Étiquette sur l’image de la carte
        type: text
        required: true
        description: "Exemple : **Ouvert à tous** · enfants des Petons et d’ailleurs"
      - name: description
        label: Description sur la carte
        type: text
        required: true
      - name: public
        label: Public (en haut de la fenêtre)
        type: text
        required: true
      - name: participants
        label: Participants
        type: string
        required: true
        description: "Exemple : enfants (affiché « 14 enfants »)"
      - name: participantsCarte
        label: Participants sur la carte (facultatif)
        type: string
        description: "Forme courte, par exemple « ados ». Vide = même mot."
      - name: encadrement
        label: Encadrement
        type: string
        required: true
        description: "Exemple : deux intervenants"
      - name: intro
        label: Introduction de la fenêtre
        type: text
        required: true
        description: "La première phrase en **gras** s’affiche en grand."
      - name: horaires
        label: Horaires
        type: string
        required: true
        description: "Exemple : 10h–17h"
      - name: accueil
        label: Accueil dès
        type: string
        required: true
        description: "Exemple : 9h"
      - name: jours
        label: Jours
        type: string
        required: true
        description: "Exemple : Du lundi au vendredi"
      - name: lieu
        label: Ville
        type: string
        required: true
      - name: restitution
        label: Heure de la restitution (dernier jour)
        type: string
        pattern:
          regex: "^\\d{1,2}h\\d{2}$"
          message: "Format attendu : 16h30"
      - name: sections
        label: Sections de la fenêtre
        type: object
        list: true
        required: true
        fields:
          - name: titre
            label: Titre de la section
            type: string
            required: true
          - name: icone
            component: icone
          - name: presentation
            label: Présentation
            type: select
            default: simple
            options:
              values:
                - value: simple
                  label: Simple
                - value: separee
                  label: Séparée par un trait
                - value: mise-en-avant
                  label: Mise en avant (fond orangé)
          - name: blocs
            component: blocsProgramme
      - name: sac
        label: Dans le sac (facultatif)
        type: object
        fields:
          - name: titre
            label: Titre
            type: string
            required: true
          - name: sousTitre
            label: Sous-titre
            type: string
          - name: objets
            label: Objets
            type: object
            list: true
            required: true
            fields:
              - name: image
                label: Dessin
                type: image
                required: true
              - name: texte
                label: Texte
                type: text
                required: true
      - name: inscription
        label: Pour s’inscrire
        type: text
        required: true

  - name: stages
    label: Stages de vacances
    description: Chaque session choisit son programme et fixe ses dates, son prix et ses places.
    type: collection
    path: src/content/stages
    format: yaml
    filename:
      template: "stage-{fields.debut}.yml"
      field: create
    operations:
      rename: false
    view:
      fields: [debut, programme, vacances, brouillon]
      primary: debut
      sort: [debut]
      default:
        sort: debut
        order: asc
    fields:
      - name: programme
        label: Programme
        type: reference
        required: true
        options:
          collection: programmes
          value: "{name}"
          label: "{fields.nom}"
          search: nom
      - name: debut
        label: Premier jour
        type: date
        required: true
      - name: fin
        label: Dernier jour (jour de la restitution)
        type: date
        required: true
      - name: vacances
        label: Vacances
        type: select
        required: true
        options:
          values:
            - value: toussaint
              label: Vacances de la Toussaint
            - value: noel
              label: Vacances de Noël
            - value: hiver
              label: Vacances d’hiver
            - value: printemps
              label: Vacances de printemps
            - value: ete
              label: Vacances d’été
      - name: image
        label: Image de la carte
        type: image
        required: true
        description: Affichée en fond pâle derrière le titre du stage.
      - name: cadrage
        label: Cadrage vertical de l’image (%)
        type: number
        default: 5
        description: "0 montre le haut de l’image, 100 le bas."
        options:
          min: 0
          max: 100
      - name: couleur
        label: Couleur de la carte
        type: select
        default: vert
        options:
          values:
            - value: vert
              label: Vert
            - value: menthe
              label: Menthe
            - value: orange
              label: Orange
            - value: bleu
              label: Bleu
      - name: prix
        label: Prix du stage (€)
        type: number
        required: true
        options:
          min: 1
      - name: prixFratrie
        label: Prix par enfant pour les fratries (€)
        type: number
        required: true
        options:
          min: 1
      - name: effectif
        label: Nombre maximum de participants
        type: number
        required: true
        options:
          min: 1
      - name: note
        label: Note sous les étiquettes (facultatif)
        type: string
      - name: brouillon
        label: Brouillon (masqué sur le site)
        type: boolean
        default: false

  - name: rendez-vous
    label: Prochains rendez-vous
    description: Portes ouvertes, fêtes, réunions… Affichés par date, du plus proche au plus lointain.
    type: collection
    path: src/content/rendez-vous
    format: yaml-frontmatter
    filename:
      template: "{fields.titre}.md"
      field: create
    operations:
      rename: false
    view:
      fields: [titre, date, brouillon]
      primary: titre
      sort: [date, titre]
      default:
        sort: date
        order: asc
    fields:
      - name: titre
        label: Titre
        type: string
        required: true
      - name: titreModale
        label: Titre dans la fenêtre (facultatif)
        type: text
        description: Passer à la ligne pour forcer un retour à la ligne. Laisser vide pour reprendre le titre.
      - name: date
        label: Date
        type: date
        required: true
      - name: heureDebut
        label: Heure de début
        type: string
        pattern:
          regex: "^\\d{1,2}h\\d{2}$"
          message: "Format attendu : 10h00"
      - name: heureFin
        label: Heure de fin
        type: string
        pattern:
          regex: "^\\d{1,2}h\\d{2}$"
          message: "Format attendu : 12h30"
      - name: mention
        label: Public ou condition
        type: string
        required: true
        description: "Exemple : Sans inscription · Entrée libre"
      - name: resume
        label: Résumé sur la carte
        type: text
        required: true
      - name: bouton
        label: Texte du bouton de la carte
        type: string
        default: Voir les détails
      - name: visuel
        component: visuel
      - name: surtitre
        label: Surtitre de la fenêtre
        type: string
        required: true
        description: "Exemple : Rencontrer l’école"
      - name: intro
        label: Introduction de la fenêtre
        type: text
      - name: pointsForts
        label: Points forts
        component: elementIllustre
        list: true
      - name: blocs
        component: blocs
      - name: encadre
        label: Encadré pratique
        type: object
        fields:
          - name: titre
            label: Texte en gras
            type: string
            required: true
          - name: texte
            label: Précision
            type: string
      - name: liens
        label: Liens en bas de la fenêtre
        component: lien
        list: true
      - name: brouillon
        label: Brouillon (masqué sur le site)
        type: boolean
        default: false

  - name: articles
    label: La vie de l’école
    description: Articles et retours sur les événements, du plus récent au plus ancien.
    type: collection
    path: src/content/articles
    format: yaml-frontmatter
    filename:
      template: "{fields.titre}.md"
      field: create
    operations:
      rename: false
    view:
      fields: [titre, date, brouillon]
      primary: titre
      sort: [date, titre]
      default:
        sort: date
        order: desc
    fields:
      - name: titre
        label: Titre sur la carte
        type: string
        required: true
      - name: titreModale
        label: Titre dans la fenêtre (facultatif)
        type: text
        description: Passer à la ligne pour forcer un retour à la ligne. Laisser vide pour reprendre le titre.
      - name: date
        label: Date de l’événement
        type: date
        required: true
        description: Sert seulement au classement, elle n’est pas affichée.
      - name: rubrique
        label: Rubrique
        type: string
        default: Retour sur un événement
      - name: repere
        label: Repère à côté de la rubrique
        type: string
        required: true
        description: "Exemple : Vote Éco-École"
      - name: resume
        label: Résumé sur la carte
        type: text
        required: true
      - name: visuel
        component: visuel
      - name: surtitre
        label: Surtitre de la fenêtre
        type: string
        required: true
        description: "Exemple : Éco-École · Septembre 2026"
      - name: intro
        label: Introduction (affichée en gras)
        type: text
        required: true
      - name: blocs
        component: blocs
      - name: liens
        label: Liens en bas de la fenêtre
        component: lien
        list: true
      - name: brouillon
        label: Brouillon (masqué sur le site)
        type: boolean
        default: false
```

- [ ] **Étape 4 : vérifier**

Lancer : `bun run check`
Résultat attendu : `0 fail`. Si le test d'alignement signale un écart, corriger `.pages.yml`. Ne modifier `src/content/schemas.ts` que si le schéma est faux.

- [ ] **Étape 5 : committer**

```bash
git add .pages.yml tests/pages-cms.test.ts
git commit -m "Ajoute la configuration Page CMS des actualités"
```

---

### Tâche 8 : documentation, nettoyage et vérification finale

**Fichiers :**
- Créer : `docs/page-cms.md`
- Modifier : `AGENTS.md`
- Supprimer : `tests/migration-actualites.test.ts`, `tests/fixtures/actualites-avant.html`

- [ ] **Étape 1 : écrire le guide**

Créer `docs/page-cms.md` :

```markdown
# Modifier les actualités avec Page CMS

Page CMS est un éditeur en ligne pour modifier les **programmes et sessions de stages de vacances**, les **prochains rendez-vous** et les **articles de « La vie de l’école »** de la page Actualités, sans toucher au code.

Adresse : **https://app.pagescms.org**

## Publier une modification

1. Se connecter (avec GitHub, ou avec le lien reçu par e-mail).
2. Ouvrir **pit-anjou / petons-website**, branche **main**.
3. Choisir une rubrique, modifier ou ajouter une entrée, puis cliquer sur **Save**.
4. La page est en ligne **1 à 2 minutes** plus tard.

Pour préparer une entrée sans la montrer, cocher **Brouillon** : elle reste enregistrée mais n’apparaît pas sur le site.

**Si la modification n’apparaît pas après 5 minutes**, la mise en ligne a échoué : le site garde alors sa version précédente. Prévenir Philippe, en indiquant ce qui a été modifié.

## Programmes de stage

Un **programme** contient tout ce qui ne change pas d’une session à l’autre : le titre, la description de la carte et la fenêtre « Programme & infos ». Il y a **une fiche par public** : « Histoires & Objets Inventés — enfants » et « … — adolescents » sont deux fiches distinctes. Un texte commun aux deux se corrige dans les deux fiches.

- Pour créer un nouveau programme, le plus simple est de **dupliquer** une fiche existante, puis de l’adapter.
- La fenêtre se compose de **sections** (titre et icône), elles-mêmes composées de **blocs** : *Texte*, *Intervenants*, *Liste illustrée* (comme « Trois forces à éveiller »), *Étapes*, *Illustration* et *Invitation à la restitution*. La partie « En pratique » se remplit seule à partir des horaires, du sac et du texte d’inscription.
- Mise en forme dans les textes : `**gras**`, `==surligné vert==` et `++surligné orange++`.

## Sessions de stage

Chaque **session** choisit son programme, puis fixe ses dates, ses vacances, l’image et la couleur de sa carte, son prix et son nombre de places.

- Le **dernier jour** est celui de la restitution aux familles, à l’heure indiquée dans le programme.
- Le **cadrage** déplace l’image vers le haut (0) ou vers le bas (100).

## Prochains rendez-vous et articles

- La **carte** affiche le titre, la date ou le repère, le résumé et le visuel.
- La **fenêtre** s’ouvre au clic. Elle contient un surtitre, une introduction, puis des **blocs** à empiler dans l’ordre voulu : *Texte*, *Intertitre* (avec un logo facultatif) et *Photo* (avec description et légende).
- Les rendez-vous sont classés par date. Les articles sont classés du plus récent au plus ancien, selon leur **date de l’événement** (non affichée).
- Pour un rendez-vous passé, on peut le supprimer, ou en faire un article « Retour sur un événement ».

## Images

- Elles sont rangées dans le dossier **actualites** de la médiathèque.
- Préférer le format **.webp** ou **.jpg**, de **1 600 px de large au maximum** : une photo de téléphone non réduite ralentit la page.
- Toujours remplir la **description** : elle est lue aux personnes qui ne voient pas l’image.
- Ne pas supprimer une image de la médiathèque tant qu’une actualité l’utilise : la mise en ligne échouerait.

## Ce qui ne se modifie pas ici

- Le bloc « Vie de l’école » de la **page d’accueil** : il pointe vers le stage de février et l’article Éco-École. Si l’un d’eux est supprimé, prévenir Philippe pour mettre l’accueil à jour.
- L’encart « Inscriptions ouvertes » (places disponibles), les tarifs, les coordonnées et les autres pages.

## Pour l’administrateur

1. Sur https://app.pagescms.org, se connecter avec le compte GitHub **pit-anjou**, puis installer la **GitHub App Pages CMS** sur le seul dépôt **petons-website**.
2. Ouvrir le dépôt, branche **main**. Les quatre rubriques doivent apparaître.
3. Inviter les éditeurs par e-mail : **Settings → Collaborators**. Ils n’ont pas besoin de compte GitHub. Ils peuvent modifier le contenu et les images, mais pas la configuration.
4. Dans Vercel, garder actives les **notifications d’échec de déploiement** : c’est le seul signal quand une modification ne passe pas.
5. Chaque champ est décrit deux fois, dans `src/content/schemas.ts` et dans `.pages.yml`. `bun test` vérifie que les deux correspondent.
```

- [ ] **Étape 2 : compléter AGENTS.md**

Dans le tableau « Où modifier quoi » d'`AGENTS.md`, ajouter après la ligne « Le texte, les images ou la mise en page d'une page » :

```markdown
| Les programmes et sessions de stage, rendez-vous et articles de la page Actualités | Page CMS (voir `docs/page-cms.md`) ou les fichiers de `src/content/programmes/`, `src/content/stages/`, `src/content/rendez-vous/`, `src/content/articles/` |
| La mise en page des fenêtres de stage (types de blocs, « En pratique ») | `src/components/actualites/StageDialog.astro`, `ProgrammeSection.astro` |
```

Puis ajouter cette section avant « ## Ajouter une nouvelle page » :

```markdown
## Actualités et Page CMS

1. **Ne pas réécrire en HTML les stages, rendez-vous ou articles** dans `src/pages/actualites-petons.astro` : ils viennent des fichiers de `src/content/` et s’affichent via les composants de `src/components/actualites/`.
2. **Un nouveau champ se déclare à deux endroits** : `src/content/schemas.ts` et `.pages.yml`. Sinon, Page CMS l’efface au prochain enregistrement. `bun test` signale tout écart.
3. **Les images des actualités vont dans `public/assets/img/actualites/`** et sont référencées en `assets/img/actualites/…`.
4. **Ne pas renommer** `stage-fevrier-2027.yml` ni `eco-ecole-solidarites.md` : la page d’accueil pointe vers ces ancres.
5. Vérifier avec `bun run check` (build puis tests) au lieu de `bun run build` seul.
```

- [ ] **Étape 3 : supprimer le test temporaire de migration**

```bash
git rm tests/migration-actualites.test.ts tests/fixtures/actualites-avant.html
```

- [ ] **Étape 4 : vérification finale**

Lancer : `bun run check`
Résultat attendu : build sans `[ERROR]`. Tests : `0 fail` dans `tests/outils`, `tests/dates.test.ts`, `tests/markdown.test.ts`, `tests/actualites.test.ts`, `tests/dimensions-image.test.ts`, `tests/contenus.test.ts`, `tests/page-actualites.test.ts` et `tests/pages-cms.test.ts`.

Contrôle visuel complet avec les préviews `actualites-avant` et `actualites-apres`, en bureau puis en mobile :
- toute la page Actualités défile de façon identique, hormis les changements assumés 1 à 6 de la section « Décisions » ;
- chaque fenêtre (4 stages, 2 rendez-vous, 2 articles) s'ouvre, se ferme avec la croix, avec Échap et par un clic hors de la fenêtre, et la page ne défile pas pendant qu'elle est ouverte ;
- `index.html` → « Découvrir le stage » ouvre la fenêtre du stage de février, et « Lire l'article » ouvre celle de l'article Éco-École ;
- la console du navigateur ne montre aucune erreur (`read_console_messages`).

Faire une capture d'écran de chaque section en mobile pour la pull request.

- [ ] **Étape 5 : nettoyer la copie de comparaison**

```bash
git worktree remove ../petons-avant
```

Retirer de `.claude/launch.json` les configurations `actualites-avant` et `actualites-apres`.

- [ ] **Étape 6 : committer et proposer la pull request**

```bash
git add docs/page-cms.md AGENTS.md
git commit -m "Documente l’édition des actualités avec Page CMS"
```

**Demander à Philippe avant de pousser.** Ensuite, pousser la branche et ouvrir la pull request vers `main` (sans la fusionner) avec : un résumé, la liste des changements visibles acceptés, les captures en mobile et les étapes de la tâche 9. **La fusion attend la recette de la tâche 9.**

---

### Tâche 9 (manuelle, par l'administrateur du dépôt) : recette sur la branche, puis fusion

Page CMS enregistre toujours dans GitHub, sur la branche choisie dans son interface, jamais sur l'ordinateur. La recette se fait donc **sur la branche de la pull request**, avant la fusion : le site en ligne n'est pas touché, et Vercel fournit une adresse de préview de la branche.

- [ ] Suivre les étapes 1 et 2 de « Pour l'administrateur » de `docs/page-cms.md`, mais ouvrir la **branche de la pull request** au lieu de `main`. Les quatre rubriques doivent apparaître.
- [ ] **Enregistrement sans modification :** ouvrir chaque type de fiche (un programme, une session, un rendez-vous, un article), puis l'enregistrer sans rien changer. Sur GitHub, le diff de chaque commit ne doit contenir que des changements de forme (ordre des clés, guillemets). Aucun champ ne doit disparaître, et les `==…==` et `++…++` doivent rester intacts.
- [ ] **Création :** dupliquer le programme enfants, renommer la copie, puis créer une session de test qui la cite, avec **Brouillon** coché. Vérifier que le déploiement de préview Vercel réussit et que la session n'apparaît pas. Décocher **Brouillon** : la carte et la fenêtre apparaissent sur l'adresse de préview.
- [ ] **En local :** `git pull`, puis `bun run dev` et ouvrir http://localhost:4321/actualites-petons.html. Le rendu doit être le même que sur l'adresse de préview.
- [ ] Supprimer la session et le programme de test depuis Page CMS, puis vérifier avec `git pull` et `bun run check` que la branche est propre.
- [ ] Fusionner la pull request. Dans Page CMS, revenir sur la branche `main`, puis inviter les éditeurs par e-mail et leur transmettre `docs/page-cms.md`.

## Hors périmètre (suites possibles)

- Alimenter le bloc « Vie de l'école » de la page d'accueil avec le prochain stage et le dernier article (aujourd'hui en dur dans `index.astro`).
- Rendre éditables les places disponibles, les tarifs et les coordonnées.
- Alléger les images de stage (PNG de 1 à 2 Mo chacune ; celles des cartes sont affichées à 28 % d'opacité) en les passant en WebP.
- Masquer automatiquement les rendez-vous passés (cela demanderait une reconstruction planifiée du site).
- Lancer `bun test` dans une GitHub Action à chaque commit, y compris ceux de Page CMS.
