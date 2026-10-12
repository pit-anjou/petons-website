# Plan de redirection : ancien site WordPress → nouveau site Astro

Relevé du 9 octobre 2026 sur https://ecolemontessorinantes.com/.

## 1. Ce qu'il y a sur l'ancien site

- **Moteur** : WordPress (thème Divi, extension Yoast SEO), hébergé chez **OVH** (Apache, IP 54.36.91.62). Le domaine est enregistré chez OVH jusqu'au **26 juin 2027**.
- **Adresses** : toutes en `/slug/`, avec une barre finale. `www.` et `http://` sont déjà redirigés vers `https://ecolemontessorinantes.com/`.
- **Inventaire** : 14 pages, une archive « portfolio » avec 3 fiches APE, aucun article. Les 6 catégories et 17 étiquettes sont vides et viennent de la démo du thème. Il y a aussi 16 PDF (années 2018-2022) et 3 vidéos dans `/wp-content/uploads/`.
- **Messagerie** : le domaine reçoit des emails via **Google Workspace** (`MX 1 smtp.google.com`). La bascule ne doit pas casser la messagerie, voir §4.

Sources : `sitemap_index.xml` (Yoast), l'API `wp-json/wp/v2` (pages, articles, catégories, étiquettes, médias) et le menu de la page d'accueil.

## 2. Table de correspondance

Ces règles sont dans `src/data/redirections.ts`, avec la syntaxe des redirections Vercel. Au build, `src/integrations/redirections-vercel.ts` les écrit dans le routage produit par l’adaptateur Vercel (`.vercel/output/config.json`) : l’adaptateur ne reprend pas les redirections de `vercel.json`. Toutes sont permanentes (308) et marchent avec ou sans barre finale. Le test `tests/redirections.test.ts` vérifie chaque ligne, et leur présence dans le routage construit.

Les pages du nouveau site sont publiées sans extension (`/tarifs-petons`). La même intégration redirige `/tarifs-petons.html` vers `/tarifs-petons` et `/index.html` vers `/` (308), et `/tarifs-petons/` perd sa barre finale : une seule adresse par page pour les moteurs de recherche.

| Ancienne adresse | Nouvelle page | Pourquoi |
| --- | --- | --- |
| `/` | `/` (inchangée) | Accueil |
| `/ecole-montessori-nantes/` | `/` | Ancienne page d'accueil de 2019 |
| `/lecole/` | `/ecole-petons` | Histoire, lieu, organisation de l'école |
| `/qui-sommes-nous/` (et `#equipe`) | `/equipe-petons` | Présentation de l'équipe |
| `/nous-rejoindre/` | `/equipe-petons#rejoindre` | Candidatures → « Vous souhaitez rejoindre l'équipe ? » |
| `/nos-valeurs/` (et `#ecocitoyenne`, `#montessori`) | `/pedagogie-petons` | Menu « Le projet pédagogique » et « Pédagogie Montessori » |
| `/la-vie-a-lecole/` | `/vie-pratique-petons` | Déroulement de la journée, horaires |
| `/informations-pratiques/` | `/vie-pratique-petons` | Lieu, horaires, organisation de l'année |
| `/portfolio/role-de-lape/`, `/portfolio/roles-des-membres-de-lape/`, `/portfolio/election-du-bureau/` | `/equipe-petons#association` | Fiches APE → bureau de l'association (revu le 12 octobre 2026) |
| `/portfolio/` et toute autre fiche `/portfolio/*` | `/vie-pratique-petons#familles` | « Les familles à l'école » (parents, APE) |
| `/journees-portes-ouvertes/` | `/actualites-petons#portes-ouvertes` | Carte « portes ouvertes » de l'agenda |
| `/tarifs/` | `/tarifs-petons` | Tarifs |
| `/inscription/` | `/inscriptions-petons` | Processus d'inscription |
| `/contact/` | `/contact-petons` | Contact |
| `/boite-a-idees/` | `/contact-petons` | Page vide sur l'ancien site |
| `/la-creche/` | `/` | **À décider** : la micro-crèche a fermé le 30 juin 2026 et n'a pas d'équivalent |
| `/le-lieu/` | `/ecole-petons` | Déjà en 404 sur l'ancien site, encore 8e dans Google (Search Console, 12 octobre 2026) |
| `/wp-content/uploads/2018/07/Dossier_Inscription_LPDLH_2018_2019.pdf` | `/inscriptions-petons` | Ancien dossier d'inscription, qui reçoit encore des clics |
| `/feed/` | `/actualites-petons` | Flux RSS WordPress |
| `/category/*`, `/tag/*` | `/` | Taxonomies vides, au cas où Google les aurait indexées |

Volontairement **sans** redirection (elles renverront une erreur 404) :

- `/wp-admin`, `/wp-login.php`, `/xmlrpc.php`, `/wp-json/`, `/comments/feed/` : propres à WordPress.
- `/wp-content/uploads/…` : les PDF de 2018 à 2022 (règlement intérieur, grilles tarifaires, dossiers d'inscription) sont périmés. Seul le dossier d'inscription 2018-2019, relevé par la Search Console, est redirigé (voir le tableau). Si un autre PDF apparaît dans la Search Console ou un outil de liens entrants, ajouter une règle vers la page actuelle (tarifs ou inscriptions).

Les ancres (`#equipe`, `#ecocitoyenne`…) ne sont jamais envoyées au serveur. Si la destination n'a pas d'ancre, le navigateur garde celle d'origine ; aucun `id` de la nouvelle page ne correspondant, la page s'ouvre en haut.

## 3. Le domaine du nouveau site

**Décision du 9 octobre 2026 : pour l'instant, on garde `ecolemontessorinantes.com` (scénario A).**

**Décision du 12 octobre 2026 : le domaine principal est `https://www.ecolemontessorinantes.com`.** Canonical, `og:url`, JSON-LD, sitemap et robots.txt en découlent (`site` dans `astro.config.mjs`, figé par `tests/referencement.test.ts`). Le domaine nu `ecolemontessorinantes.com` redirige vers `www` dans Vercel, en une seule redirection permanente. Cette règle inverse celle de l'ancien WordPress (`www` → domaine nu). Le nouveau site est déployé sur Vercel (`ecolemontessorinantes.vercel.app`). Pour mémoire, les deux scénarios étudiés :

**A. Garder `ecolemontessorinantes.com` (retenu).** On fait pointer le domaine vers Vercel, les règles ci-dessus suffisent. C'est le scénario le plus sûr pour le référencement, car Google ne voit qu'un changement d'adresses, pas un déménagement.

**B. Passer à un nouveau domaine.** Il faut alors en plus rediriger l'ancien domaine vers le nouveau, page par page, en une seule redirection plutôt que deux à la suite, et déclarer le changement d'adresse dans la Search Console. C'est plus de travail et plus risqué pour le référencement.

> Le site affichait l'adresse `contact@lespetons.fr`, or le 9 octobre 2026 **le domaine `lespetons.fr` n'était pas enregistré** (whois AFNIC : « NOT FOUND ») : les emails envoyés à cette adresse n'arrivaient nulle part. **Décision du 11 octobre 2026 : l'adresse de l'école est `contact@ecolemontessorinantes.com`** (`src/data/site.ts`), sur la messagerie Google Workspace du domaine. Les formulaires Brevo envoient eux aussi depuis ce domaine (voir `docs/formulaires-brevo.md`).

## 4. Étapes de la bascule (scénario A)

### Avant la bascule

1. **Search Console** : vérifier que la propriété `ecolemontessorinantes.com` existe, ou la créer, et exporter les pages et liens entrants qui comptent (« Pages », « Liens »). Si une adresse absente du tableau du §2 apparaît, ajouter une règle et une ligne au test.
2. **Le domaine est déclaré dans `astro.config.mjs`** (`site: 'https://www.ecolemontessorinantes.com'`). Les éléments suivants en découlent automatiquement, déjà en place et vérifiés par `tests/referencement.test.ts` :
   - une balise `<link rel="canonical">` par page (`src/components/Referencement.astro`), qui désigne l’adresse sans `.html` de la page ;
   - les balises Open Graph et la carte X/Twitter de chaque page (`og:url`, `og:image`…) ;
   - le JSON-LD des pages Chenilles, Papillons et Pédagogie, qui pointait jusqu'ici vers `ecolemontessorinantes.vercel.app` ;
   - `/sitemap.xml` (`src/pages/sitemap.xml.ts`), qui liste toute page ajoutée dans `src/pages/`, sauf celles marquées `noindex` (comme `lettre-confirmee`) ;
   - `/robots.txt` (`src/pages/robots.txt.ts`), qui annonce le sitemap.
3. Avant la bascule, les canonical et les aperçus de partage du déploiement `vercel.app` désignent déjà `ecolemontessorinantes.com`, qui sert encore l'ancien WordPress. Ce n'est pas gênant, puisque l'adresse de prévisualisation n'a pas vocation à être référencée. Conséquence à connaître : un lien `vercel.app` partagé avant la bascule s'affiche sans image, car `og:image` pointe vers une image que l'ancien site ne sert pas. Si l'on revient un jour sur le choix du domaine, il suffit de changer `site` avant de soumettre le sitemap.
4. **Baisser le TTL** des enregistrements DNS `A` et `www` chez OVH (par exemple à 300 s) **48 h avant** la bascule.
5. Ajouter `ecolemontessorinantes.com` et `www.ecolemontessorinantes.com` dans Vercel (Project → Settings → Domains). Depuis le 12 octobre 2026, `www.ecolemontessorinantes.com` est le domaine principal : le domaine nu y redirige (« Redirect to www.ecolemontessorinantes.com », code 308 ou 301).

### Le jour de la bascule (zone DNS chez OVH)

1. Remplacer **seulement** l'enregistrement `A` du domaine nu (54.36.91.62) par la valeur que donne Vercel (souvent `76.76.21.21`), et l'enregistrement `www` par le `CNAME` donné par Vercel (`cname.vercel-dns.com.`). Supprimer les éventuels enregistrements `AAAA` qui pointent vers OVH.
2. **Ne toucher ni aux `MX` (Google), ni aux `TXT` (SPF, DKIM, vérification Google), ni aux serveurs DNS.**
3. Attendre que Vercel ait émis le certificat HTTPS (le domaine apparaît « Valid Configuration »).
4. Vérifier toutes les redirections, voir §5.
5. Search Console : soumettre `https://www.ecolemontessorinantes.com/sitemap.xml`, puis retirer les anciens `sitemap_index.xml` (`www.` et `http://www.`).

### Après la bascule

- **Garder l'hébergement WordPress OVH en lecture seule pendant 1 à 3 mois**, avec une sauvegarde, avant de le résilier.
- Suivre les erreurs 404 dans la Search Console et les journaux Vercel pendant 4 à 8 semaines, et ajouter des règles si besoin.
- **Renouveler le domaine** avant le 26 juin 2027, et garder les redirections au moins un an.
- Liens externes à mettre à jour : fiche Google Business Profile, Instagram, annuaires d'écoles Montessori, HelloAsso (APE). Le lien d'adhésion APE et l'espace Slack figuraient dans le menu « Espace parents » de l'ancien site. Le nouveau site mentionne Slack dans `vie-pratique-petons`, mais **ne propose plus le lien d'adhésion HelloAsso**.

## 5. Vérifier les redirections

Avant la bascule, sur un déploiement de prévisualisation Vercel (remplacer l'adresse) :

```bash
BASE=https://ecolemontessorinantes.vercel.app
for p in /ecole-montessori-nantes/ /lecole/ /qui-sommes-nous/ /nous-rejoindre/ /nos-valeurs/ /la-vie-a-lecole/ /informations-pratiques/ /portfolio/ /portfolio/role-de-lape/ /portfolio/roles-des-membres-de-lape/ /portfolio/election-du-bureau/ /journees-portes-ouvertes/ /tarifs/ /inscription/ /contact/ /boite-a-idees/ /la-creche/ /le-lieu/ /wp-content/uploads/2018/07/Dossier_Inscription_LPDLH_2018_2019.pdf; do
  printf '%-45s ' "$p"; curl -s -o /dev/null -w '%{http_code} → %{redirect_url}\n' "$BASE$p"
done
```

Chaque ligne doit afficher `308 → …/nouvelle-page`. Vercel répond 308 pour une redirection permanente : Google la traite comme une 301. Après la bascule, refaire la même vérification avec `BASE=https://www.ecolemontessorinantes.com` : une seule redirection, cible en 200. Avec `BASE=https://ecolemontessorinantes.com` ou `http://…`, la première réponse doit être la redirection d'hôte vers `https://www.ecolemontessorinantes.com` (même chemin), suivie de la redirection de page.

Les règles se testent aussi sans déploiement avec `bun test tests/redirections.test.ts`. Le test reproduit la comparaison d'adresses de Vercel (`path-to-regexp` 6, mêmes options), vérifie que chaque page et chaque ancre de destination existe, et, après `bun run build`, que le routage construit redirige chaque ancienne adresse.

## 6. Ajouter une redirection plus tard

1. Ajouter la règle dans `src/data/redirections.ts`, en écrivant `{/}?` à la fin de la source pour accepter les deux formes, avec et sans barre finale.
2. Ajouter l'ancienne adresse et sa cible dans `ANCIENNES_ADRESSES`, dans `tests/redirections.test.ts`.
3. Lancer `bun run check`.
