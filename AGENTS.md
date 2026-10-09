# Consignes pour modifier le site des Petons

Le site est construit avec [Astro](https://astro.build). Le résultat publié reste du HTML statique, mais les fichiers sources ne sont plus des `.html` à la racine.

## Où modifier quoi

| Je veux modifier… | Fichier |
| --- | --- |
| Le texte, les images ou la mise en page d'une page | `src/pages/<page>.astro` (ex. `src/pages/tarifs-petons.astro`) |
| Les programmes et sessions de stage, rendez-vous et articles de la page Actualités | Page CMS (voir `docs/page-cms.md`) ou les fichiers de `src/content/programmes/`, `src/content/stages/`, `src/content/rendez-vous/`, `src/content/articles/` |
| Les portes ouvertes de novembre (carte de l'agenda, fenêtre) et le bandeau d'annonce du site | `src/data/openHouse.ts` (textes, dates), `src/components/OpenHouseAnnouncement.astro` (bandeau) ; carte et fenêtre dans `src/pages/actualites-petons.astro` |
| La mise en page des fenêtres de stage (types de blocs, « En pratique ») | `src/components/actualites/StageDialog.astro`, `ProgrammeSection.astro` |
| Le menu, les liens du footer, l'adresse, le téléphone, l'email, Instagram, l'encart « Dons & mécénat » | `src/data/site.ts` (une seule fois pour tout le site) |
| La structure HTML du header ou du footer | `src/components/Header.astro`, `src/components/Footer.astro` |
| Le script du menu mobile et des sous-menus | `src/components/SiteNavScript.astro` |
| Les formulaires (contact, inscription, lettre) et leur envoi à Brevo | Textes : la page concernée ; numéros Brevo : `src/data/brevo.ts` ; logique serveur : `src/lib/formulaires/` ; guide : `docs/formulaires-brevo.md` |
| Ajouter ou remplacer une image, une vidéo, une police | `public/assets/…` (référencée dans les pages par `assets/…`, sans `public/`) |
| Le titre et la description d'une page (onglet, moteurs de recherche, aperçu de partage) | `<Referencement title="…" description="…" />` dans le `<head>` de la page |
| Le domaine du site (canonical, Open Graph, sitemap.xml, robots.txt, JSON-LD) et l'image de partage par défaut | `site` dans `astro.config.mjs` (une seule fois) ; balises et image dans `src/components/Referencement.astro` |
| Les redirections des adresses de l'ancien site WordPress | `src/data/redirections.ts` et `tests/redirections.test.ts` ; plan dans `docs/plan-de-redirection.md` |

Ne jamais modifier `dist/` : ce dossier est regénéré à chaque build.

## Règles à respecter dans les fichiers `.astro`

Un fichier `.astro` ressemble à du HTML, mais quelques caractères y ont un sens particulier.

1. **Pas d'accolades `{` ou `}` dans le texte.** Astro les lit comme du code et le build échoue (`ReferenceError`, `CompilerError`). Pour afficher une accolade, écrire `&#123;` et `&#125;`. Les accolades restent permises dans une valeur d'attribut entre guillemets (`title="…{…}…"`) et à l'intérieur des balises `<style is:inline>` et `<script is:inline>`.
2. **Toujours écrire `<style is:inline>` et `<script is:inline>`**, jamais `<style>` ou `<script>` seuls. Sans `is:inline`, Astro limite les styles à la page : les règles visant le header ou le footer cessent de s'appliquer **sans aucun message d'erreur**, et les scripts sont déplacés ou regroupés.
3. **Ne pas recopier le HTML du header ou du footer dans une page.** Chaque page contient seulement `<Header />`, `<Footer />` et `<SiteNavScript />`. Pour changer un lien du menu ou une coordonnée, modifier `src/data/site.ts`.
4. **Ne pas écrire `aria-current="page"` ni `is-current-parent` à la main** dans le header ou le footer : ils sont calculés automatiquement à partir de l'adresse de la page.
5. **Garder les liens internes sous la forme `nom-de-page.html`** (ex. `href="contact-petons.html"`) : les adresses publiées se terminent par `.html` et doivent rester stables pour le référencement.
6. **Garder le bloc d'en-tête en haut de chaque page** (entre les deux lignes `---`) : il importe les composants. Le supprimer casse le build.
7. **Un lien qui ouvre un nouvel onglet (`target="_blank"`) doit le dire** : ajouter `<span class="sr-only"> (nouvel onglet)</span>` avant `</a>`, et définir `.sr-only` dans la page si elle ne l'a pas. `bun test` signale tout oubli.

## Actualités et Page CMS

1. **Ne pas réécrire en HTML les stages, rendez-vous ou articles** dans `src/pages/actualites-petons.astro` : ils viennent des fichiers de `src/content/` et s’affichent via les composants de `src/components/actualites/`.
2. **Un nouveau champ se déclare à deux endroits** : `src/content/schemas.ts` et `.pages.yml`. Sinon, Page CMS l’efface au prochain enregistrement. `bun test` signale tout écart.
3. **Les images des actualités vont dans `public/assets/img/actualites/`** et sont référencées en `assets/img/actualites/…`.
4. **Ne pas renommer** `stage-fevrier-2027.yml` ni `eco-ecole-solidarites.md` : la page d’accueil pointe vers ces ancres.
5. Vérifier avec `bun run check` (build puis tests) au lieu de `bun run build` seul.

## Ajouter une nouvelle page

1. Copier une page existante proche dans `src/pages/`, par exemple `tarifs-petons.astro` vers `ma-page.astro`. Elle sera publiée à l'adresse `ma-page.html`.
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
