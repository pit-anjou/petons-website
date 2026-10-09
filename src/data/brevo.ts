// Numéros Brevo utilisés par les formulaires du site. Guide : docs/formulaires-brevo.md.
// Un numéro à 0 signifie « pas encore configuré » : la route répond alors 503
// et les formulaires restent en mode messagerie.
import { contact } from './site';

export interface ConfigBrevo {
  /** Destinataire des notifications. */
  readonly ecole: { readonly email: string; readonly nom: string };
  readonly listes: { readonly contact: number; readonly inscription: number; readonly lettre: number };
  readonly modeles: {
    readonly notificationContact: number;
    readonly accuseContact: number;
    readonly notificationInscription: number;
    readonly accuseInscription: number;
    /** Modèle de double confirmation : il doit contenir {{ params.DOIurl }}. */
    readonly confirmationLettre: number;
  };
  /** Page où Brevo renvoie après le clic de confirmation (relative à la racine du site). */
  readonly pageConfirmationLettre: string;
}

export const brevo: ConfigBrevo = {
  ecole: { email: contact.email, nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 0, inscription: 0, lettre: 0 },
  modeles: { notificationContact: 0, accuseContact: 0, notificationInscription: 0, accuseInscription: 0, confirmationLettre: 0 },
  pageConfirmationLettre: 'lettre-confirmee.html',
};

/** Vrai quand chaque liste et chaque modèle a un numéro Brevo. */
export const estConfiguree = (config: ConfigBrevo): boolean =>
  [...Object.values(config.listes), ...Object.values(config.modeles)].every((numero) => Number.isInteger(numero) && numero > 0);
