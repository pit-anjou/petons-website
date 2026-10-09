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

/**
 * L'accusé de réception part vers n'importe quelle adresse saisie par le visiteur : il ne reprend donc
 * aucun texte libre (nom, message…), seulement des valeurs issues de listes fermées (sujet, tranche d'âge).
 * Sinon le formulaire servirait à envoyer un texte choisi, depuis l'expéditeur de l'école, à un tiers.
 */
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
      accuse: { modele: config.modeles.accuseContact, params: { sujet } },
      lettre: newsletter,
    };
  }
  const { parentName, email, phone, schoolStart, childAge, message, newsletter } = demande.champs;
  return {
    visiteur: { email, nom: parentName },
    liste: config.listes.inscription,
    attributs: { NOM_COMPLET: parentName, TELEPHONE: phone, RENTREE_SOUHAITEE: schoolStart, TRANCHE_AGE: childAge },
    notification: { modele: config.modeles.notificationInscription, params: { nom: parentName, email, telephone: phone, rentree: schoolStart, age: childAge, message, lettre: ouiNon(newsletter) } },
    accuse: { modele: config.modeles.accuseInscription, params: { age: childAge } },
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

  // Au mieux : un échec est consigné sans interrompre le reste. Le contact et l'accusé partent en parallèle ;
  // la double confirmation attend la fin de l'enregistrement du contact, pour que l'abonné existe déjà côté Brevo.
  const auMieux = async (etape: string, action: () => Promise<void>) => {
    try {
      await action();
    } catch (erreur) {
      journal({ formulaire, etape, statut: statutDe(erreur) });
    }
  };
  await Promise.all([
    (async () => {
      await auMieux('contact', () => client.enregistrerContact({ email: envoi.visiteur.email, attributs: envoi.attributs, listes: [envoi.liste] }));
      if (envoi.lettre) await auMieux('confirmation', () => confirmation(envoi.visiteur.email));
    })(),
    // Répondre à l'accusé écrit toujours à l'école (ex. pour envoyer un CV), quel que soit l'expéditeur du modèle.
    auMieux('accuse', () => client.envoyerModele({ modele: envoi.accuse.modele, a: envoi.visiteur, repondreA: config.ecole, params: neutraliser(envoi.accuse.params) })),
  ]);
  return 'envoye';
};
