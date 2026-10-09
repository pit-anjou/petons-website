# Formulaires du site envoyés à Brevo — conception

Date : 2026-10-09
Branche : `feat/brevo-form-integration-75706d`

## Objectif

Les trois formulaires du site n'envoient aujourd'hui rien : ils préparent un e-mail dans la messagerie du visiteur (`mailto:`). Ils doivent désormais transmettre les données à Brevo, qui :

- prévient l'école par e-mail ;
- envoie un accusé de réception au visiteur ;
- enregistre le visiteur comme contact, dans une liste propre au formulaire ;
- abonne à la lettre d'information, avec double confirmation, les personnes qui le demandent.

| Formulaire | Page | Identifiant `formulaire` |
| --- | --- | --- |
| Contact | `src/pages/contact-petons.astro` (`#contact-form`) | `contact` |
| Demande d'inscription | `src/pages/inscriptions-petons.astro` (`#admission-form`) | `inscription` |
| Lettre d'information | `src/pages/actualites-petons.astro` (`#newsletter-form`) | `lettre` |

## Décisions prises

| Sujet | Décision |
| --- | --- |
| Périmètre | Contacts Brevo + notification à l'école + accusé de réception au visiteur |
| Hébergement | Vercel, inchangé |
| Partie serveur | Adaptateur `@astrojs/vercel`, une seule route à la demande ; toutes les pages restent statiques |
| Rédaction des e-mails | Modèles Brevo, modifiables par l'équipe sans toucher au code |
| Listes et consentement | Une liste par formulaire ; case non cochée « lettre d'information » sur contact et inscription ; double confirmation pour la lettre |
| Anti-spam | Champ piège caché + délai minimal de remplissage ; aucun service tiers |
| Échec d'envoi | Message d'erreur puis repli sur le brouillon `mailto:` existant |
| Langage | TypeScript simple, comme le reste du dépôt (pas d'Effect TS : le dépôt ne l'utilise pas) |

## Architecture

```
Navigateur ──POST JSON──▶ /api/formulaire (fonction Vercel) ──▶ API Brevo v3
   │                              │
   │ échec                        └─ BREVO_API_KEY (variable d'environnement)
   ▼
Brouillon mailto: existant
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `astro.config.mjs` | Ajoute l'adaptateur `@astrojs/vercel`. `output` reste statique et `build.format: 'file'` est conservé. |
| `vercel.json` | Retire `outputDirectory: "dist"`, puisque l'adaptateur produit `.vercel/output`. |
| `src/pages/api/formulaire.ts` | Route, `export const prerender = false`. Coquille : elle lit la clé via `astro:env` et délègue à `traiterRequete()`. |
| `src/lib/formulaires/requete.ts` | `traiterRequete()` : contrôles dans l'ordre ci-dessous et réponse HTTP, testable sans Astro ni réseau. |
| `src/lib/formulaires/validation.ts` | Fonctions pures : valide et normalise les données de chaque formulaire, vérifie l'anti-spam. Aucun accès réseau. |
| `src/lib/brevo.ts` | Client Brevo : création ou mise à jour d'un contact, envoi d'un e-mail transactionnel par modèle, double confirmation. Le `fetch` est injectable pour les tests. |
| `src/lib/formulaires/traitement.ts` | Enchaîne les appels Brevo pour un formulaire validé et applique la règle « notification indispensable, le reste au mieux ». |
| `src/data/brevo.ts` | Numéros des listes et des modèles, adresse de l'école, adresse de la page de confirmation. Pas de secret. |
| `src/components/FormSubmitScript.astro` | Script commun (`<script is:inline>`) : envoi, état du bouton, affichage du succès ou de l'échec. |
| `src/pages/lettre-confirmee.astro` | Page statique affichée après le clic de double confirmation. |
| `docs/formulaires-brevo.md` | Guide de configuration Brevo pour l'équipe. |

## Route `POST /api/formulaire`

### Requête

Corps JSON : `{ "formulaire": "contact" | "inscription" | "lettre", "champs": { … }, "piege": "", "ouvertLe": <horodatage ms> }`.

### Contrôles, dans l'ordre

1. **Méthode** : seule `POST` est acceptée, sinon 405.
2. **Origine** : l'hôte de l'en-tête `Origin` doit être celui de la requête. Cela couvre la production, les prévisualisations Vercel et `localhost` sans liste à tenir à jour. Sinon, 403.
3. **Taille** : un corps de plus de 16 Ko est refusé (413).
4. **Configuration** : si `BREVO_API_KEY` ou un numéro de `src/data/brevo.ts` manque, la route répond 503. Le formulaire bascule alors sur le repli `mailto:`.
5. **Anti-spam** : si `piege` n'est pas vide, si `ouvertLe` est absent ou invalide, ou si moins de 3 secondes séparent `ouvertLe` de la réception, la route répond **200 `{ ok: true }` sans rien envoyer**. Le robot ne sait pas qu'il a été repéré. L'événement est consigné sans les données.
6. **Validation** : en cas d'échec, réponse 400 `{ ok: false }`, sans détail.

### Validation par formulaire

Chaque valeur est réduite à une chaîne, débarrassée des espaces au début et à la fin, et ses retours à la ligne sont normalisés.

| Formulaire | Champ | Règle |
| --- | --- | --- |
| contact | `name` | obligatoire, ≤ 150 |
| contact | `email` | obligatoire, format e-mail, ≤ 254 |
| contact | `phone` | facultatif, ≤ 35 |
| contact | `organisation` | facultatif, ≤ 150 |
| contact | `subject` | obligatoire, une valeur de la liste fermée du `<select>` (`information`, `visite`, `vacances`, `candidature`, `stage`, `partenariat`, `don`, `mecenat`, `autre`) |
| contact | `message` | obligatoire, ≤ 3000 |
| contact | `newsletter` | booléen, faux par défaut |
| inscription | `parentName` | obligatoire, ≤ 150 |
| inscription | `email` | obligatoire, format e-mail, ≤ 254 |
| inscription | `phone` | facultatif, ≤ 35 |
| inscription | `schoolStart` | facultatif, ≤ 100 |
| inscription | `childAge` | facultatif, une des deux valeurs des boutons radio |
| inscription | `message` | facultatif, ≤ 2500 |
| inscription | `newsletter` | booléen, faux par défaut |
| lettre | `email` | obligatoire, format e-mail, ≤ 254 |

Les limites reprennent les `maxlength` actuels des pages. Un test vérifie qu'elles restent identiques des deux côtés.

### Traitement

**Contact et inscription :**

1. **Notification à l'école, indispensable.** Le modèle de notification du formulaire est envoyé à l'adresse de l'école, avec en `replyTo` le visiteur. Si cet envoi échoue, la route répond 502 `{ ok: false }` et le visiteur voit le repli.
2. **Ensuite, au mieux et en parallèle.** Un échec de ces étapes est consigné (type d'étape et statut HTTP, sans données personnelles), mais la réponse reste 200 `{ ok: true }`. On évite ainsi un renvoi qui doublerait la notification.
   - Création ou mise à jour du contact (`updateEnabled: true`) dans la liste du formulaire, avec ses attributs.
   - Envoi de l'accusé de réception, modèle propre au formulaire, au visiteur, avec en `replyTo` l'adresse de l'école. Répondre à l'accusé permet ainsi d'envoyer une pièce jointe (un CV, par exemple) à l'école, quel que soit l'expéditeur choisi dans le modèle.
   - Si `newsletter` est vrai, double confirmation vers la liste « Lettre d'information ».

**Lettre :** une seule étape, la double confirmation vers la liste « Lettre d'information ». Si elle échoue, la route répond 502 et le visiteur voit le repli.

### Appels Brevo

| Opération | Point d'accès |
| --- | --- |
| Contact | `POST https://api.brevo.com/v3/contacts` — `email`, `attributes`, `listIds`, `updateEnabled: true` |
| E-mail transactionnel | `POST https://api.brevo.com/v3/smtp/email` — `templateId`, `to`, `replyTo`, `params` |
| Double confirmation | `POST https://api.brevo.com/v3/contacts/doubleOptinConfirmation` — `email`, `includeListIds`, `templateId`, `redirectionUrl` |

L'en-tête `api-key` contient `BREVO_API_KEY`. Chaque appel est limité à 8 secondes.

### Attributs de contact

`NOM_COMPLET`, `TELEPHONE`, `STRUCTURE` (contact), `RENTREE_SOUHAITEE` et `TRANCHE_AGE` (inscription). Un attribut vide n'est pas envoyé, pour ne pas effacer une valeur déjà connue.

### Paramètres des modèles

| Modèle | `params` |
| --- | --- |
| Notification contact | `nom`, `email`, `telephone`, `structure`, `sujet` (libellé lisible), `message`, `lettre` (oui/non) |
| Accusé de réception contact | `nom`, `sujet`, `message` |
| Notification inscription | `nom`, `email`, `telephone`, `rentree`, `age`, `message`, `lettre` |
| Accusé de réception inscription | `nom`, `rentree`, `age`, `message` |
| Double confirmation | aucun ; le lien `{{ params.DOIurl }}` est fourni par Brevo |

**Point à vérifier pendant l'implémentation :** savoir si Brevo neutralise le HTML contenu dans `params`. Si oui, on envoie le texte brut, sinon on l'échappe côté serveur. Le résultat sera consigné dans `docs/formulaires-brevo.md`, et un test fixera le comportement retenu.

### Réponses

| Statut | Corps | Effet dans la page |
| --- | --- | --- |
| 200 | `{ ok: true }` | Message de succès |
| 400, 403, 405, 413, 502, 503 | `{ ok: false }` | Message d'échec + repli `mailto:` |

Le détail de l'erreur ne quitte jamais le serveur. Les journaux Vercel reçoivent le formulaire, l'étape et le statut, jamais le contenu des champs.

## Côté navigateur

- Le script de chaque page garde sa validation et la préparation du brouillon. Au lieu d'afficher directement le brouillon, il appelle `envoyerFormulaire()` du composant `FormSubmitScript`.
- Pendant l'envoi, le bouton est inactif et affiche « Envoi en cours… ».
- **Succès** : le formulaire est remplacé par un message annoncé aux lecteurs d'écran (`role="status"`), par exemple « Merci, votre message est bien parti. Vous allez recevoir un accusé de réception par e-mail. » Pour la lettre : « Vérifiez votre boîte mail : un lien de confirmation vient de vous être envoyé. »
- **Échec ou réseau coupé** : « L'envoi n'a pas abouti. Vous pouvez nous écrire directement : » suivi du bloc existant (« Ouvrir ma messagerie », « Copier le message »).
- **Sans JavaScript** : `action="mailto:…"` reste en place, donc le comportement actuel est conservé.
- **Ajouts HTML :**
  - champ piège `piege`, caché visuellement, avec `tabindex="-1"`, `autocomplete="off"` et `aria-hidden="true"` sur son conteneur ;
  - `ouvertLe`, renseigné par le script au chargement ;
  - sur contact et inscription, la case non cochée « Je souhaite recevoir la lettre d'information des Petons » (`name="newsletter"`) ;
  - nouveaux libellés : « Envoyer mon message » ou « Envoyer ma demande », et « Vous recevrez un accusé de réception par e-mail. » à la place de « Votre messagerie s'ouvrira… ».
- **Mention RGPD sous chaque formulaire.** Contact et inscription : « Les Petons dans l'Herbe utilisent ces informations pour répondre à votre demande et, si vous l'avez demandé, vous envoyer la lettre d'information. Elles sont hébergées par Brevo, notre prestataire d'envoi d'e-mails, et conservées 3 ans après notre dernier échange. Pour y accéder, les corriger ou les supprimer : contact@lespetons.fr. » Lettre : « Votre adresse sert uniquement à vous envoyer la lettre d'information des Petons. Elle est hébergée par Brevo et vous pouvez vous désinscrire à tout moment, via le lien présent dans chaque lettre ou en écrivant à contact@lespetons.fr. » La durée de 3 ans a été validée par l'école le 2026-10-09.

## Configuration Brevo (à faire par l'équipe)

Le détail sera dans `docs/formulaires-brevo.md`.

1. Authentifier le domaine `lespetons.fr` (DKIM, DMARC) et valider l'expéditeur.
2. Créer les listes « Contact site », « Demandes d'inscription » et « Lettre d'information ».
3. Créer les attributs `NOM_COMPLET`, `TELEPHONE`, `STRUCTURE`, `RENTREE_SOUHAITEE` et `TRANCHE_AGE` (type texte).
4. Créer les cinq modèles. Le modèle de double confirmation doit contenir `{{ params.DOIurl }}`.
5. Reporter les numéros dans `src/data/brevo.ts`.
6. Créer une clé API dédiée au site et la ranger dans Vercel (`BREVO_API_KEY`, environnements Production et Preview). Vérifier que la restriction par adresses IP autorisées est désactivée pour cette clé : l'existence de cette option dans le compte reste à confirmer.

Tant que les étapes 5 et 6 ne sont pas faites, la route répond 503 et les formulaires restent en mode messagerie. Le code peut donc être publié avant la configuration.

## Tests et vérification

**`bun test`, sans réseau :**

- validation : champs obligatoires, longueurs, liste fermée des sujets, format e-mail, booléen `newsletter`, cohérence des limites avec les `maxlength` des pages ;
- anti-spam : piège rempli, envoi trop rapide, `ouvertLe` absent ou invalide ;
- client Brevo avec `fetch` simulé : URL, en-têtes, corps, délai dépassé ;
- traitement : échec de la notification → erreur ; échec du contact, de l'accusé ou de la double confirmation → succès consigné ; case lettre cochée ou non ;
- route : 405, 403, 413, 503 si la configuration manque, 200 silencieux pour le spam, 400, 502 ;
- pages (avec `node-html-parser`, comme les tests existants) : champ piège présent, case lettre non cochée, mention RGPD, `action` `mailto:` conservée.

**`bun run check`** (build puis tests) doit réussir.

**Vérification réelle :**

- `bun run dev` avec une clé de test et une adresse de test : les trois formulaires vont jusqu'au bout, les cinq modèles et la double confirmation sont reçus.
- Déploiement de prévisualisation Vercel : les adresses `.html` sont inchangées, Page CMS fonctionne toujours, `/api/formulaire` répond.

## Documentation

- Créer `docs/formulaires-brevo.md`.
- Dans `AGENTS.md`, ajouter une ligne au tableau « Où modifier quoi » (formulaires → `src/lib/formulaires/`, `src/data/brevo.ts`, `docs/formulaires-brevo.md`).
- Ajouter dans `Dockerfile.vercel` et dans la doc l'avertissement suivant : une image nginx n'a pas de partie serveur, donc les formulaires y restent en mode messagerie.

## Hors périmètre

- Page complète « Politique de confidentialité / mentions légales » : chantier séparé, recommandé.
- CAPTCHA (Turnstile) : à envisager seulement si le spam passe la protection invisible.
- Limitation du débit par adresse IP.
- Synchronisation de Brevo vers le site, ou affichage de données Brevo.

## Prérequis à confirmer avant la mise en ligne

- Domaine `lespetons.fr` authentifié dans Brevo.
- Restriction IP de la clé Brevo désactivée.
