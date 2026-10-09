// Contrôles de POST /api/formulaire, dans l'ordre de la spec :
// méthode, origine, taille, configuration, anti-spam, validation, puis envoi à Brevo.
import { estConfiguree, type ConfigBrevo } from '../../data/brevo';
import { creerClientBrevo, type Fetch } from '../brevo';
import { traiter, type Journal } from './traitement';
import { estSpam, valider } from './validation';

export const TAILLE_MAX_OCTETS = 16384;

interface Dependances {
  readonly cleApi: string | undefined;
  readonly config: ConfigBrevo;
  readonly fetch: Fetch;
  readonly maintenant: () => number;
  readonly journal: Journal;
}

const repondre = (statut: number) =>
  Response.json({ ok: statut === 200 }, { status: statut, headers: { 'cache-control': 'no-store', ...(statut === 405 ? { allow: 'POST' } : {}) } });

/** Origine de la requête si elle vient du même site (production, prévisualisation Vercel ou localhost), sinon null. */
const origineDuSite = (requete: Request): string | null => {
  const origine = requete.headers.get('origin');
  if (!origine) return null;
  try {
    return new URL(origine).host === new URL(requete.url).host ? new URL(origine).origin : null;
  } catch {
    return null;
  }
};

const lireCorps = async (requete: Request): Promise<string | null> => {
  if (Number(requete.headers.get('content-length') ?? 0) > TAILLE_MAX_OCTETS) return null;
  const texte = await requete.text();
  return new TextEncoder().encode(texte).length > TAILLE_MAX_OCTETS ? null : texte;
};

const lireJson = (texte: string): Record<string, unknown> | null => {
  try {
    const valeur: unknown = JSON.parse(texte);
    return valeur && typeof valeur === 'object' && !Array.isArray(valeur) ? (valeur as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

export const traiterRequete = async (requete: Request, { cleApi, config, fetch, maintenant, journal }: Dependances): Promise<Response> => {
  if (requete.method !== 'POST') return repondre(405);

  const origine = origineDuSite(requete);
  if (!origine) return repondre(403);

  const texte = await lireCorps(requete);
  if (texte === null) return repondre(413);

  if (!cleApi || !estConfiguree(config)) return repondre(503);

  const corps = lireJson(texte);
  if (!corps) return repondre(400);

  if (estSpam(corps.piege, corps.ouvertLe, maintenant())) {
    journal({ formulaire: String(corps.formulaire ?? '?').slice(0, 20), etape: 'antispam', statut: null });
    return repondre(200);
  }

  const demande = valider(corps.formulaire, corps.champs);
  if (!demande) return repondre(400);

  const client = creerClientBrevo({ cleApi, fetch });
  return repondre((await traiter(demande, { client, config, origine, journal })) === 'envoye' ? 200 : 502);
};
