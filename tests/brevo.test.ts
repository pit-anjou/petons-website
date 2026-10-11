import { expect, test } from 'bun:test';
import { creerClientBrevo, ErreurBrevo, type Fetch } from '../src/lib/brevo';

const enregistreur = (reponse: () => Promise<Response> = async () => new Response(null, { status: 201 })) => {
  const appels: { url: string; init: RequestInit }[] = [];
  const fetch: Fetch = (url, init) => {
    appels.push({ url, init });
    return reponse();
  };
  return { appels, client: creerClientBrevo({ cleApi: 'cle-test', fetch }) };
};
const corps = (init: RequestInit) => JSON.parse(String(init.body));

test('enregistrerContact crée ou met à jour le contact, sans attribut vide', async () => {
  const { appels, client } = enregistreur();
  await client.enregistrerContact({ email: 'a@b.fr', attributs: { NOM_COMPLET: 'A', TELEPHONE: '' }, listes: [4] });
  expect(appels[0]!.url).toBe('https://api.brevo.com/v3/contacts');
  expect(appels[0]!.init.method).toBe('POST');
  expect(appels[0]!.init.headers).toMatchObject({ 'api-key': 'cle-test', 'content-type': 'application/json' });
  expect(corps(appels[0]!.init)).toEqual({ email: 'a@b.fr', attributes: { NOM_COMPLET: 'A' }, listIds: [4], updateEnabled: true });
});

test('envoyerModele envoie un e-mail transactionnel', async () => {
  const { appels, client } = enregistreur();
  await client.envoyerModele({ modele: 7, a: { email: 'ecole@b.fr', nom: 'École' }, repondreA: { email: 'a@b.fr', nom: 'A' }, params: { nom: 'A' } });
  expect(appels[0]!.url).toBe('https://api.brevo.com/v3/smtp/email');
  expect(corps(appels[0]!.init)).toEqual({ templateId: 7, to: [{ email: 'ecole@b.fr', name: 'École' }], replyTo: { email: 'a@b.fr', name: 'A' }, params: { nom: 'A' } });
});

test('envoyerModele sans repondreA n’envoie pas de replyTo', async () => {
  const { appels, client } = enregistreur();
  await client.envoyerModele({ modele: 7, a: { email: 'a@b.fr' }, params: {} });
  expect(corps(appels[0]!.init)).toEqual({ templateId: 7, to: [{ email: 'a@b.fr' }], params: {} });
});

test('demanderConfirmation lance la double confirmation', async () => {
  const { appels, client } = enregistreur();
  await client.demanderConfirmation({ email: 'a@b.fr', listes: [3], modele: 9, redirection: 'https://site.fr/lettre-confirmee.html' });
  expect(appels[0]!.url).toBe('https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
  expect(corps(appels[0]!.init)).toEqual({ email: 'a@b.fr', includeListIds: [3], templateId: 9, redirectionUrl: 'https://site.fr/lettre-confirmee.html' });
});

test('une réponse en erreur devient une ErreurBrevo avec son statut', async () => {
  const { client } = enregistreur(async () => new Response('{"code":"unauthorized"}', { status: 401 }));
  const erreur = await client.enregistrerContact({ email: 'a@b.fr', attributs: {}, listes: [1] }).catch((e: unknown) => e);
  expect(erreur).toBeInstanceOf(ErreurBrevo);
  expect(erreur).toMatchObject({ operation: 'contact', statut: 401 });
});

test('une panne réseau devient une ErreurBrevo sans statut', async () => {
  const { client } = enregistreur(async () => { throw new TypeError('fetch failed'); });
  const erreur = await client.envoyerModele({ modele: 1, a: { email: 'a@b.fr' }, params: {} }).catch((e: unknown) => e);
  expect(erreur).toMatchObject({ operation: 'email', statut: null });
});

test('chaque appel est limité dans le temps', async () => {
  const { appels, client } = enregistreur();
  await client.demanderConfirmation({ email: 'a@b.fr', listes: [1], modele: 1, redirection: 'https://s.fr/' });
  expect(appels[0]!.init.signal).toBeInstanceOf(AbortSignal);
});
