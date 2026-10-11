// Génère les modèles d’e-mail Brevo (V1) aux couleurs du site : bun docs/modeles-brevo/generer.ts
// Les fichiers .html produits se collent dans l’éditeur HTML de Brevo (« Coder votre propre modèle »).
// `logo-email.png` est à téléverser dans Brevo, puis son adresse remplace `logo-email.png` dans chaque modèle.
// Variables : uniquement celles envoyées par src/lib/formulaires/traitement.ts (voir docs/formulaires-brevo.md).

const couleurs = {
  sable: '#f7f1e6',
  // Fond de la carte = fond du logo (#fcfcf9), pour qu’aucun rectangle n’apparaisse autour.
  papier: '#fcfcf9',
  pale: '#f0f5e8',
  ligne: '#dfe6dc',
  titre: '#316573',
  texte: '#385567',
  encre: '#3a5e71',
  orange: '#f89141',
  boutonTexte: '#294c5b',
  surligne: '#e3ecac',
  vert: '#81c94e',
};
const nunito = "'Nunito', 'Trebuchet MS', Arial, sans-serif";
const kalam = "'Kalam', 'Nunito', 'Trebuchet MS', Arial, sans-serif";

interface Modele {
  readonly fichier: string;
  readonly objet: string;
  /** Texte d’aperçu affiché par les messageries à côté de l’objet. */
  readonly apercu: string;
  readonly surtitre: string;
  readonly titre: string;
  readonly corps: string;
}

const paragraphe = (html: string) => `<p style="margin:0 0 16px;font-family:${nunito};font-size:16px;line-height:1.6;color:${couleurs.texte};">${html}</p>`;

const fiche = (lignes: ReadonlyArray<readonly [string, string]>) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:${couleurs.pale};border-radius:14px;">
  <tr><td style="padding:16px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${lignes
  .map(
    ([libelle, valeur]) => `      <tr>
        <td valign="top" style="padding:5px 12px 5px 0;width:42%;font-family:${nunito};font-size:13px;font-weight:800;line-height:1.5;color:${couleurs.titre};">${libelle}</td>
        <td valign="top" style="padding:5px 0;font-family:${nunito};font-size:15px;line-height:1.5;color:${couleurs.texte};">${valeur}</td>
      </tr>`,
  )
  .join('\n')}
    </table>
  </td></tr>
</table>`;

const message = `
<p style="margin:0 0 8px;font-family:${nunito};font-size:13px;font-weight:800;color:${couleurs.titre};">Message</p>
<div style="margin:0 0 20px;padding:14px 18px;border-left:4px solid ${couleurs.vert};background:${couleurs.papier};font-family:${nunito};font-size:15px;line-height:1.6;color:${couleurs.texte};white-space:pre-line;">{{ params.message }}</div>`;

const bouton = (adresse: string, libelle: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px;">
  <tr><td style="border-radius:30px;background:${couleurs.orange};">
    <a href="${adresse}" style="display:inline-block;padding:14px 26px;border-radius:30px;font-family:${nunito};font-size:15px;font-weight:800;color:${couleurs.boutonTexte};text-decoration:none;">${libelle}&nbsp;&rarr;</a>
  </td></tr>
</table>`;

const signature = paragraphe(`À très bientôt,<br><strong style="color:${couleurs.titre};">L’équipe des Petons dans l’Herbe</strong>`);

const gabarit = ({ objet, apercu, surtitre, titre, corps }: Modele) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${objet}</title>
<link href="https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${couleurs.sable};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${apercu}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${couleurs.sable};">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${couleurs.papier};border-radius:20px;border:1px solid ${couleurs.ligne};">
      <tr><td align="center" style="padding:30px 32px 8px;">
        <img src="logo-email.png" width="230" height="81" alt="Les Petons dans l’Herbe — École Montessori" style="display:block;width:230px;max-width:100%;height:auto;border:0;">
      </td></tr>
      <tr><td style="padding:18px 36px 8px;">
        <p style="margin:0 0 10px;font-family:${nunito};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${couleurs.titre};">${surtitre}</p>
        <h1 style="margin:0 0 22px;font-family:${kalam};font-size:30px;font-weight:700;line-height:1.25;color:${couleurs.titre};"><span style="border-bottom:5px solid ${couleurs.surligne};">${titre}</span></h1>
${corps}
      </td></tr>
      <tr><td style="padding:18px 36px 28px;border-top:1px solid ${couleurs.ligne};">
        <p style="margin:0;font-family:${nunito};font-size:12px;line-height:1.7;color:${couleurs.encre};">
          <span style="color:${couleurs.orange};">&#10023;</span> <strong>Les Petons dans l’Herbe</strong> · École Montessori 3–12 ans<br>
          6 rue de la Petite Sensive · 44300 Nantes · 06 45 09 53 37<br>
          <a href="https://ecolemontessorinantes.com/" style="color:${couleurs.titre};font-weight:700;">ecolemontessorinantes.com</a> · <a href="mailto:contact@ecolemontessorinantes.com" style="color:${couleurs.titre};">contact@ecolemontessorinantes.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;

const modeles: ReadonlyArray<Modele> = [
  {
    fichier: 'notification-contact.html',
    objet: 'Nouveau message depuis le site',
    apercu: 'Un visiteur a écrit à l’école par le formulaire de contact.',
    surtitre: 'Formulaire de contact',
    titre: 'Nouveau message du site',
    corps: [
      fiche([
        ['Nom', '{{ params.nom }}'],
        ['E-mail', '{{ params.email }}'],
        ['Téléphone', '{{ params.telephone }}'],
        ['Structure', '{{ params.structure }}'],
        ['Sujet', '{{ params.sujet }}'],
        ['Lettre d’information', '{{ params.lettre }}'],
      ]),
      message,
      paragraphe('Pour répondre, utilisez simplement « Répondre » : la réponse part à l’adresse du visiteur.'),
    ].join('\n'),
  },
  {
    fichier: 'accuse-contact.html',
    objet: 'Nous avons bien reçu votre message',
    apercu: 'Merci, votre message est bien arrivé aux Petons dans l’Herbe.',
    surtitre: 'Votre message',
    titre: 'Merci, nous avons bien reçu votre message',
    corps: [
      paragraphe('Bonjour,'),
      paragraphe('Merci de nous avoir écrit au sujet de : <strong style="color:#316573;">{{ params.sujet }}</strong>. Votre message est bien arrivé et nous vous répondrons rapidement.'),
      paragraphe('Pour une candidature ou une demande de stage, vous pouvez nous envoyer votre CV en répondant simplement à cet e-mail.'),
      signature,
    ].join('\n'),
  },
  {
    fichier: 'notification-inscription.html',
    objet: 'Nouvelle demande d’inscription depuis le site',
    apercu: 'Une famille a envoyé une demande d’inscription par le site.',
    surtitre: 'Demande d’inscription',
    titre: 'Nouvelle demande d’inscription',
    corps: [
      fiche([
        ['Parent', '{{ params.nom }}'],
        ['E-mail', '{{ params.email }}'],
        ['Téléphone', '{{ params.telephone }}'],
        ['Rentrée souhaitée', '{{ params.rentree }}'],
        ['Ambiance envisagée', '{{ params.age }}'],
        ['Lettre d’information', '{{ params.lettre }}'],
      ]),
      message,
      paragraphe('Pour répondre, utilisez simplement « Répondre » : la réponse part à l’adresse du parent.'),
    ].join('\n'),
  },
  {
    fichier: 'accuse-inscription.html',
    objet: 'Nous avons bien reçu votre demande d’inscription',
    apercu: 'Merci, votre demande d’inscription est bien arrivée.',
    surtitre: 'Votre demande d’inscription',
    titre: 'Merci pour votre demande',
    corps: [
      paragraphe('Bonjour,'),
      paragraphe('Merci pour votre demande d’inscription aux Petons dans l’Herbe. Elle est bien arrivée et nous revenons vers vous rapidement pour échanger sur votre projet et organiser une rencontre.'),
      paragraphe('Ambiance envisagée : <strong style="color:#316573;">{{ params.age }}</strong>'),
      paragraphe('En attendant, vous pouvez découvrir les ambiances et la vie de l’école sur <a href="https://ecolemontessorinantes.com/" style="color:#316573;font-weight:700;">notre site</a>.'),
      signature,
    ].join('\n'),
  },
  {
    fichier: 'confirmation-lettre.html',
    objet: 'Confirmez votre inscription à la lettre des Petons',
    apercu: 'Un clic pour recevoir chaque mois les nouvelles de l’école.',
    surtitre: 'La lettre des Petons',
    titre: 'Plus qu’un clic !',
    corps: [
      paragraphe('Bonjour,'),
      paragraphe('Vous avez demandé à recevoir la lettre d’information des Petons dans l’Herbe : une fois par mois, les temps forts de l’école et nos conseils Montessori, directement dans votre boîte mail.'),
      bouton('{{ params.DOIurl }}', 'Je confirme mon inscription'),
      paragraphe('<span style="font-size:14px;">Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail : vous ne serez pas inscrit.</span>'),
      signature,
    ].join('\n'),
  },
];

const dossier = new URL('./', import.meta.url);
for (const modele of modeles) {
  await Bun.write(new URL(modele.fichier, dossier), gabarit(modele));
  console.log(`${modele.fichier} — objet : ${modele.objet}`);
}
