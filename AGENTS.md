# Consignes pour modifier le site des Petons

Le site est construit avec [Astro](https://astro.build). Le résultat publié reste du HTML statique, mais les fichiers sources ne sont plus des `.html` à la racine.

## Où modifier quoi

| Je veux modifier… | Fichier |
| --- | --- |
| Le texte, les images ou la mise en page d'une page | `src/pages/<page>.astro` (ex. `src/pages/tarifs-petons.astro`) |
| Le menu, les liens du footer, l'adresse, le téléphone, l'email, Instagram, l'encart « Dons & mécénat » | `src/data/site.ts` (une seule fois pour tout le site) |
| La structure HTML du header ou du footer | `src/components/Header.astro`, `src/components/Footer.astro` |
| Le script du menu mobile et des sous-menus | `src/components/SiteNavScript.astro` |
| Ajouter ou remplacer une image, une vidéo, une police | `public/assets/…` (référencée dans les pages par `assets/…`, sans `public/`) |

Ne jamais modifier `dist/` : ce dossier est regénéré à chaque build.

## Règles à respecter dans les fichiers `.astro`

Un fichier `.astro` ressemble à du HTML, mais quelques caractères y ont un sens particulier.

1. **Pas d'accolades `{` ou `}` dans le texte.** Astro les lit comme du code et le build échoue (`ReferenceError`, `CompilerError`). Pour afficher une accolade, écrire `&#123;` et `&#125;`. Les accolades restent permises dans une valeur d'attribut entre guillemets (`title="…{…}…"`) et à l'intérieur des balises `<style is:inline>` et `<script is:inline>`.
2. **Toujours écrire `<style is:inline>` et `<script is:inline>`**, jamais `<style>` ou `<script>` seuls. Sans `is:inline`, Astro limite les styles à la page : les règles visant le header ou le footer cessent de s'appliquer **sans aucun message d'erreur**, et les scripts sont déplacés ou regroupés.
3. **Ne pas recopier le HTML du header ou du footer dans une page.** Chaque page contient seulement `<Header />`, `<Footer />` et `<SiteNavScript />`. Pour changer un lien du menu ou une coordonnée, modifier `src/data/site.ts`.
4. **Ne pas écrire `aria-current="page"` ni `is-current-parent` à la main** dans le header ou le footer : ils sont calculés automatiquement à partir de l'adresse de la page.
5. **Garder les liens internes sous la forme `nom-de-page.html`** (ex. `href="contact-petons.html"`) : les adresses publiées se terminent par `.html` et doivent rester stables pour le référencement.
6. **Garder le bloc d'en-tête en haut de chaque page** (entre les deux lignes `---`) : il importe les composants. Le supprimer casse le build.

## Ajouter une nouvelle page

1. Copier une page existante proche dans `src/pages/`, par exemple `tarifs-petons.astro` vers `ma-page.astro`. Elle sera publiée à l'adresse `ma-page.html`.
2. Remplacer le titre, la description et le contenu de `<main>`.
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
