# Consignes pour modifier le site des Petons

Le site est construit avec [Astro](https://astro.build). Le résultat publié reste du HTML statique, mais les fichiers sources ne sont plus des `.html` à la racine.

## Où modifier quoi

| Je veux modifier… | Fichier |
| --- | --- |
| Le texte, les images ou la mise en page d'une page | `src/pages/<page>.astro` (ex. `src/pages/tarifs-petons.astro`) |
| Les programmes et sessions de stage, rendez-vous et articles de la page Actualités | Page CMS (voir `docs/page-cms.md`) ou les fichiers de `src/content/programmes/`, `src/content/stages/`, `src/content/rendez-vous/`, `src/content/articles/` |
| Les portes ouvertes de novembre (carte de l'agenda, fenêtre) et le bandeau d'annonce du site | `src/data/openHouse.ts` (textes, dates), `src/components/OpenHouseAnnouncement.astro` (bandeau ; styles et script dans `src/styles/open-house-announcement.css` et `src/scripts/open-house-announcement.js`) ; carte et fenêtre dans `src/pages/actualites-petons.astro` |
| La mise en page des fenêtres de stage (types de blocs, « En pratique ») | `src/components/actualites/StageDialog.astro`, `ProgrammeSection.astro` |
| Le menu, les liens du footer, l'adresse, le téléphone, l'email, Instagram, l'encart « Dons & mécénat » | `src/data/site.ts` (une seule fois pour tout le site) |
| La structure HTML du header ou du footer | `src/components/Header.astro`, `src/components/Footer.astro` |
| Le script du menu mobile et des sous-menus | `src/components/SiteNavScript.astro` |
| Les formulaires (contact, inscription, lettre) et leur envoi à Brevo | Textes : la page concernée ; numéros Brevo : `src/data/brevo.ts` ; logique serveur : `src/lib/formulaires/` ; guide : `docs/formulaires-brevo.md` |
| Les styles de l'encart « Dons & mécénat » et des illustrations animées | `src/styles/support-footer.css`, `src/styles/enfants-animes.css` (écrits dans chaque page par `<SupportFooterStyles />` et `<EnfantsAnimesStyles />`) |
| Ajouter ou remplacer une image, une vidéo, une police | `public/assets/…` (référencée dans les pages par `assets/…`, sans `public/`) |
| Les versions réduites des images (téléphones) | Rien à faire : produites au build par `src/integrations/images-adaptees.ts` (voir la règle 8) |
| Le titre et la description d'une page (onglet, moteurs de recherche, aperçu de partage) | `<Referencement title="…" description="…" />` dans le `<head>` de la page |
| Le domaine du site (canonical, Open Graph, sitemap.xml, robots.txt, JSON-LD) et l'image de partage par défaut | `site` dans `astro.config.mjs` (une seule fois) ; balises et image dans `src/components/Referencement.astro` |
| Les données structurées (JSON-LD) : l'école, ses horaires, l'association, l'événement des portes ouvertes | `src/data/donneesStructurees.ts` (coordonnées reprises de `src/data/site.ts`, dates de `src/data/openHouse.ts`) ; vérifiées par `tests/referencement.test.ts` |
| Les redirections des adresses de l'ancien site WordPress | `src/data/redirections.ts` et `tests/redirections.test.ts` ; plan dans `docs/plan-de-redirection.md` |

Ne jamais modifier `dist/` : ce dossier est regénéré à chaque build.

## Règles à respecter dans les fichiers `.astro`

Un fichier `.astro` ressemble à du HTML, mais quelques caractères y ont un sens particulier.

1. **Pas d'accolades `{` ou `}` dans le texte.** Astro les lit comme du code et le build échoue (`ReferenceError`, `CompilerError`). Pour afficher une accolade, écrire `&#123;` et `&#125;`. Les accolades restent permises dans une valeur d'attribut entre guillemets (`title="…{…}…"`) et à l'intérieur des balises `<style is:inline>` et `<script is:inline>`.
2. **Toujours écrire `<style is:inline>` et `<script is:inline>`**, jamais `<style>` ou `<script>` seuls. Sans `is:inline`, Astro limite les styles à la page : les règles visant le header ou le footer cessent de s'appliquer **sans aucun message d'erreur**, et les scripts sont déplacés ou regroupés.
3. **Ne pas recopier le HTML du header ou du footer dans une page.** Chaque page contient seulement `<Header />`, `<Footer />` et `<SiteNavScript />`. Pour changer un lien du menu ou une coordonnée, modifier `src/data/site.ts`.
4. **Ne pas écrire `aria-current="page"` ni `is-current-parent` à la main** dans le header ou le footer : ils sont calculés automatiquement à partir de l'adresse de la page.
5. **Écrire les liens internes sans `.html`** : `href="contact-petons"`, `href="actualites-petons#agenda"`, et `href="/"` pour l'accueil. Les pages sont publiées à `/contact-petons` ; l'ancienne forme `/contact-petons.html` redirige vers elle. Seul l'attribut `data-local-href` (ouverture des fichiers en local) garde le `.html`. `bun test` signale tout lien vers une page inexistante ou écrit avec `.html`.
6. **Garder le bloc d'en-tête en haut de chaque page** (entre les deux lignes `---`) : il importe les composants. Le supprimer casse le build.
7. **Un lien qui ouvre un nouvel onglet (`target="_blank"`) doit le dire** : ajouter `<span class="sr-only"> (nouvel onglet)</span>` avant `</a>`, et définir `.sr-only` dans la page si elle ne l'a pas. `bun test` signale tout oubli.
8. **Images : écrire simplement `<img src="assets/img/…" alt="…" width="…" height="…">`**, sans redimensionner à la main. Au build, chaque image PNG, JPEG ou WebP reçoit des versions WebP de 320 à 1600 px et un `srcset` : un téléphone télécharge la petite. Ajouter `loading="lazy"` à toute image qui n'est pas visible à l'ouverture de la page. Sans `sizes`, le build suppose une image en pleine largeur sur mobile (600 px au-delà) : pour une petite image (icône, vignette, portrait), indiquer sa largeur affichée, par exemple `sizes="130px"`. Pour l'image principale du haut de page, ajouter `fetchpriority="high"` et sa largeur affichée, par exemple `sizes="(max-width: 700px) calc(100vw - 48px), 570px"`. `bun test` signale une image sans `width` ou `height`.

## Actualités et Page CMS

1. **Ne pas réécrire en HTML les stages, rendez-vous ou articles** dans `src/pages/actualites-petons.astro` : ils viennent des fichiers de `src/content/` et s’affichent via les composants de `src/components/actualites/`.
2. **Un nouveau champ se déclare à deux endroits** : `src/content/schemas.ts` et `.pages.yml`. Sinon, Page CMS l’efface au prochain enregistrement. `bun test` signale tout écart.
3. **Les images des actualités vont dans `public/assets/img/actualites/`** et sont référencées en `assets/img/actualites/…`.
4. **Ne pas renommer** `stage-fevrier-2027.yml` ni `eco-ecole-solidarites.md` : la page d’accueil pointe vers ces ancres.
5. Vérifier avec `bun run check` (build puis tests) au lieu de `bun run build` seul.

## Données structurées (JSON-LD)

Chaque page décrit l'école aux moteurs de recherche et aux IA (`src/data/donneesStructurees.ts`). **Toute modification d'une information sur l'école doit y être reportée**, sinon Google et les IA affichent des informations périmées.

1. **Mis à jour automatiquement** : l'adresse, l'email, Instagram et le logo (`src/data/site.ts`) ; la date, les horaires, le texte et l'image des portes ouvertes (`src/data/openHouse.ts`). Modifier ces fichiers suffit.
2. **À mettre à jour à la main dans `src/data/donneesStructurees.ts`** quand le site change : les jours et horaires d'ouverture (aujourd'hui lundi, mardi, jeudi et vendredi, de 8h15 à 18h15, périscolaire compris), les âges accueillis (3–12 ans), le nom de l'association (Constellation Montessori), l'année d'ouverture (2018), la description (jardin, label Eco-École, statut hors contrat) et les communes desservies.
3. **Ajout d'un téléphone** dans `src/data/site.ts` : l'ajouter aussi à l'école (`telephone`).
4. **Nouvelles portes ouvertes** : changer les dates dans `src/data/openHouse.ts`. L'événement n'est publié que sur la page Actualités (`portesOuvertes` sur `<Referencement />`).
5. Vérifier avec `bun run check` (`tests/referencement.test.ts`), puis, après mise en ligne, passer `/` et `/actualites-petons` dans le test des résultats enrichis de Google.

## Ajouter une nouvelle page

1. Copier une page existante proche dans `src/pages/`, par exemple `tarifs-petons.astro` vers `ma-page.astro`. Elle sera publiée à l'adresse `/ma-page`.
2. Remplacer le titre et la description dans `<Referencement … />`, puis le contenu de `<main>`.
3. Si elle doit apparaître dans le menu ou le footer, l'ajouter dans `src/data/site.ts` (`mainNav` ou `footerNav`).

## Vérifier avant de proposer une modification

```bash
bun install
bun run build
```

Le build doit se terminer par `page(s) built` sans `[ERROR]`. Pour voir le site en local avec rechargement automatique :

```bash
bun run dev
```

Puis ouvrir http://localhost:4321.
