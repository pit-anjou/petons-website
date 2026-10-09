// Client minimal de l'API Brevo v3 : contacts, e-mails transactionnels par modèle, double confirmation.
// Le fetch est injecté pour que les tests n'appellent jamais Brevo.
const API = 'https://api.brevo.com/v3';

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface Destinataire {
  readonly email: string;
  readonly nom?: string;
}

export interface ClientBrevo {
  enregistrerContact(contact: { email: string; attributs: Record<string, string>; listes: number[] }): Promise<void>;
  envoyerModele(envoi: { modele: number; a: Destinataire; repondreA?: Destinataire; params: Record<string, string> }): Promise<void>;
  demanderConfirmation(demande: { email: string; listes: number[]; modele: number; redirection: string }): Promise<void>;
}

/** Échec d'un appel : `statut` vaut null quand Brevo n'a pas répondu (réseau, délai dépassé). */
export class ErreurBrevo extends Error {
  constructor(
    readonly operation: string,
    readonly statut: number | null,
  ) {
    super(`Brevo ${operation} : ${statut ?? 'pas de réponse'}`);
  }
}

const versBrevo = ({ email, nom }: Destinataire) => (nom ? { email, name: nom } : { email });
const sansVides = (attributs: Record<string, string>) => Object.fromEntries(Object.entries(attributs).filter(([, valeur]) => valeur !== ''));

export const creerClientBrevo = ({ cleApi, fetch, delaiMs = 8000 }: { cleApi: string; fetch: Fetch; delaiMs?: number }): ClientBrevo => {
  const appeler = async (operation: string, chemin: string, corps: unknown): Promise<void> => {
    let reponse: Response;
    try {
      reponse = await fetch(`${API}${chemin}`, {
        method: 'POST',
        headers: { 'api-key': cleApi, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(delaiMs),
      });
    } catch {
      throw new ErreurBrevo(operation, null);
    }
    if (!reponse.ok) throw new ErreurBrevo(operation, reponse.status);
  };

  return {
    enregistrerContact: ({ email, attributs, listes }) =>
      appeler('contact', '/contacts', { email, attributes: sansVides(attributs), listIds: listes, updateEnabled: true }),
    envoyerModele: ({ modele, a, repondreA, params }) =>
      appeler('email', '/smtp/email', { templateId: modele, to: [versBrevo(a)], ...(repondreA ? { replyTo: versBrevo(repondreA) } : {}), params }),
    demanderConfirmation: ({ email, listes, modele, redirection }) =>
      appeler('confirmation', '/contacts/doubleOptinConfirmation', { email, includeListIds: listes, templateId: modele, redirectionUrl: redirection }),
  };
};
