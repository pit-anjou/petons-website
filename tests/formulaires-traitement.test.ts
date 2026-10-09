import { describe, expect, test } from 'bun:test';
import type { ConfigBrevo } from '../src/data/brevo';
import { ErreurBrevo, type ClientBrevo } from '../src/lib/brevo';
import { traiter, type Journal } from '../src/lib/formulaires/traitement';
import type { Demande } from '../src/lib/formulaires/validation';

const config: ConfigBrevo = {
  ecole: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' },
  listes: { contact: 11, inscription: 12, lettre: 13 },
  modeles: { notificationContact: 21, accuseContact: 22, notificationInscription: 23, accuseInscription: 24, confirmationLettre: 25 },
  pageConfirmationLettre: 'lettre-confirmee.html',
};

type Appel = [methode: keyof ClientBrevo, argument: unknown];
const faux = (echecs: Partial<Record<string, number | null>> = {}) => {
  const appels: Appel[] = [];
  const evenements: Parameters<Journal>[0][] = [];
  const agir = (methode: keyof ClientBrevo, cle: string) => async (argument: unknown) => {
    appels.push([methode, argument]);
    if (cle in echecs) throw new ErreurBrevo(cle, echecs[cle] ?? null);
  };
  const client: ClientBrevo = {
    enregistrerContact: agir('enregistrerContact', 'contact'),
    envoyerModele: async (envoi) => agir('envoyerModele', envoi.modele === 21 || envoi.modele === 23 ? 'notification' : 'accuse')(envoi),
    demanderConfirmation: agir('demanderConfirmation', 'confirmation'),
  };
  return { appels, evenements, deps: { client, config, origine: 'https://lespetons.fr', journal: (e: Parameters<Journal>[0]) => evenements.push(e) } };
};

const contact: Demande = {
  formulaire: 'contact',
  champs: { name: 'Camille <b>M</b>', email: 'c@b.fr', phone: '', organisation: 'Asso', subject: 'visite', message: 'Bonjour', newsletter: false },
};
const inscription: Demande = {
  formulaire: 'inscription',
  champs: { parentName: 'Camille', email: 'c@b.fr', phone: '06', schoolStart: 'sept. 2027', childAge: '3–6 ans — Les Chenilles', message: '', newsletter: true },
};

describe('contact', () => {
  test('notifie l’école d’abord, puis enregistre le contact et envoie l’accusé', async () => {
    const { appels, deps } = faux();
    expect(await traiter(contact, deps)).toBe('envoye');
    expect(appels[0]).toEqual(['envoyerModele', {
      modele: 21,
      a: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' },
      repondreA: { email: 'c@b.fr', nom: 'Camille <b>M</b>' },
      params: { nom: 'Camille &lt;b&gt;M&lt;/b&gt;', email: 'c@b.fr', telephone: '', structure: 'Asso', sujet: 'Organiser une visite', message: 'Bonjour', lettre: 'non' },
    }]);
    expect(appels.slice(1)).toEqual([
      ['enregistrerContact', { email: 'c@b.fr', attributs: { NOM_COMPLET: 'Camille <b>M</b>', TELEPHONE: '', STRUCTURE: 'Asso' }, listes: [11] }],
      ['envoyerModele', { modele: 22, a: { email: 'c@b.fr', nom: 'Camille <b>M</b>' }, repondreA: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' }, params: { nom: 'Camille &lt;b&gt;M&lt;/b&gt;', sujet: 'Organiser une visite', message: 'Bonjour' } }],
    ]);
  });

  test('sans case lettre, aucune double confirmation', async () => {
    const { appels, deps } = faux();
    await traiter(contact, deps);
    expect(appels.map(([methode]) => methode)).not.toContain('demanderConfirmation');
  });

  test('un échec de la notification fait échouer l’envoi, sans autre appel', async () => {
    const { appels, evenements, deps } = faux({ notification: 500 });
    expect(await traiter(contact, deps)).toBe('echec');
    expect(appels).toHaveLength(1);
    expect(evenements).toEqual([{ formulaire: 'contact', etape: 'notification', statut: 500 }]);
  });

  test('un échec du contact ou de l’accusé est consigné mais l’envoi réussit', async () => {
    const { evenements, deps } = faux({ contact: 400, accuse: null });
    expect(await traiter(contact, deps)).toBe('envoye');
    expect(evenements).toEqual([
      { formulaire: 'contact', etape: 'contact', statut: 400 },
      { formulaire: 'contact', etape: 'accuse', statut: null },
    ]);
  });
});

describe('inscription', () => {
  test('envoie les bons modèles, la bonne liste et la double confirmation demandée', async () => {
    const { appels, deps } = faux();
    expect(await traiter(inscription, deps)).toBe('envoye');
    expect(appels[0]![1]).toMatchObject({
      modele: 23,
      params: { nom: 'Camille', email: 'c@b.fr', telephone: '06', rentree: 'sept. 2027', age: '3–6 ans — Les Chenilles', message: '', lettre: 'oui' },
    });
    expect(appels.slice(1)).toEqual([
      ['enregistrerContact', { email: 'c@b.fr', attributs: { NOM_COMPLET: 'Camille', TELEPHONE: '06', RENTREE_SOUHAITEE: 'sept. 2027', TRANCHE_AGE: '3–6 ans — Les Chenilles' }, listes: [12] }],
      ['envoyerModele', { modele: 24, a: { email: 'c@b.fr', nom: 'Camille' }, repondreA: { email: 'contact@lespetons.fr', nom: 'Les Petons dans l’Herbe' }, params: { nom: 'Camille', rentree: 'sept. 2027', age: '3–6 ans — Les Chenilles', message: '' } }],
      ['demanderConfirmation', { email: 'c@b.fr', listes: [13], modele: 25, redirection: 'https://lespetons.fr/lettre-confirmee.html' }],
    ]);
  });
});

describe('lettre', () => {
  const lettre: Demande = { formulaire: 'lettre', champs: { email: 'c@b.fr' } };

  test('lance seulement la double confirmation', async () => {
    const { appels, deps } = faux();
    expect(await traiter(lettre, deps)).toBe('envoye');
    expect(appels).toEqual([['demanderConfirmation', { email: 'c@b.fr', listes: [13], modele: 25, redirection: 'https://lespetons.fr/lettre-confirmee.html' }]]);
  });

  test('un échec de la double confirmation fait échouer l’envoi', async () => {
    const { evenements, deps } = faux({ confirmation: 503 });
    expect(await traiter(lettre, deps)).toBe('echec');
    expect(evenements).toEqual([{ formulaire: 'lettre', etape: 'confirmation', statut: 503 }]);
  });
});
