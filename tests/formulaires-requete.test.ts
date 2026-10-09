import { describe, expect, test } from 'bun:test';
import type { ConfigBrevo } from '../src/data/brevo';
import type { Fetch } from '../src/lib/brevo';
import { TAILLE_MAX_OCTETS, traiterRequete } from '../src/lib/formulaires/requete';

const config: ConfigBrevo = {
  ecole: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 1, inscription: 2, lettre: 3 },
  modeles: { notificationContact: 4, accuseContact: 5, notificationInscription: 6, accuseInscription: 7, confirmationLettre: 8 },
  pageConfirmationLettre: 'lettre-confirmee.html',
};

const preparer = (statutBrevo = 201) => {
  const appels: string[] = [];
  const evenements: unknown[] = [];
  const fetch: Fetch = async (url) => {
    appels.push(url);
    return new Response(null, { status: statutBrevo });
  };
  const deps = { cleApi: 'cle', config, fetch, journal: (e: unknown) => evenements.push(e) };
  return { appels, evenements, deps };
};

const lettre = { formulaire: 'lettre', champs: { email: 'a@b.fr' }, piege: '', dureeMs: 10_000 };
const requete = (corps: unknown = lettre, { methode = 'POST', origine = 'https://lespetons.fr' as string | null } = {}) =>
  new Request('https://lespetons.fr/api/formulaire', {
    method: methode,
    headers: { 'content-type': 'application/json', ...(origine ? { origin: origine } : {}) },
    body: methode === 'POST' ? (typeof corps === 'string' ? corps : JSON.stringify(corps)) : undefined,
  });

const lire = async (reponse: Response) => ({ statut: reponse.status, corps: await reponse.json(), cache: reponse.headers.get('cache-control') });

describe('traiterRequete', () => {
  test('envoie une demande valide', async () => {
    const { appels, deps } = preparer();
    expect(await lire(await traiterRequete(requete(), deps))).toEqual({ statut: 200, corps: { ok: true }, cache: 'no-store' });
    expect(appels).toEqual(['https://api.brevo.com/v3/contacts/doubleOptinConfirmation']);
  });

  test('refuse une autre méthode que POST', async () => {
    const { deps } = preparer();
    expect((await traiterRequete(requete(undefined, { methode: 'GET' }), deps)).status).toBe(405);
  });

  test.each([
    ['absente', null],
    ['d’un autre site', 'https://pirate.example'],
    ['illisible', 'pas une url'],
  ])('refuse une origine %s', async (_cas, origine) => {
    const { appels, deps } = preparer();
    expect((await traiterRequete(requete(lettre, { origine }), deps)).status).toBe(403);
    expect(appels).toEqual([]);
  });

  test('refuse un corps trop volumineux', async () => {
    const { deps } = preparer();
    const gros = { ...lettre, champs: { email: 'a@b.fr', bourrage: 'x'.repeat(TAILLE_MAX_OCTETS) } };
    expect((await traiterRequete(requete(gros), deps)).status).toBe(413);
  });

  test('répond 503 sans clé API', async () => {
    const { appels, deps } = preparer();
    expect((await traiterRequete(requete(), { ...deps, cleApi: undefined })).status).toBe(503);
    expect(appels).toEqual([]);
  });

  test('répond 503 tant qu’un numéro Brevo manque', async () => {
    const { deps } = preparer();
    const incomplete = { ...config, listes: { ...config.listes, lettre: 0 } };
    expect((await traiterRequete(requete(), { ...deps, config: incomplete })).status).toBe(503);
  });

  test('fait croire au robot que tout va bien, sans rien envoyer', async () => {
    const { appels, evenements, deps } = preparer();
    const reponse = await traiterRequete(requete({ ...lettre, piege: 'http://spam' }), deps);
    expect(await lire(reponse)).toEqual({ statut: 200, corps: { ok: true }, cache: 'no-store' });
    expect(appels).toEqual([]);
    expect(evenements).toEqual([{ formulaire: 'lettre', etape: 'antispam', statut: null }]);
  });

  test('laisse passer une durée valide', async () => {
    const { appels, evenements, deps } = preparer();
    expect((await traiterRequete(requete({ ...lettre, dureeMs: 3000 }), deps)).status).toBe(200);
    expect(appels).toEqual(['https://api.brevo.com/v3/contacts/doubleOptinConfirmation']);
    expect(evenements).toEqual([]);
  });

  test.each([
    ['trop petite', { dureeMs: 2999 }],
    ['absente', { dureeMs: undefined }],
    ['non numérique', { dureeMs: '10000' }],
    ['nulle', { dureeMs: null }],
    ['ancien champ ouvertLe seul', { dureeMs: undefined, ouvertLe: 0 }],
  ])('traite en silence comme un robot : durée %s', async (_cas, ajout) => {
    const { appels, evenements, deps } = preparer();
    expect(await lire(await traiterRequete(requete({ ...lettre, ...ajout }), deps))).toEqual({ statut: 200, corps: { ok: true }, cache: 'no-store' });
    expect(appels).toEqual([]);
    expect(evenements).toEqual([{ formulaire: 'lettre', etape: 'antispam', statut: null }]);
  });

  test.each([
    ['JSON illisible', '{pas du json'],
    ['champs invalides', { ...lettre, champs: { email: 'non' } }],
    ['formulaire inconnu', { ...lettre, formulaire: 'autre' }],
  ])('répond 400 : %s', async (_cas, corps) => {
    const { deps } = preparer();
    expect(await lire(await traiterRequete(requete(corps), deps))).toEqual({ statut: 400, corps: { ok: false }, cache: 'no-store' });
  });

  test('répond 502 quand Brevo échoue sur l’étape indispensable', async () => {
    const { deps } = preparer(500);
    expect((await traiterRequete(requete(), deps)).status).toBe(502);
  });
});
