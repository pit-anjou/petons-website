# Les formulaires du site et Brevo

Les trois formulaires du site (contact, demande d’inscription, lettre d’information) envoient leurs données à **Brevo**. Brevo prévient l’école par e-mail, envoie un accusé de réception au visiteur et l’enregistre comme contact. Les e-mails sont rédigés dans des **modèles Brevo** : l’équipe peut les modifier sans toucher au code.

Ce guide dit **quoi configurer dans Brevo**, **où reporter les numéros** et **que faire quand quelque chose ne marche pas**.

## Ce que font les formulaires

| Formulaire | Page | Notification à l’école | Accusé de réception au visiteur | Liste Brevo | Lettre d’information |
| --- | --- | --- | --- | --- | --- |
| Contact | `contact-petons.html` | Oui | Oui | « Contact site » | Double confirmation, **seulement si la case est cochée** |
| Demande d’inscription | `inscriptions-petons.html` | Oui | Oui | « Demandes d’inscription » | Double confirmation, **seulement si la case est cochée** |
| Lettre d’information | `actualites-petons.html` | Non | Non (le mail de confirmation en tient lieu) | « Lettre d’information » | Double confirmation, toujours |

- La **double confirmation** : le visiteur reçoit un e-mail avec un lien. Il n’est abonné à la lettre qu’après avoir cliqué. Il arrive alors sur la page `lettre-confirmee.html`.
- La case « Je souhaite recevoir la lettre d’information des Petons » n’est **jamais cochée d’avance**.
- **Règle : la notification à l’école est indispensable, le reste se fait au mieux.** Si la notification ne part pas, le visiteur voit un message d’échec. Si c’est l’enregistrement du contact, l’accusé ou la double confirmation qui échoue, le visiteur voit quand même « merci » (pour qu’il ne renvoie pas son message, ce qui doublerait la notification), et l’incident est noté dans les journaux (voir plus bas).
- **Repli sur la messagerie** : quand l’envoi échoue, la page affiche « L’envoi n’a pas abouti » avec les boutons « Ouvrir ma messagerie » et « Copier le message ». Aucune demande n’est perdue. Sans JavaScript, le formulaire ouvre directement la messagerie, comme avant.
- Les **accusés de réception** ont toujours `contact@lespetons.fr` comme adresse de réponse (le site l’impose, quel que soit l’expéditeur choisi dans le modèle). Le visiteur peut donc répondre à l’accusé, par exemple pour joindre son CV.
- Les **notifications** ont comme adresse de réponse celle du visiteur : « Répondre » dans la boîte de l’école écrit directement à la personne.

## Configurer Brevo, pas à pas

À faire une fois, dans l’ordre. Tant que les étapes 5 et 6 ne sont pas faites, **rien n’est envoyé à Brevo** et les formulaires restent en mode messagerie : on peut donc publier le site avant d’avoir fini.

### 1. Authentifier le domaine et valider l’expéditeur

1. Dans Brevo, ouvrir **Expéditeurs, domaines et IP dédiées → Domaines**, ajouter **lespetons.fr** et suivre les consignes pour authentifier le domaine (Brevo indique les enregistrements à ajouter chez l’hébergeur du nom de domaine).
2. Dans la même rubrique, ajouter et valider l’expéditeur **contact@lespetons.fr**.

Sans cela, les e-mails risquent d’arriver en courrier indésirable, voire de ne pas arriver.

### 2. Créer les trois listes

Dans les contacts de Brevo, créer trois listes :

- **Contact site**
- **Demandes d’inscription**
- **Lettre d’information**

Noter le **numéro** de chaque liste (colonne **ID**).

### 3. Créer les attributs de contact

Dans **Contacts → Paramètres → Attributs**, créer cinq attributs de type **texte**, avec exactement ces noms (majuscules et tiret bas compris) :

| Attribut | Rempli par |
| --- | --- |
| `NOM_COMPLET` | contact et inscription |
| `TELEPHONE` | contact et inscription |
| `STRUCTURE` | contact |
| `RENTREE_SOUHAITEE` | inscription |
| `TRANCHE_AGE` | inscription |

**Attention : un attribut inconnu de Brevo fait échouer l’enregistrement du contact.** L’école est quand même prévenue, mais le visiteur n’est pas ajouté à la liste. Un champ laissé vide n’est pas envoyé : il n’efface pas une valeur déjà connue.

### 4. Créer les cinq modèles

Créer cinq **modèles d’e-mail transactionnel** et noter le **numéro** de chacun. Dans le texte, chaque information du visiteur s’écrit avec des doubles accolades, par exemple `{{ params.nom }}`.

| Modèle | Destinataire | Informations disponibles |
| --- | --- | --- |
| Notification contact | l’école | `nom`, `email`, `telephone`, `structure`, `sujet`, `message`, `lettre` |
| Accusé de réception contact | le visiteur | `nom`, `sujet`, `message` |
| Notification inscription | l’école | `nom`, `email`, `telephone`, `rentree`, `age`, `message`, `lettre` |
| Accusé de réception inscription | le visiteur | `nom`, `rentree`, `age`, `message` |
| Double confirmation | le visiteur | aucune (voir ci-dessous) |

- `sujet` est le libellé lisible choisi par le visiteur (« Postuler dans l’équipe », « Organiser une visite »…).
- `lettre` vaut `oui` ou `non` : la case « lettre d’information » était-elle cochée ?
- `rentree` et `age` sont les réponses du formulaire d’inscription. Ils sont vides si le visiteur n’a rien indiqué.
- Exemple de début de notification de contact :

  ```
  Nouveau message de {{ params.nom }} ({{ params.email }})
  Téléphone : {{ params.telephone }}
  Structure : {{ params.structure }}
  Sujet : {{ params.sujet }}
  Lettre d’information demandée : {{ params.lettre }}
  ```

- **Retours à la ligne du message.** Dans le modèle, mettre `{{ params.message }}` dans un bloc dont le style contient `white-space: pre-line`, sinon le message s’affiche sur une seule ligne :

  ```html
  <div style="white-space: pre-line;">{{ params.message }}</div>
  ```

- **Accusé de réception de contact : inviter à répondre avec un CV.** Les candidats écrivent via le formulaire de contact (sujets « Postuler dans l’équipe » ou « Demander un stage »). Ajouter par exemple : « Pour joindre votre CV, répondez simplement à cet e-mail. » Ça fonctionne parce que la réponse arrive à `contact@lespetons.fr`.
- **Double confirmation.** Le modèle doit contenir un **bouton (ou un lien) dont l’adresse est `{{ params.DOIurl }}`**. Brevo remplace cette adresse par le lien de confirmation propre à chaque personne. Sans elle, personne ne peut confirmer son abonnement.

### 5. Reporter les numéros dans le code

Ouvrir `src/data/brevo.ts` et remplacer les `0` par les numéros relevés. Exemple (numéros inventés) :

```ts
export const brevo: ConfigBrevo = {
  ecole: { email: contact.email, nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 4, inscription: 5, lettre: 6 },
  modeles: {
    notificationContact: 11,
    accuseContact: 12,
    notificationInscription: 13,
    accuseInscription: 14,
    confirmationLettre: 15,
  },
  pageConfirmationLettre: 'lettre-confirmee.html',
};
```

Un `0` signifie « pas encore configuré » : tant qu’il en reste un, le site répond « service indisponible » et les formulaires restent en mode messagerie. Ne rien changer d’autre dans ce fichier. Ces numéros ne sont pas secrets.

### 6. Créer la clé API et la ranger dans Vercel

1. Dans Brevo, créer une **clé API dédiée**, nommée « site lespetons.fr ». La copier tout de suite : Brevo ne la montre qu’une fois.
2. Dans Vercel, ouvrir le projet, **Settings → Environment Variables**, et ajouter **`BREVO_API_KEY`** avec cette valeur, pour **Production** et **Preview**.
3. **Redéployer** le site (une variable ajoutée n’est prise en compte qu’au déploiement suivant).
4. Vérifier dans Brevo (**Sécurité → IP autorisées**) que le **blocage des adresses IP inconnues est désactivé**. Vercel n’utilise pas d’adresse IP fixe : si le blocage est actif, Brevo refuse les envois du site. L’existence de cette option dans le compte de l’école reste à confirmer.

Ne jamais écrire la clé dans le code, dans un message ou dans un fichier envoyé au dépôt.

## Tester en local

1. Copier `.env.example` en `.env` et y coller une clé API Brevo (`BREVO_API_KEY=…`). Le fichier `.env` n’est pas envoyé au dépôt.
2. Lancer `bun run dev`, puis ouvrir http://localhost:4321.
3. Envoyer **chaque formulaire** avec une adresse de test que vous pouvez lire : contact, inscription (une fois case cochée, une fois non cochée), lettre.
4. Vérifier :
   - l’école reçoit la notification, et « Répondre » écrit bien à l’adresse de test ;
   - l’adresse de test reçoit l’accusé de réception, et « Répondre » écrit à `contact@lespetons.fr` ;
   - le contact apparaît dans la bonne liste de Brevo, avec ses attributs ;
   - la lettre : le mail de confirmation arrive, et le clic mène à la page « lettre confirmée ».

Un formulaire envoyé en moins de 3 secondes après l’ouverture de la page est pris pour un robot : attendre quelques secondes avant de cliquer sur « Envoyer ».

## Que se passe-t-il si…

| Situation | Ce que voit le visiteur | Ce qu’il faut savoir |
| --- | --- | --- |
| **La configuration est incomplète** (clé absente, un numéro à `0`) | « L’envoi n’a pas abouti » + repli messagerie | La route répond 503. C’est l’état normal avant les étapes 5 et 6. |
| **Brevo est en panne ou refuse la notification** (clé invalide, IP refusée, modèle supprimé…) | « L’envoi n’a pas abouti » + repli messagerie | La route répond 502. Rien n’a été envoyé à l’école. |
| **Brevo échoue après la notification** (contact, accusé ou double confirmation) | « Merci », comme si tout allait bien | L’école a reçu la notification. L’incident est dans les journaux : le contact ou l’accusé est à refaire à la main. |
| **Un robot remplit le formulaire** (champ caché rempli, ou envoi trop rapide) | « Merci » | Rien n’est envoyé. Le robot ne sait pas qu’il a été repéré. Une ligne `antispam` est notée dans les journaux. |
| **Le message dépasse la taille permise** ou un champ est invalide | « L’envoi n’a pas abouti » + repli messagerie | Les limites sont les mêmes que celles des champs de la page. |

### Lire les journaux dans Vercel

Dans Vercel, ouvrir le projet, **Logs**, et chercher **`[formulaire]`**. Chaque ligne ressemble à :

```
[formulaire] {"formulaire":"contact","etape":"accuse","statut":400}
```

- `formulaire` : `contact`, `inscription` ou `lettre`.
- `etape` : ce qui a échoué : `notification`, `contact`, `accuse`, `confirmation`, ou `antispam`.
- `statut` : le code de réponse de Brevo (`null` s’il n’y en a pas : Brevo n’a pas répondu à temps, ou c’est un robot).

Les journaux ne contiennent **jamais** de nom, d’adresse ni de message : seulement ces trois informations. Pour retrouver une demande perdue, consulter l’historique des envois dans Brevo ou demander à la personne de renvoyer son message.

Codes à connaître (indicatifs, ceux de Brevo) : `401` ou `403` clé API invalide ou adresse IP refusée ; `400` informations refusées (souvent un attribut non créé à l’étape 3) ; `404` numéro de liste ou de modèle inexistant ; `null` pas de réponse de Brevo (délai de 8 secondes dépassé).

## Hébergement Docker / nginx

Le site publié par Vercel contient une petite partie serveur : la route `/api/formulaire`. Les pages, elles, restent du HTML statique, construit dans `dist/client`.

L’image **Docker/nginx** (`Dockerfile.vercel`) ne copie que ces pages statiques : elle n’a **pas de partie serveur**. Les formulaires y fonctionnent donc en **mode messagerie** (le visiteur voit « L’envoi n’a pas abouti » et utilise « Ouvrir ma messagerie »). C’est voulu : rien n’est perdu, mais rien n’est envoyé à Brevo.

## Points à surveiller

### À vérifier lors du premier test réel : le HTML dans les textes

Les textes écrits par les visiteurs sont **neutralisés par le site avant l’envoi à Brevo** : `<`, `>`, `&` et `"` sont remplacés par `&lt;`, `&gt;`, `&amp;` et `&quot;`. Ainsi, un visiteur ne peut pas glisser de code HTML dans un e-mail.

Ce qui **n’est pas encore vérifié** : si Brevo neutralise lui aussi le contenu des `params`, les caractères spéciaux risquent d’être neutralisés deux fois.

Lors du premier test réel, envoyer un message contenant par exemple `Tom & Jerry <3 "bonjour"` et regarder la notification reçue :

- si elle affiche `Tom & Jerry <3 "bonjour"` : tout va bien, ne rien changer ;
- si elle affiche `Tom &amp; Jerry &lt;3 &quot;bonjour&quot;` : Brevo neutralise déjà, et le site doit envoyer le texte brut. La correction est à faire dans `src/lib/formulaires/traitement.ts` (la fonction `neutraliser`) : prévenir Philippe.

### Prérequis avant la mise en ligne

- [ ] Domaine **lespetons.fr** authentifié dans Brevo (étape 1).
- [ ] Restriction par adresses IP de la clé API **désactivée** (étape 6). L’existence de cette option dans le compte de l’école est à confirmer.
- [ ] Numéros reportés dans `src/data/brevo.ts` et `BREVO_API_KEY` ajoutée dans Vercel, puis site redéployé.
- [ ] Premier test réel des trois formulaires, y compris la vérification du HTML ci-dessus.

### Durée de conservation

Les mentions sous les formulaires annoncent une conservation des informations **3 ans après le dernier échange** (durée validée par l’école le 9 octobre 2026). Elle doit rester identique dans les mentions du site et dans la pratique : purger ou anonymiser les contacts plus anciens dans Brevo, ou modifier les mentions des pages si la durée change.

### Hors périmètre

Une page complète de politique de confidentialité et mentions légales, un CAPTCHA et une limitation du nombre d’envois par adresse IP ne sont pas en place. À envisager si le spam passe la protection invisible actuelle (champ caché et délai minimal de 3 secondes).
