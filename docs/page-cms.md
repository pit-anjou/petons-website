# Modifier les actualités avec Page CMS

Page CMS est un éditeur en ligne pour modifier les **programmes et sessions de stages de vacances**, les **prochains rendez-vous** et les **articles de « La vie de l’école »** de la page Actualités, sans toucher au code.

Adresse : **https://app.pagescms.org**

## Publier une modification

1. Se connecter (avec GitHub, ou avec le lien reçu par e-mail).
2. Ouvrir **pit-anjou / petons-website**, branche **main**.
3. Choisir une rubrique, modifier ou ajouter une entrée, puis cliquer sur **Save**.
4. La page est en ligne **1 à 2 minutes** plus tard.

Pour préparer une entrée sans la montrer, cocher **Brouillon** : elle reste enregistrée mais n’apparaît pas sur le site. Un brouillon est vérifié comme les autres entrées : **un brouillon incomplet ou invalide bloque aussi la mise en ligne**.

Les **prix, effectifs et cadrages** sont des nombres entiers (200, pas 200,50).

**Si la modification n’apparaît pas après 5 minutes**, la mise en ligne a échoué : le site garde alors sa version précédente. Prévenir Philippe, en indiquant ce qui a été modifié.

## Programmes de stage

Un **programme** contient tout ce qui ne change pas d’une session à l’autre : le titre, la description de la carte et la fenêtre « Programme & infos ». Il y a **une fiche par public** : « Histoires & Objets Inventés — enfants » et « … — adolescents » sont deux fiches distinctes. Un texte commun aux deux se corrige dans les deux fiches.

- Pour créer un nouveau programme, le plus simple est de **dupliquer** une fiche existante, puis de l’adapter.
- La fenêtre se compose de **sections** (titre et icône), elles-mêmes composées de **blocs** : *Texte*, *Intervenants*, *Liste illustrée* (comme « Trois forces à éveiller »), *Étapes*, *Illustration* et *Invitation à la restitution*. La partie « En pratique » se remplit seule à partir des horaires, du sac et du texte d’inscription.
- Mise en forme dans les textes : `**gras**`, `==surligné vert==` et `++surligné orange++`.
- **Ne pas supprimer un programme utilisé par une session publiée** : la mise en ligne échouerait.

## Sessions de stage

Chaque **session** choisit son programme, puis fixe ses dates, ses vacances, l’image et la couleur de sa carte, son prix et son nombre de places.

- Le **dernier jour** est celui de la restitution aux familles, à l’heure indiquée dans le programme.
- Le **cadrage** déplace l’image vers le haut (0) ou vers le bas (100).

## Prochains rendez-vous et articles

- La **carte** affiche le titre, la date ou le repère, le résumé et le visuel.
- Sur la carte d’un rendez-vous, deux champs facultatifs complètent la date : le **libellé au-dessus de la date** (vide = jour de la semaine, par exemple « À l’école ») et une **note sous les étiquettes** (par exemple « Sans inscription · En famille »).
- La **fenêtre** s’ouvre au clic. Elle contient un surtitre, une introduction, puis des **blocs** à empiler dans l’ordre voulu : *Texte*, *Intertitre* (avec un logo facultatif) et *Photo* (avec description et légende).
- Les rendez-vous sont classés par date. Les articles sont classés du plus récent au plus ancien, selon leur **date de l’événement** (non affichée).
- Pour un rendez-vous passé, on peut le supprimer, ou en faire un article « Retour sur un événement ». Un rendez-vous et un article ne peuvent pas porter le même titre : **changer le titre de l’article, ou supprimer d’abord le rendez-vous**. Sinon la mise en ligne échoue, avec un message qui nomme les deux.
- Seuls les textes des **programmes** et les **points forts** des rendez-vous acceptent `**gras**` et les surlignages `==…==` et `++…++`. Tous les autres champs des rendez-vous et des articles sont du texte simple, sauf les blocs « Texte », qui ont leur propre éditeur.
- Le code HTML saisi dans un texte s’affiche tel quel, il n’est pas interprété.

## Images

- Elles sont rangées dans le dossier **actualites** de la médiathèque.
- Préférer le format **.webp** ou **.jpg**, de **1 600 px de large au maximum** : une photo de téléphone non réduite ralentit la page.
- Toujours remplir la **description** : elle est lue aux personnes qui ne voient pas l’image.
- Ne pas supprimer une image de la médiathèque tant qu’une actualité l’utilise : la mise en ligne échouerait.

## Ce qui ne se modifie pas ici

- Le bloc « Vie de l’école » de la **page d’accueil** : il pointe vers le stage de février et l’article Éco-École. Si l’un d’eux est supprimé, prévenir Philippe pour mettre l’accueil à jour.
- L’encart « Inscriptions ouvertes » (places disponibles), les tarifs, les coordonnées et les autres pages.
- Les portes ouvertes de novembre et le bandeau d’annonce du site : ils se modifient dans le code (`src/data/openHouse.ts`).

## Pour l’administrateur

1. Sur https://app.pagescms.org, se connecter avec le compte GitHub **pit-anjou**, puis installer la **GitHub App Pages CMS** sur le seul dépôt **petons-website**.
2. Ouvrir le dépôt, branche **main**. Les quatre rubriques doivent apparaître.
3. Inviter les éditeurs par e-mail : **Settings → Collaborators**. Ils n’ont pas besoin de compte GitHub. Ils peuvent modifier le contenu et les images, mais pas la configuration.
4. Dans Vercel, garder actives les **notifications d’échec de déploiement** : c’est le seul signal quand une modification ne passe pas.
5. Chaque champ est décrit deux fois, dans `src/content/schemas.ts` et dans `.pages.yml`. `bun test` vérifie que les deux correspondent.
