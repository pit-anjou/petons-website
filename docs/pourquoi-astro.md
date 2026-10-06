# Qu'est-ce qu'on gagne à passer sous Astro ?

*Analyse fondée sur l’état du site début octobre 2026 (11 pages, ~925 Ko de HTML, avant l’ajout de la page Soutenir).*

## En bref

Avec le POC tel qu'il est (HTML chargé tel quel), on ne gagne **rien de visible** : le site produit est identique à l'octet près. Ce qu'on gagne, c'est la possibilité d'activer ensuite, page par page, quatre gains concrets. Les deux premiers justifient à eux seuls la migration.

## 1. Arrêter de dupliquer : header, footer, menu, coordonnées

Constat dans le code actuel :

- Le **header et le footer** (~6 Ko par page) sont copiés dans les 11 pages. Ils ne diffèrent que par le lien actif (`aria-current="page"`, `is-current-parent`), qui est écrit à la main sur chaque page.
- Le **script du menu** (~1,8 Ko) est recopié 11 fois.
- Les coordonnées sont répétées : le téléphone apparaît 13 fois, l'adresse 16 fois.

Aujourd'hui, ajouter une entrée au menu ou changer un numéro de téléphone demande de modifier 11 fichiers sans en oublier un. Avec Astro, on aurait **un seul** composant `<Header />`, qui calcule tout seul le lien actif à partir de l'URL, et un fichier de données unique pour les coordonnées.

**Gain** : moins d'oublis et des diffs/PR plus petits. Cela vaut aussi pour les modifications faites par Codex ou Claude : un agent qui édite un composant ne peut pas laisser une page sur onze dans un état incohérent.

## 2. Des images adaptées au mobile (gain de performance réel)

Constat :

- 108 balises `<img>`, **aucune avec `srcset`**.
- Les images font jusqu'à ~1 500 px de large et 250 à 570 Ko (`le-chemin-des-renards…webp` : 567 Ko).
- Un téléphone télécharge donc la même image qu'un écran de bureau.

Le composant `<Image />` / `<Picture />` d'Astro génère automatiquement au build plusieurs tailles (`srcset`), avec `width`/`height` et compression. Le poids des images sur mobile peut typiquement baisser de 50 à 70 %. C'est le gain le plus perceptible pour les familles qui consultent le site sur leur téléphone.

## 3. CSS : moins de poids, et un CSS mis en cache

Constat :

- **526 Ko de CSS inline** au total, de 28 à 87 Ko par page.
- Environ **157 Ko** de règles sont recopiées d'une page à l'autre (fonts, header, footer, boutons…).
- Le CSS étant inline, le navigateur le retélécharge à chaque page visitée.

Avec Astro, le CSS commun irait dans un fichier partagé que le navigateur met en cache. Chaque page ne garderait que ses styles propres, avec les styles *scopés* par composant, qui ne débordent pas sur le reste. Astro choisit seul entre inline et fichier selon la taille.

## 4. Contenu éditable sans toucher au HTML

La page **Agenda & actualités** contient des événements et des articles écrits en dur dans le HTML (cartes, modales). Avec les *content collections* d'Astro, chaque événement deviendrait un petit fichier Markdown (titre, date, image, texte). La page se générerait toute seule, triée par date, et les événements passés pourraient être archivés automatiquement.

**Gain** : une personne de l'équipe peut ajouter un événement sans manipuler 70 Ko de HTML. Le même principe s'applique aux tarifs (une seule source pour l'année scolaire en cours, au lieu de « 2026 » répété 17 fois).

## Bonus

- **Zéro JavaScript ajouté** : Astro n'envoie aucun JS par défaut. Le site reste aussi léger qu'aujourd'hui.
- **Vérifications au build** : une image importée via `<Image />` qui n'existe pas fait échouer le build au lieu d'arriver cassée en production. Pour les liens internes cassés, il faut ajouter une intégration de vérification : Astro ne le fait pas nativement.
- **SEO centralisé** : balises `<title>`, `description`, Open Graph, JSON-LD et sitemap générés depuis un seul layout.
- **Serveur de dev avec rechargement à chaud.**

## Ce que ça coûte

- **Une étape de build** (`bun run build`) et une dépendance Node/Bun. Le site ne se déploie plus en copiant simplement les fichiers ; c'est déjà géré dans le `Dockerfile.vercel` du POC.
- **Les fichiers changent d'emplacement** (`src/pages/`, `public/assets/`), et les branches en cours doivent être rebasées.
- **Courbe d'apprentissage** légère : la syntaxe `.astro` est du HTML avec un en-tête de code.
- Pour un site de 11 pages, le gain ne vient **pas** de la performance du framework. Il vient de la **maintenance** (points 1 et 4) et des **images** (point 2). Si le site devait rester figé, la migration ne se justifierait pas.

## Ordre suggéré

1. Composants `<Header />` / `<Footer />` + données de contact → gain immédiat sur les 11 pages, risque faible.
2. `<Image />` sur les plus grosses images → gain de performance mesurable (à vérifier avec Lighthouse avant/après).
3. Extraction du CSS commun.
4. Agenda en content collection.

Chaque étape est indépendante : les pages non migrées continuent de fonctionner en `.html` brut.
