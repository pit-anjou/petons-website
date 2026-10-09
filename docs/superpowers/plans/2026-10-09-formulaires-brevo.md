# Formulaires envoyés à Brevo — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les formulaires de contact, d'inscription et de lettre d'information envoient leurs données à Brevo via une route serveur Vercel, avec repli sur le brouillon `mailto:` existant.

**Architecture:** L'adaptateur `@astrojs/vercel` ajoute une seule route à la demande (`src/pages/api/formulaire.ts`) ; toutes les pages restent statiques. La route est une coquille qui appelle `traiterRequete()` (`src/lib/formulaires/requete.ts`), testable sans Astro ni réseau : contrôles (méthode, origine, taille, configuration, anti-spam, validation) puis `traiter()` (`traitement.ts`) qui enchaîne les appels du client Brevo (`src/lib/brevo.ts`). Côté navigateur, un composant commun (`FormSubmitScript.astro`) envoie le formulaire et affiche le succès ; chaque page garde son brouillon `mailto:` comme repli.

**Tech Stack:** Astro 7.3 (sortie statique + `@astrojs/vercel`), `astro:env`, `astro/zod` (Zod 4), Bun (`bun test`, `node-html-parser`), API Brevo v3.

**Spec:** `docs/superpowers/specs/2026-10-09-formulaires-brevo-design.md`

## Global Constraints

- Lire `AGENTS.md` avant toute modification d'un `.astro`. En particulier :
  - pas d'accolades `{` ou `}` dans le texte des `.astro` (écrire `&#123;` et `&#125;`) ;
  - toujours `<style is:inline>` et `<script is:inline>` ;
  - liens internes sous la forme `page.html`.
- Textes visibles en français, apostrophe typographique `’` comme dans le reste du site.
- Pages publiées : les adresses `*.html` ne changent pas (`build.format: 'file'` conservé).
- `BREVO_API_KEY` ne figure jamais dans le dépôt ni dans le HTML ; seulement dans `.env` (non versionné) et dans les variables Vercel.
- Les journaux ne contiennent jamais le contenu des champs : seulement `formulaire`, `etape`, `statut`.
- Réponses de la route : `{ ok: true }` (200) ou `{ ok: false }` (400, 403, 405, 413, 502, 503), avec `cache-control: no-store`.
- Anti-spam : délai minimal 3000 ms ; spam → 200 `{ ok: true }` sans aucun envoi.
- Taille maximale du corps : 16384 octets. Délai de chaque appel Brevo : 8000 ms.
- Limites des champs = `maxlength` actuels : contact `name` 150, `email` 254, `phone` 35, `organisation` 150, `message` 3000 ; inscription `parentName` 150, `email` 254, `phone` 35, `schoolStart` 100, `message` 2500 ; lettre `email` 254.
- Durée de conservation annoncée : 3 ans (validée par l'école le 2026-10-09).
- Vérification finale de chaque tâche qui touche le build : `bun run check` (build puis tests).
- TypeScript simple, sans Effect TS (le dépôt ne l'utilise pas).
- Messages de commit en français, à l'infinitif présent comme l'historique (« Ajoute… », « Vérifie… »), terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Carte des fichiers

| Fichier | Statut | Responsabilité |
| --- | --- | --- |
| `astro.config.mjs` | modifié | Adaptateur Vercel, schéma `astro:env` |
| `vercel.json` | modifié | Retrait de `outputDirectory` |
| `Dockerfile.vercel` | modifié | Chemin des pages statiques + avertissement |
| `.gitignore`, `.env.example` | modifié / créé | Secrets locaux |
| `tests/outils/html.ts` | modifié | Constante `DOSSIER_PAGES` (emplacement des pages construites) |
| `tests/page-actualites.test.ts` | modifié | Utilise `DOSSIER_PAGES` |
| `src/data/brevo.ts` | créé | Numéros Brevo, adresse de l'école, `estConfiguree()` |
| `src/lib/markdown.ts` | modifié | Exporte `echapper()` |
| `src/lib/formulaires/validation.ts` | créé | Schémas Zod, `valider()`, `estSpam()`, `SUJETS`, `AGES`, `LIMITES` |
| `src/lib/brevo.ts` | créé | Client HTTP Brevo |
| `src/lib/formulaires/traitement.ts` | créé | Enchaînement des appels, règle « notification indispensable » |
| `src/lib/formulaires/requete.ts` | créé | `traiterRequete()` : contrôles et réponse HTTP |
| `src/pages/api/formulaire.ts` | créé | Route Astro (coquille) |
| `src/components/FormSubmitScript.astro` | créé | Script et styles communs des formulaires |
| `src/pages/contact-petons.astro` | modifié | Formulaire contact |
| `src/pages/inscriptions-petons.astro` | modifié | Formulaire inscription |
| `src/pages/actualites-petons.astro` | modifié | Formulaire lettre |
| `src/pages/lettre-confirmee.astro` | créé | Page après double confirmation |
| `tests/formulaires-*.test.ts` | créé | Tests |
| `docs/formulaires-brevo.md`, `AGENTS.md` | créé / modifié | Documentation |

---

### Task 1 : Adaptateur Vercel et route qui répond 503

**Files:**
- Modify: `package.json`, `bun.lock` (via `bun add`)
- Modify: `astro.config.mjs`
- Modify: `vercel.json`
- Modify: `Dockerfile.vercel`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `tests/outils/html.ts`
- Modify: `tests/page-actualites.test.ts`
- Create: `src/pages/api/formulaire.ts` (version provisoire)

**Interfaces:**
- Produces: `DOSSIER_PAGES: string` exporté par `tests/outils/html.ts` : dossier où le build écrit les pages `.html`. Les tâches de tests de pages l'utilisent.
- Produces: la variable serveur `BREVO_API_KEY`, lue via `import { BREVO_API_KEY } from 'astro:env/server'` (type `string | undefined`).

- [ ] **Step 1 : Installer les dépendances et l'adaptateur**

```bash
bun install
bun add @astrojs/vercel
```

Vérifier dans `package.json` que la version ajoutée accepte Astro 7 : `bun pm ls | grep -i astro` ne doit afficher aucun avertissement de dépendance non satisfaite (`peer`). En cas d'incompatibilité, s'arrêter et le signaler, sans forcer la version.

- [ ] **Step 2 : Configurer Astro**

Remplacer `astro.config.mjs` par :

```js
// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Conserve les URL actuelles : /chenilles-petons.html, /index.html…
  build: { format: 'file' },
  // Toutes les pages restent statiques ; seule src/pages/api/formulaire.ts tourne sur Vercel (prerender = false).
  adapter: vercel(),
  env: {
    schema: {
      // Clé API Brevo : variables d'environnement Vercel, ou fichier .env en local. Voir docs/formulaires-brevo.md.
      BREVO_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
```

Si `import vercel from '@astrojs/vercel'` échoue au build, lire le README du paquet installé (`node_modules/@astrojs/vercel/README.md`) et utiliser le point d'entrée qu'il indique.

- [ ] **Step 3 : Écrire la route provisoire**

Créer `src/pages/api/formulaire.ts` :

```ts
// Route des formulaires du site (voir docs/formulaires-brevo.md). Version provisoire : toujours indisponible.
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = () =>
  Response.json({ ok: false }, { status: 503, headers: { 'cache-control': 'no-store' } });
```

- [ ] **Step 4 : Construire et repérer les pages**

```bash
bun run build
find dist .vercel/output -name 'contact-petons.html' 2>/dev/null
find .vercel/output/functions -maxdepth 3 2>/dev/null | head
```

Résultat attendu : le build se termine sans `[ERROR]` ; `contact-petons.html` existe quelque part (par exemple `dist/client/` ou `.vercel/output/static/`) ; une fonction existe sous `.vercel/output/functions`. Noter le dossier qui contient `contact-petons.html` dans `dist` : c'est `DOSSIER_PAGES` (par exemple `dist/client` ou `dist`).

- [ ] **Step 5 : Centraliser l'emplacement des pages dans les tests**

Dans `tests/outils/html.ts`, ajouter après l'import :

```ts
/** Dossier où « bun run build » écrit les pages .html (il change avec l'adaptateur Vercel). */
export const DOSSIER_PAGES = 'dist/client';
```

Remplacer `'dist/client'` par la valeur notée au Step 4. Puis, dans `tests/page-actualites.test.ts` :

- remplacer l'import par `import { chargerHtml, DOSSIER_PAGES } from './outils/html';` ;
- remplacer `chargerHtml('dist/actualites-petons.html')` par ``chargerHtml(`${DOSSIER_PAGES}/actualites-petons.html`)`` ;
- remplacer `scanSync('dist')` par `scanSync(DOSSIER_PAGES)` ;
- remplacer ``chargerHtml(`dist/${fichier}`)`` par ``chargerHtml(`${DOSSIER_PAGES}/${fichier}`)``.

Vérifier qu'il ne reste aucun chemin `dist` en dur dans les tests :

```bash
grep -rn "'dist\|\`dist" tests
```

Résultat attendu : seule la ligne `DOSSIER_PAGES` apparaît.

- [ ] **Step 6 : Mettre à jour Vercel, Docker et Git**

`vercel.json` : supprimer la ligne `"outputDirectory": "dist"` (l'adaptateur produit `.vercel/output`, que Vercel lit directement), ainsi que la virgule devenue en trop.

`Dockerfile.vercel` : remplacer la ligne `COPY --from=build /app/dist /usr/share/nginx/html` par la ligne ci-dessous, en adaptant le chemin à `DOSSIER_PAGES`, et ajouter le commentaire :

```dockerfile
# nginx ne sert que les pages statiques : sans la route /api/formulaire, les formulaires
# basculent sur leur brouillon de messagerie. Voir docs/formulaires-brevo.md.
COPY --from=build /app/dist/client /usr/share/nginx/html
```

`.gitignore` : ajouter les lignes `.env` et `.vercel/`.

Créer `.env.example` :

```bash
# Copier ce fichier en .env pour tester les formulaires en local (bun run dev).
# Clé API Brevo dédiée au site : voir docs/formulaires-brevo.md.
BREVO_API_KEY=
```

- [ ] **Step 7 : Vérifier**

```bash
bun run check
bun run dev
```

Avec le serveur de développement lancé, dans un autre terminal :

```bash
curl -s -i -X POST http://localhost:4321/api/formulaire | head -5
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321/contact-petons.html
```

Résultats attendus : `bun run check` réussit ; la route répond `503` avec `{"ok":false}` ; la page répond `200`. Arrêter le serveur.

- [ ] **Step 8 : Commit**

```bash
git add package.json bun.lock astro.config.mjs vercel.json Dockerfile.vercel .gitignore .env.example tests/outils/html.ts tests/page-actualites.test.ts src/pages/api/formulaire.ts
git commit -m "Ajoute l’adaptateur Vercel et la route des formulaires

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : Configuration Brevo et validation des formulaires

**Files:**
- Create: `src/data/brevo.ts`
- Create: `src/lib/formulaires/validation.ts`
- Test: `tests/formulaires-validation.test.ts`

**Interfaces:**
- Consumes: `contact.email` de `src/data/site.ts`.
- Produces (`src/data/brevo.ts`) :
  - `interface ConfigBrevo { ecole: { email: string; nom: string }; listes: { contact: number; inscription: number; lettre: number }; modeles: { notificationContact: number; accuseContact: number; notificationInscription: number; accuseInscription: number; confirmationLettre: number }; pageConfirmationLettre: string }`
  - `const brevo: ConfigBrevo`
  - `estConfiguree(config: ConfigBrevo): boolean`
- Produces (`src/lib/formulaires/validation.ts`) :
  - `type Formulaire = 'contact' | 'inscription' | 'lettre'`
  - `SUJETS: Record<Sujet, string>`, `type Sujet`, `AGES: readonly ['3–6 ans — Les Chenilles', '6–12 ans — Les Papillons']`
  - `LIMITES` (longueurs par formulaire et par champ)
  - `type Demande = { formulaire: 'contact'; champs: ChampsContact } | { formulaire: 'inscription'; champs: ChampsInscription } | { formulaire: 'lettre'; champs: ChampsLettre }`
  - `ChampsContact = { name; email; phone; organisation; subject: Sujet; message; newsletter: boolean }` (chaînes sauf mention)
  - `ChampsInscription = { parentName; email; phone; schoolStart; childAge: '' | (typeof AGES)[number]; message; newsletter: boolean }`
  - `ChampsLettre = { email }`
  - `valider(formulaire: unknown, champs: unknown): Demande | null`
  - `estSpam(piege: unknown, ouvertLe: unknown, maintenant: number): boolean`
  - `DELAI_MINIMAL_MS = 3000`

- [ ] **Step 1 : Écrire les tests**

Créer `tests/formulaires-validation.test.ts` :

```ts
import { describe, expect, test } from 'bun:test';
import { brevo, estConfiguree, type ConfigBrevo } from '../src/data/brevo';
import { AGES, DELAI_MINIMAL_MS, estSpam, LIMITES, SUJETS, valider } from '../src/lib/formulaires/validation';

const contact = { name: ' Camille Martin ', email: 'camille@exemple.fr', phone: '', organisation: '', subject: 'visite', message: 'Bonjour\r\nUne visite ?', newsletter: false };
const inscription = { parentName: 'Camille Martin', email: 'camille@exemple.fr', phone: '06 00 00 00 00', schoolStart: 'septembre 2027', childAge: AGES[0], message: '', newsletter: true };

describe('valider', () => {
  test('nettoie un formulaire de contact valide', () => {
    expect(valider('contact', contact)).toEqual({
      formulaire: 'contact',
      champs: { name: 'Camille Martin', email: 'camille@exemple.fr', phone: '', organisation: '', subject: 'visite', message: 'Bonjour\nUne visite ?', newsletter: false },
    });
  });

  test('accepte une inscription valide', () => {
    expect(valider('inscription', inscription)?.champs).toEqual(inscription);
  });

  test('accepte une demande de lettre', () => {
    expect(valider('lettre', { email: 'a@b.fr' })).toEqual({ formulaire: 'lettre', champs: { email: 'a@b.fr' } });
  });

  test('les champs facultatifs absents deviennent vides, la case lettre devient fausse', () => {
    expect(valider('inscription', { parentName: 'A', email: 'a@b.fr' })?.champs).toEqual({
      parentName: 'A', email: 'a@b.fr', phone: '', schoolStart: '', childAge: '', message: '', newsletter: false,
    });
  });

  test.each([
    ['formulaire inconnu', 'autre', contact],
    ['champs absents', 'contact', undefined],
    ['nom vide', 'contact', { ...contact, name: '   ' }],
    ['e-mail invalide', 'contact', { ...contact, email: 'pas-un-email' }],
    ['sujet hors liste', 'contact', { ...contact, subject: 'piratage' }],
    ['message vide', 'contact', { ...contact, message: '' }],
    ['message trop long', 'contact', { ...contact, message: 'a'.repeat(LIMITES.contact.message + 1) }],
    ['ambiance hors liste', 'inscription', { ...inscription, childAge: '0–3 ans' }],
    ['case lettre non booléenne', 'inscription', { ...inscription, newsletter: 'oui' }],
    ['e-mail trop long', 'lettre', { email: `${'a'.repeat(250)}@b.fr` }],
  ])('refuse : %s', (_cas, formulaire, champs) => {
    expect(valider(formulaire, champs)).toBeNull();
  });

  test('un retour à la ligne Windows compte pour un caractère', () => {
    const message = 'a\r\n'.repeat(LIMITES.contact.message / 2);
    expect(valider('contact', { ...contact, message })).not.toBeNull();
  });

  test('les sujets sont ceux du menu de la page contact', () => {
    expect(Object.keys(SUJETS)).toEqual(['information', 'visite', 'vacances', 'candidature', 'stage', 'partenariat', 'don', 'mecenat', 'autre']);
  });
});

describe('estSpam', () => {
  const maintenant = 1_000_000;
  test('laisse passer un humain', () => expect(estSpam('', maintenant - DELAI_MINIMAL_MS, maintenant)).toBe(false));
  test('piège rempli', () => expect(estSpam('http://spam', maintenant - 60_000, maintenant)).toBe(true));
  test('envoi trop rapide', () => expect(estSpam('', maintenant - DELAI_MINIMAL_MS + 1, maintenant)).toBe(true));
  test('heure d’ouverture absente', () => expect(estSpam('', undefined, maintenant)).toBe(true));
  test('heure d’ouverture invalide', () => expect(estSpam('', 'hier', maintenant)).toBe(true));
  test('heure d’ouverture dans le futur', () => expect(estSpam('', maintenant + 10_000, maintenant)).toBe(true));
});

describe('configuration Brevo', () => {
  const complete: ConfigBrevo = {
    ...brevo,
    listes: { contact: 1, inscription: 2, lettre: 3 },
    modeles: { notificationContact: 1, accuseContact: 2, notificationInscription: 3, accuseInscription: 4, confirmationLettre: 5 },
  };
  test('complète quand tous les numéros sont renseignés', () => expect(estConfiguree(complete)).toBe(true));
  test('incomplète tant qu’un numéro vaut 0', () => expect(estConfiguree({ ...complete, listes: { ...complete.listes, lettre: 0 } })).toBe(false));
  test('l’école reçoit les notifications à l’adresse du site', () => expect(brevo.ecole.email).toBe('contact@lespetons.fr'));
});
```

- [ ] **Step 2 : Lancer les tests et constater l'échec**

Run: `bun test tests/formulaires-validation.test.ts`
Expected: FAIL, modules `../src/data/brevo` et `../src/lib/formulaires/validation` introuvables.

- [ ] **Step 3 : Écrire la configuration**

Créer `src/data/brevo.ts` :

```ts
// Numéros Brevo utilisés par les formulaires du site. Guide : docs/formulaires-brevo.md.
// Un numéro à 0 signifie « pas encore configuré » : la route répond alors 503
// et les formulaires restent en mode messagerie.
import { contact } from './site';

export interface ConfigBrevo {
  /** Destinataire des notifications. */
  readonly ecole: { readonly email: string; readonly nom: string };
  readonly listes: { readonly contact: number; readonly inscription: number; readonly lettre: number };
  readonly modeles: {
    readonly notificationContact: number;
    readonly accuseContact: number;
    readonly notificationInscription: number;
    readonly accuseInscription: number;
    /** Modèle de double confirmation : il doit contenir {{ params.DOIurl }}. */
    readonly confirmationLettre: number;
  };
  /** Page où Brevo renvoie après le clic de confirmation (relative à la racine du site). */
  readonly pageConfirmationLettre: string;
}

export const brevo: ConfigBrevo = {
  ecole: { email: contact.email, nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 0, inscription: 0, lettre: 0 },
  modeles: { notificationContact: 0, accuseContact: 0, notificationInscription: 0, accuseInscription: 0, confirmationLettre: 0 },
  pageConfirmationLettre: 'lettre-confirmee.html',
};

/** Vrai quand chaque liste et chaque modèle a un numéro Brevo. */
export const estConfiguree = (config: ConfigBrevo): boolean =>
  [...Object.values(config.listes), ...Object.values(config.modeles)].every((numero) => Number.isInteger(numero) && numero > 0);
```

- [ ] **Step 4 : Écrire la validation**

Créer `src/lib/formulaires/validation.ts` :

```ts
// Validation des formulaires reçus par /api/formulaire. Ne jamais faire confiance au navigateur :
// chaque champ est nettoyé, borné et comparé aux valeurs permises.
import { z } from 'astro/zod';

export type Formulaire = 'contact' | 'inscription' | 'lettre';

/** Sujets du menu de contact-petons.astro, avec leur libellé. */
export const SUJETS = {
  information: 'Une information sur l’école',
  visite: 'Organiser une visite',
  vacances: 'Un stage de vacances pour mon enfant',
  candidature: 'Postuler dans l’équipe',
  stage: 'Demander un stage',
  partenariat: 'Proposer un partenariat',
  don: 'Soutenir par un don',
  mecenat: 'Devenir mécène',
  autre: 'Une autre demande',
} as const;
export type Sujet = keyof typeof SUJETS;

/** Valeurs des boutons radio de inscriptions-petons.astro. */
export const AGES = ['3–6 ans — Les Chenilles', '6–12 ans — Les Papillons'] as const;

/** Longueurs maximales : les mêmes que les maxlength des pages (vérifié par tests/formulaires-pages.test.ts). */
export const LIMITES = {
  contact: { name: 150, email: 254, phone: 35, organisation: 150, message: 3000 },
  inscription: { parentName: 150, email: 254, phone: 35, schoolStart: 100, message: 2500 },
  lettre: { email: 254 },
} as const;

/** Délai minimal entre l'ouverture de la page et l'envoi, en millisecondes. */
export const DELAI_MINIMAL_MS = 3000;

const nettoyer = (valeur: unknown): unknown =>
  valeur === undefined || valeur === null ? '' : typeof valeur === 'string' ? valeur.replace(/\r\n?/g, '\n').trim() : valeur;

const facultatif = (max: number) => z.preprocess(nettoyer, z.string().max(max));
const requis = (max: number) => z.preprocess(nettoyer, z.string().min(1).max(max));
const email = (max: number) => z.preprocess(nettoyer, z.email().max(max));
const caseLettre = z.boolean().default(false);

const schemas = {
  contact: z.object({
    name: requis(LIMITES.contact.name),
    email: email(LIMITES.contact.email),
    phone: facultatif(LIMITES.contact.phone),
    organisation: facultatif(LIMITES.contact.organisation),
    subject: z.enum(Object.keys(SUJETS) as [Sujet, ...Sujet[]]),
    message: requis(LIMITES.contact.message),
    newsletter: caseLettre,
  }),
  inscription: z.object({
    parentName: requis(LIMITES.inscription.parentName),
    email: email(LIMITES.inscription.email),
    phone: facultatif(LIMITES.inscription.phone),
    schoolStart: facultatif(LIMITES.inscription.schoolStart),
    childAge: z.preprocess(nettoyer, z.union([z.enum(AGES), z.literal('')])),
    message: facultatif(LIMITES.inscription.message),
    newsletter: caseLettre,
  }),
  lettre: z.object({ email: email(LIMITES.lettre.email) }),
};

export type ChampsContact = z.output<typeof schemas.contact>;
export type ChampsInscription = z.output<typeof schemas.inscription>;
export type ChampsLettre = z.output<typeof schemas.lettre>;
export type Demande =
  | { formulaire: 'contact'; champs: ChampsContact }
  | { formulaire: 'inscription'; champs: ChampsInscription }
  | { formulaire: 'lettre'; champs: ChampsLettre };

const estFormulaire = (valeur: unknown): valeur is Formulaire => typeof valeur === 'string' && Object.hasOwn(schemas, valeur);

/** Données nettoyées, ou null si le formulaire est inconnu ou un champ invalide. */
export const valider = (formulaire: unknown, champs: unknown): Demande | null => {
  if (!estFormulaire(formulaire)) return null;
  const resultat = schemas[formulaire].safeParse(champs);
  return resultat.success ? ({ formulaire, champs: resultat.data } as Demande) : null;
};

/** Vrai si le champ piège est rempli, ou si l'heure d'ouverture est absente, invalide ou trop récente. */
export const estSpam = (piege: unknown, ouvertLe: unknown, maintenant: number): boolean => {
  if (typeof piege === 'string' && piege !== '') return true;
  if (typeof ouvertLe !== 'number' || !Number.isFinite(ouvertLe)) return true;
  return maintenant - ouvertLe < DELAI_MINIMAL_MS;
};
```

- [ ] **Step 5 : Lancer les tests**

Run: `bun test tests/formulaires-validation.test.ts`
Expected: PASS. Si `z.email()` ou `z.preprocess` n'existent pas dans la version de Zod fournie par `astro/zod`, consulter `node_modules/zod/package.json` (version) et utiliser l'équivalent documenté (`z.string().email()` en Zod 3), sans changer le comportement testé.

- [ ] **Step 6 : Commit**

```bash
git add src/data/brevo.ts src/lib/formulaires/validation.ts tests/formulaires-validation.test.ts
git commit -m "Valide les champs des formulaires et repère le spam

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : Client Brevo

**Files:**
- Create: `src/lib/brevo.ts`
- Test: `tests/brevo.test.ts`

**Interfaces:**
- Produces :
  - `type Fetch = (url: string, init: RequestInit) => Promise<Response>`
  - `class ErreurBrevo extends Error { readonly operation: string; readonly statut: number | null }`
  - `interface ClientBrevo { enregistrerContact(contact: { email: string; attributs: Record<string, string>; listes: number[] }): Promise<void>; envoyerModele(envoi: { modele: number; a: Destinataire; repondreA?: Destinataire; params: Record<string, string> }): Promise<void>; demanderConfirmation(demande: { email: string; listes: number[]; modele: number; redirection: string }): Promise<void> }`
  - `interface Destinataire { email: string; nom?: string }`
  - `creerClientBrevo(options: { cleApi: string; fetch: Fetch; delaiMs?: number }): ClientBrevo` (`delaiMs` vaut 8000 par défaut)

- [ ] **Step 1 : Écrire les tests**

Créer `tests/brevo.test.ts` :

```ts
import { expect, test } from 'bun:test';
import { creerClientBrevo, ErreurBrevo, type Fetch } from '../src/lib/brevo';

const enregistreur = (reponse: () => Promise<Response> = async () => new Response(null, { status: 201 })) => {
  const appels: { url: string; init: RequestInit }[] = [];
  const fetch: Fetch = (url, init) => {
    appels.push({ url, init });
    return reponse();
  };
  return { appels, client: creerClientBrevo({ cleApi: 'cle-test', fetch }) };
};
const corps = (init: RequestInit) => JSON.parse(String(init.body));

test('enregistrerContact crée ou met à jour le contact, sans attribut vide', async () => {
  const { appels, client } = enregistreur();
  await client.enregistrerContact({ email: 'a@b.fr', attributs: { NOM_COMPLET: 'A', TELEPHONE: '' }, listes: [4] });
  expect(appels[0]!.url).toBe('https://api.brevo.com/v3/contacts');
  expect(appels[0]!.init.method).toBe('POST');
  expect(appels[0]!.init.headers).toMatchObject({ 'api-key': 'cle-test', 'content-type': 'application/json' });
  expect(corps(appels[0]!.init)).toEqual({ email: 'a@b.fr', attributes: { NOM_COMPLET: 'A' }, listIds: [4], updateEnabled: true });
});

test('envoyerModele envoie un e-mail transactionnel', async () => {
  const { appels, client } = enregistreur();
  await client.envoyerModele({ modele: 7, a: { email: 'ecole@b.fr', nom: 'École' }, repondreA: { email: 'a@b.fr', nom: 'A' }, params: { nom: 'A' } });
  expect(appels[0]!.url).toBe('https://api.brevo.com/v3/smtp/email');
  expect(corps(appels[0]!.init)).toEqual({ templateId: 7, to: [{ email: 'ecole@b.fr', name: 'École' }], replyTo: { email: 'a@b.fr', name: 'A' }, params: { nom: 'A' } });
});

test('envoyerModele sans repondreA n’envoie pas de replyTo', async () => {
  const { appels, client } = enregistreur();
  await client.envoyerModele({ modele: 7, a: { email: 'a@b.fr' }, params: {} });
  expect(corps(appels[0]!.init)).toEqual({ templateId: 7, to: [{ email: 'a@b.fr' }], params: {} });
});

test('demanderConfirmation lance la double confirmation', async () => {
  const { appels, client } = enregistreur();
  await client.demanderConfirmation({ email: 'a@b.fr', listes: [3], modele: 9, redirection: 'https://site.fr/lettre-confirmee.html' });
  expect(appels[0]!.url).toBe('https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
  expect(corps(appels[0]!.init)).toEqual({ email: 'a@b.fr', includeListIds: [3], templateId: 9, redirectionUrl: 'https://site.fr/lettre-confirmee.html' });
});

test('une réponse en erreur devient une ErreurBrevo avec son statut', async () => {
  const { client } = enregistreur(async () => new Response('{"code":"unauthorized"}', { status: 401 }));
  const erreur = await client.enregistrerContact({ email: 'a@b.fr', attributs: {}, listes: [1] }).catch((e: unknown) => e);
  expect(erreur).toBeInstanceOf(ErreurBrevo);
  expect(erreur).toMatchObject({ operation: 'contact', statut: 401 });
});

test('une panne réseau devient une ErreurBrevo sans statut', async () => {
  const { client } = enregistreur(async () => { throw new TypeError('fetch failed'); });
  const erreur = await client.envoyerModele({ modele: 1, a: { email: 'a@b.fr' }, params: {} }).catch((e: unknown) => e);
  expect(erreur).toMatchObject({ operation: 'email', statut: null });
});

test('chaque appel est limité dans le temps', async () => {
  const { appels, client } = enregistreur();
  await client.demanderConfirmation({ email: 'a@b.fr', listes: [1], modele: 1, redirection: 'https://s.fr/' });
  expect(appels[0]!.init.signal).toBeInstanceOf(AbortSignal);
});
```

- [ ] **Step 2 : Lancer les tests et constater l'échec**

Run: `bun test tests/brevo.test.ts`
Expected: FAIL, module `../src/lib/brevo` introuvable.

- [ ] **Step 3 : Écrire le client**

Créer `src/lib/brevo.ts` :

```ts
// Client minimal de l'API Brevo v3 : contacts, e-mails transactionnels par modèle, double confirmation.
// Le fetch est injecté pour que les tests n'appellent jamais Brevo.
const API = 'https://api.brevo.com/v3';

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface Destinataire {
  readonly email: string;
  readonly nom?: string;
}

export interface ClientBrevo {
  enregistrerContact(contact: { email: string; attributs: Record<string, string>; listes: number[] }): Promise<void>;
  envoyerModele(envoi: { modele: number; a: Destinataire; repondreA?: Destinataire; params: Record<string, string> }): Promise<void>;
  demanderConfirmation(demande: { email: string; listes: number[]; modele: number; redirection: string }): Promise<void>;
}

/** Échec d'un appel : `statut` vaut null quand Brevo n'a pas répondu (réseau, délai dépassé). */
export class ErreurBrevo extends Error {
  constructor(
    readonly operation: string,
    readonly statut: number | null,
  ) {
    super(`Brevo ${operation} : ${statut ?? 'pas de réponse'}`);
  }
}

const versBrevo = ({ email, nom }: Destinataire) => (nom ? { email, name: nom } : { email });
const sansVides = (attributs: Record<string, string>) => Object.fromEntries(Object.entries(attributs).filter(([, valeur]) => valeur !== ''));

export const creerClientBrevo = ({ cleApi, fetch, delaiMs = 8000 }: { cleApi: string; fetch: Fetch; delaiMs?: number }): ClientBrevo => {
  const appeler = async (operation: string, chemin: string, corps: unknown): Promise<void> => {
    let reponse: Response;
    try {
      reponse = await fetch(`${API}${chemin}`, {
        method: 'POST',
        headers: { 'api-key': cleApi, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(delaiMs),
      });
    } catch {
      throw new ErreurBrevo(operation, null);
    }
    if (!reponse.ok) throw new ErreurBrevo(operation, reponse.status);
  };

  return {
    enregistrerContact: ({ email, attributs, listes }) =>
      appeler('contact', '/contacts', { email, attributes: sansVides(attributs), listIds: listes, updateEnabled: true }),
    envoyerModele: ({ modele, a, repondreA, params }) =>
      appeler('email', '/smtp/email', { templateId: modele, to: [versBrevo(a)], ...(repondreA ? { replyTo: versBrevo(repondreA) } : {}), params }),
    demanderConfirmation: ({ email, listes, modele, redirection }) =>
      appeler('confirmation', '/contacts/doubleOptinConfirmation', { email, includeListIds: listes, templateId: modele, redirectionUrl: redirection }),
  };
};
```

- [ ] **Step 4 : Lancer les tests**

Run: `bun test tests/brevo.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/brevo.ts tests/brevo.test.ts
git commit -m "Ajoute le client de l’API Brevo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : Traitement d'un formulaire validé

**Files:**
- Modify: `src/lib/markdown.ts:22` (exporter `echapper`)
- Create: `src/lib/formulaires/traitement.ts`
- Test: `tests/formulaires-traitement.test.ts`

**Interfaces:**
- Consumes: `Demande`, `SUJETS`, `Formulaire` (Task 2) ; `ConfigBrevo` (Task 2) ; `ClientBrevo`, `ErreurBrevo` (Task 3) ; `echapper(texte: string): string` (`src/lib/markdown.ts`).
- Produces :
  - `type Journal = (evenement: { formulaire: string; etape: string; statut: number | null }) => void`
  - `traiter(demande: Demande, deps: { client: ClientBrevo; config: ConfigBrevo; origine: string; journal: Journal }): Promise<'envoye' | 'echec'>`

- [ ] **Step 1 : Exporter `echapper`**

Dans `src/lib/markdown.ts`, remplacer `const echapper = (texte: string): string =>` par :

```ts
/** Neutralise le HTML d'un texte saisi (utilisé aussi pour les paramètres des e-mails Brevo). */
export const echapper = (texte: string): string =>
```

- [ ] **Step 2 : Écrire les tests**

Créer `tests/formulaires-traitement.test.ts` :

```ts
import { describe, expect, test } from 'bun:test';
import type { ConfigBrevo } from '../src/data/brevo';
import { ErreurBrevo, type ClientBrevo } from '../src/lib/brevo';
import { traiter, type Journal } from '../src/lib/formulaires/traitement';
import type { Demande } from '../src/lib/formulaires/validation';

const config: ConfigBrevo = {
  ecole: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 11, inscription: 12, lettre: 13 },
  modeles: { notificationContact: 21, accuseContact: 22, notificationInscription: 23, accuseInscription: 24, confirmationLettre: 25 },
  pageConfirmationLettre: 'lettre-confirmee.html',
};

type Appel = [methode: keyof ClientBrevo, argument: unknown];
const faux = (echecs: Partial<Record<string, number | null>> = {}) => {
  const appels: Appel[] = [];
  const evenements: Parameters<Journal>[0][] = [];
  const agir = (methode: keyof ClientBrevo, cle: string) => async (argument: unknown) => {
    appels.push([methode, argument]);
    if (cle in echecs) throw new ErreurBrevo(cle, echecs[cle] ?? null);
  };
  const client: ClientBrevo = {
    enregistrerContact: agir('enregistrerContact', 'contact'),
    envoyerModele: async (envoi) => agir('envoyerModele', envoi.modele === 21 || envoi.modele === 23 ? 'notification' : 'accuse')(envoi),
    demanderConfirmation: agir('demanderConfirmation', 'confirmation'),
  };
  return { appels, evenements, deps: { client, config, origine: 'https://lespetons.fr', journal: (e: Parameters<Journal>[0]) => evenements.push(e) } };
};

const contact: Demande = {
  formulaire: 'contact',
  champs: { name: 'Camille <b>M</b>', email: 'c@b.fr', phone: '', organisation: 'Asso', subject: 'visite', message: 'Bonjour', newsletter: false },
};
const inscription: Demande = {
  formulaire: 'inscription',
  champs: { parentName: 'Camille', email: 'c@b.fr', phone: '06', schoolStart: 'sept. 2027', childAge: '3–6 ans — Les Chenilles', message: '', newsletter: true },
};

describe('contact', () => {
  test('notifie l’école d’abord, puis enregistre le contact et envoie l’accusé', async () => {
    const { appels, deps } = faux();
    expect(await traiter(contact, deps)).toBe('envoye');
    expect(appels[0]).toEqual(['envoyerModele', {
      modele: 21,
      a: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' },
      repondreA: { email: 'c@b.fr', nom: 'Camille <b>M</b>' },
      params: { nom: 'Camille &lt;b&gt;M&lt;/b&gt;', email: 'c@b.fr', telephone: '', structure: 'Asso', sujet: 'Organiser une visite', message: 'Bonjour', lettre: 'non' },
    }]);
    expect(appels.slice(1)).toEqual([
      ['enregistrerContact', { email: 'c@b.fr', attributs: { NOM_COMPLET: 'Camille <b>M</b>', TELEPHONE: '', STRUCTURE: 'Asso' }, listes: [11] }],
      ['envoyerModele', { modele: 22, a: { email: 'c@b.fr', nom: 'Camille <b>M</b>' }, params: { nom: 'Camille &lt;b&gt;M&lt;/b&gt;', sujet: 'Organiser une visite', message: 'Bonjour' } }],
    ]);
  });

  test('sans case lettre, aucune double confirmation', async () => {
    const { appels, deps } = faux();
    await traiter(contact, deps);
    expect(appels.map(([methode]) => methode)).not.toContain('demanderConfirmation');
  });

  test('un échec de la notification fait échouer l’envoi, sans autre appel', async () => {
    const { appels, evenements, deps } = faux({ notification: 500 });
    expect(await traiter(contact, deps)).toBe('echec');
    expect(appels).toHaveLength(1);
    expect(evenements).toEqual([{ formulaire: 'contact', etape: 'notification', statut: 500 }]);
  });

  test('un échec du contact ou de l’accusé est consigné mais l’envoi réussit', async () => {
    const { evenements, deps } = faux({ contact: 400, accuse: null });
    expect(await traiter(contact, deps)).toBe('envoye');
    expect(evenements).toEqual([
      { formulaire: 'contact', etape: 'contact', statut: 400 },
      { formulaire: 'contact', etape: 'accuse', statut: null },
    ]);
  });
});

describe('inscription', () => {
  test('envoie les bons modèles, la bonne liste et la double confirmation demandée', async () => {
    const { appels, deps } = faux();
    expect(await traiter(inscription, deps)).toBe('envoye');
    expect(appels[0]![1]).toMatchObject({
      modele: 23,
      params: { nom: 'Camille', email: 'c@b.fr', telephone: '06', rentree: 'sept. 2027', age: '3–6 ans — Les Chenilles', message: '', lettre: 'oui' },
    });
    expect(appels.slice(1)).toEqual([
      ['enregistrerContact', { email: 'c@b.fr', attributs: { NOM_COMPLET: 'Camille', TELEPHONE: '06', RENTREE_SOUHAITEE: 'sept. 2027', TRANCHE_AGE: '3–6 ans — Les Chenilles' }, listes: [12] }],
      ['envoyerModele', { modele: 24, a: { email: 'c@b.fr', nom: 'Camille' }, params: { nom: 'Camille', rentree: 'sept. 2027', age: '3–6 ans — Les Chenilles', message: '' } }],
      ['demanderConfirmation', { email: 'c@b.fr', listes: [13], modele: 25, redirection: 'https://lespetons.fr/lettre-confirmee.html' }],
    ]);
  });
});

describe('lettre', () => {
  const lettre: Demande = { formulaire: 'lettre', champs: { email: 'c@b.fr' } };

  test('lance seulement la double confirmation', async () => {
    const { appels, deps } = faux();
    expect(await traiter(lettre, deps)).toBe('envoye');
    expect(appels).toEqual([['demanderConfirmation', { email: 'c@b.fr', listes: [13], modele: 25, redirection: 'https://lespetons.fr/lettre-confirmee.html' }]]);
  });

  test('un échec de la double confirmation fait échouer l’envoi', async () => {
    const { evenements, deps } = faux({ confirmation: 503 });
    expect(await traiter(lettre, deps)).toBe('echec');
    expect(evenements).toEqual([{ formulaire: 'lettre', etape: 'confirmation', statut: 503 }]);
  });
});
```

- [ ] **Step 3 : Lancer les tests et constater l'échec**

Run: `bun test tests/formulaires-traitement.test.ts`
Expected: FAIL, module `../src/lib/formulaires/traitement` introuvable.

- [ ] **Step 4 : Écrire le traitement**

Créer `src/lib/formulaires/traitement.ts` :

```ts
// Enchaîne les appels Brevo pour un formulaire validé.
// Règle : la notification à l'école est indispensable ; le contact, l'accusé de réception
// et la double confirmation se font au mieux (un échec est consigné, l'envoi reste réussi).
import type { ConfigBrevo } from '../../data/brevo';
import { ErreurBrevo, type ClientBrevo, type Destinataire } from '../brevo';
import { echapper } from '../markdown';
import { SUJETS, type Demande } from './validation';

export type Journal = (evenement: { formulaire: string; etape: string; statut: number | null }) => void;

interface Dependances {
  readonly client: ClientBrevo;
  readonly config: ConfigBrevo;
  /** Origine du site (https://…), pour l'adresse de la page de confirmation. */
  readonly origine: string;
  readonly journal: Journal;
}

/** Les modèles Brevo reçoivent des textes déjà neutralisés : un visiteur ne peut pas injecter de HTML. */
const neutraliser = (params: Record<string, string>) => Object.fromEntries(Object.entries(params).map(([cle, valeur]) => [cle, echapper(valeur)]));
const ouiNon = (valeur: boolean) => (valeur ? 'oui' : 'non');
const statutDe = (erreur: unknown) => (erreur instanceof ErreurBrevo ? erreur.statut : null);

interface Envoi {
  readonly visiteur: Destinataire;
  readonly liste: number;
  readonly attributs: Record<string, string>;
  readonly notification: { modele: number; params: Record<string, string> };
  readonly accuse: { modele: number; params: Record<string, string> };
  readonly lettre: boolean;
}

const preparer = (demande: Exclude<Demande, { formulaire: 'lettre' }>, config: ConfigBrevo): Envoi => {
  if (demande.formulaire === 'contact') {
    const { name, email, phone, organisation, subject, message, newsletter } = demande.champs;
    const sujet = SUJETS[subject];
    return {
      visiteur: { email, nom: name },
      liste: config.listes.contact,
      attributs: { NOM_COMPLET: name, TELEPHONE: phone, STRUCTURE: organisation },
      notification: { modele: config.modeles.notificationContact, params: { nom: name, email, telephone: phone, structure: organisation, sujet, message, lettre: ouiNon(newsletter) } },
      accuse: { modele: config.modeles.accuseContact, params: { nom: name, sujet, message } },
      lettre: newsletter,
    };
  }
  const { parentName, email, phone, schoolStart, childAge, message, newsletter } = demande.champs;
  return {
    visiteur: { email, nom: parentName },
    liste: config.listes.inscription,
    attributs: { NOM_COMPLET: parentName, TELEPHONE: phone, RENTREE_SOUHAITEE: schoolStart, TRANCHE_AGE: childAge },
    notification: { modele: config.modeles.notificationInscription, params: { nom: parentName, email, telephone: phone, rentree: schoolStart, age: childAge, message, lettre: ouiNon(newsletter) } },
    accuse: { modele: config.modeles.accuseInscription, params: { nom: parentName, rentree: schoolStart, age: childAge, message } },
    lettre: newsletter,
  };
};

export const traiter = async (demande: Demande, { client, config, origine, journal }: Dependances): Promise<'envoye' | 'echec'> => {
  const { formulaire } = demande;
  const confirmation = (email: string) =>
    client.demanderConfirmation({ email, listes: [config.listes.lettre], modele: config.modeles.confirmationLettre, redirection: `${origine}/${config.pageConfirmationLettre}` });

  if (demande.formulaire === 'lettre') {
    try {
      await confirmation(demande.champs.email);
      return 'envoye';
    } catch (erreur) {
      journal({ formulaire, etape: 'confirmation', statut: statutDe(erreur) });
      return 'echec';
    }
  }

  const envoi = preparer(demande, config);
  try {
    await client.envoyerModele({ modele: envoi.notification.modele, a: config.ecole, repondreA: envoi.visiteur, params: neutraliser(envoi.notification.params) });
  } catch (erreur) {
    journal({ formulaire, etape: 'notification', statut: statutDe(erreur) });
    return 'echec';
  }

  const auMieux: [etape: string, action: () => Promise<void>][] = [
    ['contact', () => client.enregistrerContact({ email: envoi.visiteur.email, attributs: envoi.attributs, listes: [envoi.liste] })],
    ['accuse', () => client.envoyerModele({ modele: envoi.accuse.modele, a: envoi.visiteur, params: neutraliser(envoi.accuse.params) })],
    ...(envoi.lettre ? [['confirmation', () => confirmation(envoi.visiteur.email)] as [string, () => Promise<void>]] : []),
  ];
  const resultats = await Promise.allSettled(auMieux.map(([, action]) => action()));
  resultats.forEach((resultat, index) => {
    if (resultat.status === 'rejected') journal({ formulaire, etape: auMieux[index]![0], statut: statutDe(resultat.reason) });
  });
  return 'envoye';
};
```

Note pour l'implémenteur : `config.ecole` a la forme `{ email, nom }`, compatible avec `Destinataire`.

- [ ] **Step 5 : Lancer les tests**

Run: `bun test tests/formulaires-traitement.test.ts tests/markdown.test.ts`
Expected: PASS (les tests existants de `markdown.ts` restent verts).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/markdown.ts src/lib/formulaires/traitement.ts tests/formulaires-traitement.test.ts
git commit -m "Enchaîne les envois Brevo d’un formulaire validé

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : Contrôles de la requête et route définitive

**Files:**
- Create: `src/lib/formulaires/requete.ts`
- Modify: `src/pages/api/formulaire.ts` (remplace la version provisoire)
- Test: `tests/formulaires-requete.test.ts`

**Interfaces:**
- Consumes: `valider`, `estSpam` (Task 2) ; `ConfigBrevo`, `estConfiguree` (Task 2) ; `creerClientBrevo`, `Fetch` (Task 3) ; `traiter`, `Journal` (Task 4) ; `BREVO_API_KEY` (Task 1).
- Produces :
  - `TAILLE_MAX_OCTETS = 16384`
  - `traiterRequete(requete: Request, deps: { cleApi: string | undefined; config: ConfigBrevo; fetch: Fetch; maintenant: () => number; journal: Journal }): Promise<Response>`

- [ ] **Step 1 : Écrire les tests**

Créer `tests/formulaires-requete.test.ts` :

```ts
import { describe, expect, test } from 'bun:test';
import type { ConfigBrevo } from '../src/data/brevo';
import type { Fetch } from '../src/lib/brevo';
import { TAILLE_MAX_OCTETS, traiterRequete } from '../src/lib/formulaires/requete';

const config: ConfigBrevo = {
  ecole: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 1, inscription: 2, lettre: 3 },
  modeles: { notificationContact: 4, accuseContact: 5, notificationInscription: 6, accuseInscription: 7, confirmationLettre: 8 },
  pageConfirmationLettre: 'lettre-confirmee.html',
};
const MAINTENANT = 1_000_000;

const preparer = (statutBrevo = 201) => {
  const appels: string[] = [];
  const evenements: unknown[] = [];
  const fetch: Fetch = async (url) => {
    appels.push(url);
    return new Response(null, { status: statutBrevo });
  };
  const deps = { cleApi: 'cle', config, fetch, maintenant: () => MAINTENANT, journal: (e: unknown) => evenements.push(e) };
  return { appels, evenements, deps };
};

const lettre = { formulaire: 'lettre', champs: { email: 'a@b.fr' }, piege: '', ouvertLe: MAINTENANT - 10_000 };
const requete = (corps: unknown = lettre, { methode = 'POST', origine = 'https://lespetons.fr' as string | null } = {}) =>
  new Request('https://lespetons.fr/api/formulaire', {
    method: methode,
    headers: { 'content-type': 'application/json', ...(origine ? { origin: origine } : {}) },
    body: methode === 'POST' ? (typeof corps === 'string' ? corps : JSON.stringify(corps)) : undefined,
  });

const lire = async (reponse: Response) => ({ statut: reponse.status, corps: await reponse.json(), cache: reponse.headers.get('cache-control') });

describe('traiterRequete', () => {
  test('envoie une demande valide', async () => {
    const { appels, deps } = preparer();
    expect(await lire(await traiterRequete(requete(), deps))).toEqual({ statut: 200, corps: { ok: true }, cache: 'no-store' });
    expect(appels).toEqual(['https://api.brevo.com/v3/contacts/doubleOptinConfirmation']);
  });

  test('refuse une autre méthode que POST', async () => {
    const { deps } = preparer();
    expect((await traiterRequete(requete(undefined, { methode: 'GET' }), deps)).status).toBe(405);
  });

  test.each([
    ['absente', null],
    ['d’un autre site', 'https://pirate.example'],
    ['illisible', 'pas une url'],
  ])('refuse une origine %s', async (_cas, origine) => {
    const { appels, deps } = preparer();
    expect((await traiterRequete(requete(lettre, { origine }), deps)).status).toBe(403);
    expect(appels).toEqual([]);
  });

  test('refuse un corps trop volumineux', async () => {
    const { deps } = preparer();
    const gros = { ...lettre, champs: { email: 'a@b.fr', bourrage: 'x'.repeat(TAILLE_MAX_OCTETS) } };
    expect((await traiterRequete(requete(gros), deps)).status).toBe(413);
  });

  test('répond 503 sans clé API', async () => {
    const { appels, deps } = preparer();
    expect((await traiterRequete(requete(), { ...deps, cleApi: undefined })).status).toBe(503);
    expect(appels).toEqual([]);
  });

  test('répond 503 tant qu’un numéro Brevo manque', async () => {
    const { deps } = preparer();
    const incomplete = { ...config, listes: { ...config.listes, lettre: 0 } };
    expect((await traiterRequete(requete(), { ...deps, config: incomplete })).status).toBe(503);
  });

  test('fait croire au robot que tout va bien, sans rien envoyer', async () => {
    const { appels, evenements, deps } = preparer();
    const reponse = await traiterRequete(requete({ ...lettre, piege: 'http://spam' }), deps);
    expect(await lire(reponse)).toEqual({ statut: 200, corps: { ok: true }, cache: 'no-store' });
    expect(appels).toEqual([]);
    expect(evenements).toEqual([{ formulaire: 'lettre', etape: 'antispam', statut: null }]);
  });

  test.each([
    ['JSON illisible', '{pas du json'],
    ['champs invalides', { ...lettre, champs: { email: 'non' } }],
    ['formulaire inconnu', { ...lettre, formulaire: 'autre' }],
  ])('répond 400 : %s', async (_cas, corps) => {
    const { deps } = preparer();
    expect(await lire(await traiterRequete(requete(corps), deps))).toEqual({ statut: 400, corps: { ok: false }, cache: 'no-store' });
  });

  test('répond 502 quand Brevo échoue sur l’étape indispensable', async () => {
    const { deps } = preparer(500);
    expect((await traiterRequete(requete(), deps)).status).toBe(502);
  });
});
```

- [ ] **Step 2 : Lancer les tests et constater l'échec**

Run: `bun test tests/formulaires-requete.test.ts`
Expected: FAIL, module `../src/lib/formulaires/requete` introuvable.

- [ ] **Step 3 : Écrire les contrôles**

Créer `src/lib/formulaires/requete.ts` :

```ts
// Contrôles de POST /api/formulaire, dans l'ordre de la spec :
// méthode, origine, taille, configuration, anti-spam, validation, puis envoi à Brevo.
import { estConfiguree, type ConfigBrevo } from '../../data/brevo';
import { creerClientBrevo, type Fetch } from '../brevo';
import { traiter, type Journal } from './traitement';
import { estSpam, valider } from './validation';

export const TAILLE_MAX_OCTETS = 16384;

interface Dependances {
  readonly cleApi: string | undefined;
  readonly config: ConfigBrevo;
  readonly fetch: Fetch;
  readonly maintenant: () => number;
  readonly journal: Journal;
}

const repondre = (statut: number) =>
  Response.json({ ok: statut === 200 }, { status: statut, headers: { 'cache-control': 'no-store', ...(statut === 405 ? { allow: 'POST' } : {}) } });

/** Origine de la requête si elle vient du même site (production, prévisualisation Vercel ou localhost), sinon null. */
const origineDuSite = (requete: Request): string | null => {
  const origine = requete.headers.get('origin');
  if (!origine) return null;
  try {
    return new URL(origine).host === new URL(requete.url).host ? new URL(origine).origin : null;
  } catch {
    return null;
  }
};

const lireCorps = async (requete: Request): Promise<string | null> => {
  if (Number(requete.headers.get('content-length') ?? 0) > TAILLE_MAX_OCTETS) return null;
  const texte = await requete.text();
  return new TextEncoder().encode(texte).length > TAILLE_MAX_OCTETS ? null : texte;
};

const lireJson = (texte: string): Record<string, unknown> | null => {
  try {
    const valeur: unknown = JSON.parse(texte);
    return valeur && typeof valeur === 'object' && !Array.isArray(valeur) ? (valeur as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

export const traiterRequete = async (requete: Request, { cleApi, config, fetch, maintenant, journal }: Dependances): Promise<Response> => {
  if (requete.method !== 'POST') return repondre(405);

  const origine = origineDuSite(requete);
  if (!origine) return repondre(403);

  const texte = await lireCorps(requete);
  if (texte === null) return repondre(413);

  if (!cleApi || !estConfiguree(config)) return repondre(503);

  const corps = lireJson(texte);
  if (!corps) return repondre(400);

  if (estSpam(corps.piege, corps.ouvertLe, maintenant())) {
    journal({ formulaire: String(corps.formulaire ?? '?').slice(0, 20), etape: 'antispam', statut: null });
    return repondre(200);
  }

  const demande = valider(corps.formulaire, corps.champs);
  if (!demande) return repondre(400);

  const client = creerClientBrevo({ cleApi, fetch });
  return repondre((await traiter(demande, { client, config, origine, journal })) === 'envoye' ? 200 : 502);
};
```

- [ ] **Step 4 : Lancer les tests**

Run: `bun test tests/formulaires-requete.test.ts`
Expected: PASS.

- [ ] **Step 5 : Brancher la route**

Remplacer `src/pages/api/formulaire.ts` par :

```ts
// Route des formulaires du site : voir docs/formulaires-brevo.md.
// Toute la logique est dans src/lib/formulaires/requete.ts (testée sans Astro ni réseau).
import type { APIRoute } from 'astro';
import { BREVO_API_KEY } from 'astro:env/server';
import { brevo } from '../../data/brevo';
import { traiterRequete } from '../../lib/formulaires/requete';

export const prerender = false;

export const ALL: APIRoute = ({ request }) =>
  traiterRequete(request, {
    cleApi: BREVO_API_KEY,
    config: brevo,
    fetch: (url, init) => fetch(url, init),
    maintenant: Date.now,
    // Journaux Vercel : jamais le contenu des champs.
    journal: (evenement) => console.warn('[formulaire]', JSON.stringify(evenement)),
  });
```

- [ ] **Step 6 : Vérifier**

```bash
bun run check
bun run dev
```

Dans un autre terminal :

```bash
curl -s -i -X POST http://localhost:4321/api/formulaire -H 'origin: http://localhost:4321' -H 'content-type: application/json' -d '{}' | head -1
curl -s -i -X POST http://localhost:4321/api/formulaire -H 'origin: https://pirate.example' -d '{}' | head -1
curl -s -i http://localhost:4321/api/formulaire | head -1
```

Résultats attendus, sans `.env` : `503`, puis `403`, puis `405`. Arrêter le serveur.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/formulaires/requete.ts src/pages/api/formulaire.ts tests/formulaires-requete.test.ts
git commit -m "Contrôle les requêtes des formulaires avant l’envoi à Brevo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : Script commun et formulaire de contact

**Files:**
- Create: `src/components/FormSubmitScript.astro`
- Modify: `src/pages/contact-petons.astro` (frontmatter, lignes 150-162 du formulaire, script de fin de page)
- Test: `tests/formulaires-pages.test.ts`

**Interfaces:**
- Consumes: `LIMITES` (Task 2) ; `DOSSIER_PAGES`, `chargerHtml` (Task 1).
- Produces (global navigateur, défini par `FormSubmitScript`) :
  - `window.envoyerFormulaire(form: HTMLFormElement, formulaire: 'contact' | 'inscription' | 'lettre', champs: Record<string, string | boolean>): Promise<boolean>`
  - `window.afficherEnvoiReussi(form: HTMLFormElement, message: string): void`
  - attribut `data-brevo` sur chaque formulaire concerné ; champ `name="piege"` ; classes CSS `.form-trap`, `.newsletter-optin`, `.form-privacy`, `.form-success`.

- [ ] **Step 1 : Écrire le test de la page**

Créer `tests/formulaires-pages.test.ts` :

```ts
// Invariants des formulaires construits (à lancer après « bun run build »).
import { describe, expect, test } from 'bun:test';
import { LIMITES } from '../src/lib/formulaires/validation';
import { chargerHtml, DOSSIER_PAGES } from './outils/html';

const formulaires = [
  { page: 'contact-petons.html', selecteur: '#contact-form', limites: LIMITES.contact, caseLettre: true },
] as const;

for (const { page, selecteur, limites, caseLettre } of formulaires) {
  // Chargé avant describe : bun n'attend pas un describe asynchrone.
  const html = await chargerHtml(`${DOSSIER_PAGES}/${page}`);
  const form = html.querySelector(selecteur)!;

  describe(`${page} ${selecteur}`, () => {
    test('est marqué pour l’envoi à Brevo et garde le repli mailto sans JavaScript', () => {
      expect(form.hasAttribute('data-brevo')).toBe(true);
      expect(form.getAttribute('action')).toBe('mailto:contact@lespetons.fr');
    });

    test('contient un champ piège invisible et hors tabulation', () => {
      const piege = form.querySelector('input[name="piege"]')!;
      expect(piege.getAttribute('tabindex')).toBe('-1');
      expect(piege.getAttribute('autocomplete')).toBe('off');
      expect(piege.closest('.form-trap')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('les maxlength sont ceux de la validation serveur', () => {
      for (const [nom, max] of Object.entries(limites)) {
        expect(form.querySelector(`[name="${nom}"]`)?.getAttribute('maxlength')).toBe(String(max));
      }
    });

    test('annonce l’usage des données, Brevo et la durée de conservation', () => {
      const mention = form.querySelector('.form-privacy')?.text ?? '';
      expect(mention).toContain('Brevo');
      expect(mention).toContain(caseLettre ? '3 ans' : 'désinscrire');
    });

    if (caseLettre) {
      test('propose la lettre par une case non cochée', () => {
        const case_ = form.querySelector('input[type="checkbox"][name="newsletter"]')!;
        expect(case_.hasAttribute('checked')).toBe(false);
      });
    }
  });
}
```

- [ ] **Step 2 : Construire et constater l'échec**

Run: `bun run build && bun test tests/formulaires-pages.test.ts`
Expected: FAIL (`data-brevo` absent, champ piège absent, mention absente).

- [ ] **Step 3 : Écrire le composant commun**

Créer `src/components/FormSubmitScript.astro` :

```astro
---
// Envoi des formulaires marqués data-brevo vers /api/formulaire (voir docs/formulaires-brevo.md).
// À placer avant le script de la page, qui appelle envoyerFormulaire() puis afficherEnvoiReussi().
---
<style is:inline>
.form-trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.newsletter-optin{display:flex;gap:10px;align-items:flex-start;margin:4px 0 0;font-size:14px;line-height:1.45;cursor:pointer}
.newsletter-optin input{margin-top:3px;flex:none}
.form-privacy{margin:14px 0 0;font-size:12px;line-height:1.55;opacity:.8}
.form-success{margin:0;padding:18px 20px;border-radius:12px;background:rgba(108,140,72,.12);font-size:16px;line-height:1.5}
.form-success:focus{outline:2px solid currentColor;outline-offset:3px}
</style>
<script is:inline>(()=>{
 const ouvertLe=Date.now();
 window.envoyerFormulaire=async(form,formulaire,champs)=>{
  const bouton=form.querySelector('button[type="submit"]'),contenu=bouton.innerHTML;
  bouton.disabled=true;bouton.textContent='Envoi en cours…';
  try{
   const reponse=await fetch('/api/formulaire',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({formulaire,champs,piege:form.elements.piege?.value||'',ouvertLe})});
   return reponse.ok&&(await reponse.json()).ok===true;
  }catch{return false;}
  finally{bouton.disabled=false;bouton.innerHTML=contenu;}
 };
 window.afficherEnvoiReussi=(form,message)=>{
  const annonce=document.createElement('p');
  annonce.className='form-success';annonce.setAttribute('role','status');annonce.tabIndex=-1;
  form.after(annonce);form.hidden=true;
  annonce.textContent=message;annonce.focus();
 };
})();
</script>
```

- [ ] **Step 4 : Modifier le formulaire de contact**

Dans `src/pages/contact-petons.astro` :

1. Frontmatter : ajouter `import FormSubmitScript from '../components/FormSubmitScript.astro';` après l'import de `SiteNavScript`.
2. Balise du formulaire : `<form id="contact-form" data-brevo action="mailto:contact@lespetons.fr" method="post" enctype="text/plain">`.
3. Juste après `<form …>`, ajouter le champ piège :

```html
          <div class="form-trap" aria-hidden="true"><label for="contact-piege">Ne pas remplir ce champ</label><input id="contact-piege" name="piege" type="text" tabindex="-1" autocomplete="off"></div>
```

4. Après le `<div class="field">` du message et avant `<p class="required-note">`, ajouter :

```html
          <label class="newsletter-optin"><input type="checkbox" name="newsletter" value="oui"><span>Je souhaite recevoir la lettre d’information des Petons</span></label>
```

5. Dans `.form-action`, remplacer le texte du bouton `Préparer mon message` par `Envoyer mon message` et le paragraphe `Votre messagerie s’ouvrira avec votre message prêt à envoyer.` par `Vous recevrez un accusé de réception par e-mail.`
6. Juste avant `</form>` (après `#draft-result`), ajouter :

```html
          <p class="form-privacy">Les Petons dans l’Herbe utilisent ces informations pour répondre à votre demande et, si vous l’avez demandé, vous envoyer la lettre d’information. Elles sont hébergées par Brevo, notre prestataire d’envoi d’e-mails, et conservées 3 ans après notre dernier échange. Pour y accéder, les corriger ou les supprimer : contact@lespetons.fr.</p>
```

7. Les conseils `candidature` et `stage` de l'objet `prompts` parlent de joindre un CV « à l’e-mail ». Le visiteur n'a plus de messagerie ouverte : remplacer leur fin `Vous pourrez joindre votre CV à l’e-mail.` par `Vous pourrez nous envoyer votre CV en répondant à l’accusé de réception.`
8. Remplacer `<Footer /><script is:inline>(()=>{` par `<Footer /><FormSubmitScript /><script is:inline>(()=>{`.
9. Dans le script de la page, remplacer `form.addEventListener('submit',event=>{` par `form.addEventListener('submit',async event=>{`, puis remplacer les trois lignes qui suivent la construction de `url` (`emailLink.href=url;…`, `status.textContent=…`, `window.location.href=url;`) par :

```js
  const envoye=await envoyerFormulaire(form,'contact',{name:value('name'),email:value('email'),phone:value('phone'),organisation:value('organisation'),subject:subject.value,message:value('message'),newsletter:form.elements.newsletter.checked});
  if(envoye){afficherEnvoiReussi(form,'Merci, votre message est bien parti. Vous allez recevoir un accusé de réception par e-mail.');return;}
  emailLink.href=url;preview.value=preparedMessage;result.hidden=false;
  status.textContent='L’envoi n’a pas abouti. Vous pouvez nous écrire directement depuis votre messagerie, ou copier le message ci-dessous.';
```

Le script garde `preparedMessage`, `url` et le bouton de copie : ils servent au repli.

- [ ] **Step 5 : Construire et lancer les tests**

Run: `bun run check`
Expected: PASS, y compris `tests/formulaires-pages.test.ts`.

- [ ] **Step 6 : Vérifier dans le navigateur**

Lancer le serveur de développement (outil de prévisualisation, configuration `bun run dev`, port 4321) et ouvrir `http://localhost:4321/contact-petons.html` :

- sans `.env`, remplir et envoyer : le bouton affiche « Envoi en cours… », puis le bloc de repli apparaît avec « L’envoi n’a pas abouti… » (la route répond 503) ; la console n'affiche aucune erreur JavaScript ;
- la case lettre n'est pas cochée ; la mention RGPD est lisible ; le champ piège est invisible et la touche Tab passe du message à la case sans s'y arrêter ;
- capture d'écran en 1280 px et en 375 px de large, pour vérifier la mise en page de la case et de la mention.

- [ ] **Step 7 : Commit**

```bash
git add src/components/FormSubmitScript.astro src/pages/contact-petons.astro tests/formulaires-pages.test.ts
git commit -m "Envoie le formulaire de contact à Brevo, avec repli sur la messagerie

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : Formulaire d'inscription

**Files:**
- Modify: `src/pages/inscriptions-petons.astro` (frontmatter, formulaire lignes 142-157, script de fin de page)
- Modify: `tests/formulaires-pages.test.ts`

**Interfaces:**
- Consumes: `FormSubmitScript`, `window.envoyerFormulaire`, `window.afficherEnvoiReussi`, classes CSS (Task 6) ; `LIMITES.inscription` (Task 2).

- [ ] **Step 1 : Étendre le test**

Dans `tests/formulaires-pages.test.ts`, ajouter à `formulaires` :

```ts
  { page: 'inscriptions-petons.html', selecteur: '#admission-form', limites: LIMITES.inscription, caseLettre: true },
```

- [ ] **Step 2 : Construire et constater l'échec**

Run: `bun run build && bun test tests/formulaires-pages.test.ts`
Expected: FAIL sur `inscriptions-petons.html`.

- [ ] **Step 3 : Modifier la page**

Dans `src/pages/inscriptions-petons.astro` :

1. Frontmatter : ajouter `import FormSubmitScript from '../components/FormSubmitScript.astro';`.
2. `<form id="admission-form" data-brevo action="mailto:contact@lespetons.fr" method="post" enctype="text/plain">`.
3. Juste après `<form …>` :

```html
          <div class="form-trap" aria-hidden="true"><label for="admission-piege">Ne pas remplir ce champ</label><input id="admission-piege" name="piege" type="text" tabindex="-1" autocomplete="off"></div>
```

4. Après le `<div class="field message-field">` et avant `<p class="required-note">` :

```html
          <label class="newsletter-optin"><input type="checkbox" name="newsletter" value="oui"><span>Je souhaite recevoir la lettre d’information des Petons</span></label>
```

5. Bouton : `Préparer ma demande` devient `Envoyer ma demande`. Paragraphe : `Votre messagerie s’ouvrira avec<br class="desktop-break"> votre demande prête à envoyer.` devient `Vous recevrez un accusé<br class="desktop-break"> de réception par e-mail.`
6. Juste avant `</form>` :

```html
          <p class="form-privacy">Les Petons dans l’Herbe utilisent ces informations pour répondre à votre demande et, si vous l’avez demandé, vous envoyer la lettre d’information. Elles sont hébergées par Brevo, notre prestataire d’envoi d’e-mails, et conservées 3 ans après notre dernier échange. Pour y accéder, les corriger ou les supprimer : contact@lespetons.fr.</p>
```

7. `<Footer /><script is:inline>(()=>{` devient `<Footer /><FormSubmitScript /><script is:inline>(()=>{`.
8. Dans le script : `form.addEventListener('submit',event=>{` devient `form.addEventListener('submit',async event=>{`. Remplacer les trois lignes `emailLink.href=url;…`, `status.textContent=…` et `window.location.href=url;` par :

```js
  const envoye=await envoyerFormulaire(form,'inscription',{parentName:value('parentName'),email:value('email'),phone:value('phone'),schoolStart:value('schoolStart'),childAge:value('childAge'),message:value('message'),newsletter:form.elements.newsletter.checked});
  if(envoye){afficherEnvoiReussi(form,'Merci, votre demande est bien partie. Vous allez recevoir un accusé de réception par e-mail, et nous revenons vers vous rapidement.');return;}
  emailLink.href=url;preview.value=preparedMessage;result.hidden=false;
  status.textContent='L’envoi n’a pas abouti. Vous pouvez nous écrire directement depuis votre messagerie, ou copier le message ci-dessous.';
```

9. Le paragraphe `#draft-status` du HTML contient un texte par défaut (`Envoyez votre demande depuis votre messagerie…`) : le vider (`<p role="status" id="draft-status"></p>`), car le script le remplit désormais.

- [ ] **Step 4 : Construire et lancer les tests**

Run: `bun run check`
Expected: PASS.

- [ ] **Step 5 : Vérifier dans le navigateur**

`http://localhost:4321/inscriptions-petons.html` : mêmes contrôles qu'à la Task 6, Step 6, avec un choix d'ambiance coché ; captures en 1280 px et en 375 px.

- [ ] **Step 6 : Commit**

```bash
git add src/pages/inscriptions-petons.astro tests/formulaires-pages.test.ts
git commit -m "Envoie la demande d’inscription à Brevo, avec repli sur la messagerie

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : Lettre d'information et page de confirmation

**Files:**
- Modify: `src/pages/actualites-petons.astro` (frontmatter, `IDENTIFIANTS_PAGE`, formulaire ligne 395, script)
- Create: `src/pages/lettre-confirmee.astro`
- Modify: `tests/formulaires-pages.test.ts`

**Interfaces:**
- Consumes: `FormSubmitScript` (Task 6) ; `brevo.pageConfirmationLettre === 'lettre-confirmee.html'` (Task 2).

- [ ] **Step 1 : Étendre le test**

Dans `tests/formulaires-pages.test.ts`, ajouter à `formulaires` :

```ts
  { page: 'actualites-petons.html', selecteur: '#newsletter-form', limites: LIMITES.lettre, caseLettre: false },
```

et, à la fin du fichier :

```ts
test('la page de confirmation de la lettre existe et n’est pas indexée', async () => {
  const { brevo } = await import('../src/data/brevo');
  const page = await chargerHtml(`${DOSSIER_PAGES}/${brevo.pageConfirmationLettre}`);
  expect(page.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
  expect(page.querySelector('h1')?.text).toContain('confirmé');
  expect(page.querySelector('a[href="actualites-petons.html"]')).not.toBeNull();
});
```

- [ ] **Step 2 : Construire et constater l'échec**

Run: `bun run build && bun test tests/formulaires-pages.test.ts`
Expected: FAIL sur `actualites-petons.html` et sur la page de confirmation.

- [ ] **Step 3 : Modifier le formulaire de la lettre**

Dans `src/pages/actualites-petons.astro` :

1. Frontmatter : ajouter `import FormSubmitScript from '../components/FormSubmitScript.astro';`.
2. Ajouter `'newsletter-piege'` à `IDENTIFIANTS_PAGE`, dans l'ordre alphabétique (après `'newsletter-mailto'`).
3. Ligne 395 : `<form class="newsletter-form" id="newsletter-form" data-brevo action="mailto:contact@lespetons.fr" method="post" enctype="text/plain">`, suivi immédiatement de :

```html
<div class="form-trap" aria-hidden="true"><label for="newsletter-piege">Ne pas remplir ce champ</label><input id="newsletter-piege" name="piege" type="text" tabindex="-1" autocomplete="off"></div>
```

4. Bouton : `Demander à recevoir la lettre` devient `Recevoir la lettre`. Paragraphe `.form-hint` : `Votre messagerie s’ouvrira pour envoyer votre demande d’abonnement.` devient `Un e-mail vous demandera de confirmer votre inscription.`
5. Juste avant `</form>` :

```html
<p class="form-privacy">Votre adresse sert uniquement à vous envoyer la lettre d’information des Petons. Elle est hébergée par Brevo et vous pouvez vous désinscrire à tout moment, via le lien présent dans chaque lettre ou en écrivant à contact@lespetons.fr.</p>
```

6. Ajouter `<FormSubmitScript />` juste avant la balise `<script is:inline>` qui contient `const form=document.querySelector('#newsletter-form')` (le script qui gère aussi les fenêtres).
7. Dans ce script, `form.addEventListener('submit',event=>{` devient `form.addEventListener('submit',async event=>{`. Remplacer la ligne `draft.value=message;mailto.href=url;result.hidden=false;status.textContent=…;` et la ligne `window.location.href=url;` par :

```js
  const envoye=await envoyerFormulaire(form,'lettre',{email:email.value.trim()});
  if(envoye){afficherEnvoiReussi(form,'Vérifiez votre boîte mail : un lien de confirmation vient de vous être envoyé.');return;}
  draft.value=message;mailto.href=url;result.hidden=false;status.textContent='L’envoi n’a pas abouti. Vous pouvez envoyer votre demande depuis votre messagerie, ou copier le message ci-dessous.';
```

- [ ] **Step 4 : Créer la page de confirmation**

Suivre « Ajouter une nouvelle page » d'`AGENTS.md` : copier `src/pages/tarifs-petons.astro` vers `src/pages/lettre-confirmee.astro`, puis :

- `<title>` : `Inscription confirmée | Les Petons dans l’Herbe · Nantes` ;
- `<meta name="description" content="Votre inscription à la lettre d’information des Petons dans l’Herbe est confirmée.">` ;
- ajouter `<meta name="robots" content="noindex">` après la description ;
- remplacer tout le contenu de `<main id="main">` par :

```html
<section class="wrap section">
  <span class="eyebrow">La lettre des Petons</span>
  <h1>Votre inscription est confirmée</h1>
  <p>Merci ! Vous recevrez désormais, une fois par mois, les temps forts de l’école et nos conseils Montessori.</p>
  <p><a class="button" href="actualites-petons.html">Voir les actualités de l’école</a></p>
</section>
```

- supprimer de `<style is:inline>` les règles propres aux tarifs qui ne servent plus. Garder les `@font-face`, les variables et les styles communs (`.wrap`, `.section`, `.eyebrow`, `.button`, header, footer). En cas de doute, garder la règle.

La page n'est pas ajoutée à `src/data/site.ts` (ni menu ni footer).

- [ ] **Step 5 : Construire et lancer les tests**

Run: `bun run check`
Expected: PASS, y compris `tests/page-actualites.test.ts` (identifiants uniques).

- [ ] **Step 6 : Vérifier dans le navigateur**

- `http://localhost:4321/actualites-petons.html#lettre` : envoi sans `.env`, le repli apparaît ; pas d'erreur console ; les fenêtres de stage s'ouvrent toujours ; captures en 1280 px et en 375 px.
- `http://localhost:4321/lettre-confirmee.html` : header, footer et polices s'affichent ; capture.

- [ ] **Step 7 : Commit**

```bash
git add src/pages/actualites-petons.astro src/pages/lettre-confirmee.astro tests/formulaires-pages.test.ts
git commit -m "Inscrit à la lettre par double confirmation Brevo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9 : Documentation

**Files:**
- Create: `docs/formulaires-brevo.md`
- Modify: `AGENTS.md` (tableau « Où modifier quoi »)

- [ ] **Step 1 : Écrire le guide**

Créer `docs/formulaires-brevo.md` avec les sections suivantes, en français, pour une personne non développeuse :

1. **Ce que font les formulaires** : tableau formulaire → notification, accusé, liste, double confirmation (repris de la spec, section « Traitement ») ; règle « notification indispensable, le reste au mieux » ; repli sur la messagerie.
2. **Configurer Brevo, pas à pas** :
   1. authentifier `lespetons.fr` (Brevo → Expéditeurs, domaines et IP dédiées → Domaines) et valider l'expéditeur `contact@lespetons.fr` ;
   2. créer les trois listes et noter leur numéro (colonne ID) ;
   3. créer les attributs texte `NOM_COMPLET`, `TELEPHONE`, `STRUCTURE`, `RENTREE_SOUHAITEE`, `TRANCHE_AGE` (Contacts → Paramètres → Attributs) : un attribut inconnu fait échouer l'enregistrement du contact ;
   4. créer les cinq modèles ; pour chacun, la liste de ses `params` (tableau « Paramètres des modèles » de la spec) avec un exemple `{{ params.nom }}` ; conseiller `white-space: pre-line` sur le bloc du message pour garder les retours à la ligne ; le modèle de double confirmation doit contenir un bouton dont le lien est `{{ params.DOIurl }}` ;
   5. reporter les numéros dans `src/data/brevo.ts` (montrer un exemple rempli) ;
   6. créer une clé API dédiée (« site lespetons.fr »), la ranger dans Vercel → Settings → Environment Variables sous `BREVO_API_KEY` (Production et Preview), redéployer ; vérifier dans Brevo (Sécurité → IP autorisées) que le blocage des adresses IP inconnues est désactivé, sinon Vercel est refusé.
3. **Tester en local** : copier `.env.example` en `.env`, y mettre une clé, `bun run dev`, envoyer chaque formulaire avec une adresse de test.
4. **Que se passe-t-il si…** : configuration incomplète (503 → messagerie), Brevo en panne, spam (réponse de succès simulée, rien n'est envoyé), lecture des journaux Vercel (préfixe `[formulaire]`, jamais de données personnelles).
5. **Hébergement Docker/nginx** : pas de route serveur, donc les formulaires restent en mode messagerie.
6. **Points à surveiller** : HTML neutralisé dans les `params` (résultat de la vérification de la Task 10) ; prérequis restants (authentification du domaine, restriction IP).

- [ ] **Step 2 : Mettre à jour `AGENTS.md`**

Ajouter au tableau « Où modifier quoi », après la ligne du script du menu mobile :

```markdown
| Les formulaires (contact, inscription, lettre) et leur envoi à Brevo | Textes : la page concernée ; numéros Brevo : `src/data/brevo.ts` ; logique serveur : `src/lib/formulaires/` ; guide : `docs/formulaires-brevo.md` |
```

- [ ] **Step 3 : Vérifier**

Run: `bun run check`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add docs/formulaires-brevo.md AGENTS.md
git commit -m "Documente la configuration Brevo des formulaires

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10 : Vérification réelle avec Brevo et Vercel

Cette tâche demande une clé Brevo et l'accès au projet Vercel : elle se fait **avec la personne**, pas en autonomie. Aucun envoi réel sans son accord explicite.

- [ ] **Step 1 : Configuration de test**

La personne crée dans Brevo les listes, attributs et modèles (`docs/formulaires-brevo.md`), puis donne les numéros. Les reporter dans `src/data/brevo.ts`. La personne place elle-même sa clé dans `.env` : ne jamais la lire, l'afficher ni la recopier.

- [ ] **Step 2 : Envois réels en local**

`bun run dev`, puis, avec une adresse de test fournie par la personne :

- contact sans case lettre → notification (avec `replyTo` du visiteur) et accusé reçus ; contact présent dans la liste « Contact site » avec ses attributs ;
- contact avec case lettre → en plus, e-mail de double confirmation ; après le clic, arrivée sur `lettre-confirmee.html` et contact dans « Lettre d’information » ;
- inscription → modèles d'inscription et liste « Demandes d’inscription » ;
- lettre seule → e-mail de double confirmation ;
- message contenant `<b>gras</b> & "guillemets"` → noter comment il s'affiche dans la notification.

- [ ] **Step 3 : Trancher l'échappement**

- Le message s'affiche littéralement `<b>gras</b> & "guillemets"` : la neutralisation de `traitement.ts` est correcte, la garder.
- Il s'affiche `&lt;b&gt;gras…` (double neutralisation) : Brevo neutralise déjà. Dans `src/lib/formulaires/traitement.ts`, remplacer `neutraliser(envoi.notification.params)` et `neutraliser(envoi.accuse.params)` par les `params` bruts, supprimer `neutraliser` et l'import d'`echapper`, et mettre à jour les attentes de `tests/formulaires-traitement.test.ts` (`nom: 'Camille <b>M</b>'`).

Consigner le résultat dans `docs/formulaires-brevo.md` (section « Points à surveiller »), puis faire un commit.

- [ ] **Step 4 : Déploiement de prévisualisation**

Pousser la branche, ouvrir le déploiement de prévisualisation Vercel (la clé doit être définie pour l'environnement Preview) :

- `index.html`, `contact-petons.html`, `actualites-petons.html` et une ancre (`actualites-petons.html#stage-fevrier-2027`) répondent comme en production ;
- les trois formulaires vont jusqu'au bout ; `/api/formulaire` refuse une origine étrangère (`curl -H 'origin: https://pirate.example'` → 403) ;
- les journaux Vercel n'affichent que des lignes `[formulaire] {"formulaire":…,"etape":…,"statut":…}`.

- [ ] **Step 5 : Fin de branche**

Utiliser superpowers:finishing-a-development-branch.
