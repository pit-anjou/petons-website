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
    // Répondre à l'accusé écrit toujours à l'école (ex. pour envoyer un CV), quel que soit l'expéditeur du modèle.
    ['accuse', () => client.envoyerModele({ modele: envoi.accuse.modele, a: envoi.visiteur, repondreA: config.ecole, params: neutraliser(envoi.accuse.params) })],
    ...(envoi.lettre ? [['confirmation', () => confirmation(envoi.visiteur.email)] as [string, () => Promise<void>]] : []),
  ];
  const resultats = await Promise.allSettled(auMieux.map(([, action]) => action()));
  resultats.forEach((resultat, index) => {
    if (resultat.status === 'rejected') journal({ formulaire, etape: auMieux[index]![0], statut: statutDe(resultat.reason) });
  });
  return 'envoye';
};
