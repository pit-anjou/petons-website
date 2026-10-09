import { describe, expect, test } from 'bun:test';
import { brevo, estConfiguree, type ConfigBrevo } from '../src/data/brevo';
import { AGES, DELAI_MINIMAL_MS, estSpam, LIMITES, SUJETS, valider } from '../src/lib/formulaires/validation';

const contact = { name: ' Camille Martin ', email: 'camille@exemple.fr', phone: '', organisation: '', subject: 'visite', message: 'Bonjour\r\nUne visite ?', newsletter: false };
const inscription = { parentName: 'Camille Martin', email: 'camille@exemple.fr', phone: '06 00 00 00 00', schoolStart: 'septembre 2027', childAge: AGES[0], message: '', newsletter: true };

describe('valider', () => {
  test('nettoie un formulaire de contact valide', () => {
    expect(valider('contact', contact)).toEqual({
      formulaire: 'contact',
      champs: { name: 'Camille Martin', email: 'camille@exemple.fr', phone: '', organisation: '', subject: 'visite', message: 'Bonjour\nUne visite ?', newsletter: false },
    });
  });

  test('accepte une inscription valide', () => {
    expect(valider('inscription', inscription)?.champs).toEqual(inscription);
  });

  test('accepte une demande de lettre', () => {
    expect(valider('lettre', { email: 'a@b.fr' })).toEqual({ formulaire: 'lettre', champs: { email: 'a@b.fr' } });
  });

  test('les champs facultatifs absents deviennent vides, la case lettre devient fausse', () => {
    expect(valider('inscription', { parentName: 'A', email: 'a@b.fr' })?.champs).toEqual({
      parentName: 'A', email: 'a@b.fr', phone: '', schoolStart: '', childAge: '', message: '', newsletter: false,
    });
  });

  test.each([
    ['formulaire inconnu', 'autre', contact],
    ['champs absents', 'contact', undefined],
    ['nom vide', 'contact', { ...contact, name: '   ' }],
    ['e-mail invalide', 'contact', { ...contact, email: 'pas-un-email' }],
    ['sujet hors liste', 'contact', { ...contact, subject: 'piratage' }],
    ['message vide', 'contact', { ...contact, message: '' }],
    ['message trop long', 'contact', { ...contact, message: 'a'.repeat(LIMITES.contact.message + 1) }],
    ['ambiance hors liste', 'inscription', { ...inscription, childAge: '0–3 ans' }],
    ['case lettre non booléenne', 'inscription', { ...inscription, newsletter: 'oui' }],
    ['e-mail trop long', 'lettre', { email: `${'a'.repeat(250)}@b.fr` }],
  ])('refuse : %s', (_cas, formulaire, champs) => {
    expect(valider(formulaire, champs)).toBeNull();
  });

  test('un retour à la ligne Windows compte pour un caractère', () => {
    const message = 'a\r\n'.repeat(LIMITES.contact.message / 2);
    expect(valider('contact', { ...contact, message })).not.toBeNull();
  });

  test('les sujets sont ceux du menu de la page contact', () => {
    expect(Object.keys(SUJETS)).toEqual(['information', 'visite', 'vacances', 'candidature', 'stage', 'partenariat', 'don', 'mecenat', 'autre']);
  });
});

describe('estSpam', () => {
  const maintenant = 1_000_000;
  test('laisse passer un humain', () => expect(estSpam('', maintenant - DELAI_MINIMAL_MS, maintenant)).toBe(false));
  test('piège rempli', () => expect(estSpam('http://spam', maintenant - 60_000, maintenant)).toBe(true));
  test('envoi trop rapide', () => expect(estSpam('', maintenant - DELAI_MINIMAL_MS + 1, maintenant)).toBe(true));
  test('heure d’ouverture absente', () => expect(estSpam('', undefined, maintenant)).toBe(true));
  test('heure d’ouverture invalide', () => expect(estSpam('', 'hier', maintenant)).toBe(true));
  test('heure d’ouverture dans le futur', () => expect(estSpam('', maintenant + 10_000, maintenant)).toBe(true));
});

describe('configuration Brevo', () => {
  const complete: ConfigBrevo = {
    ...brevo,
    listes: { contact: 1, inscription: 2, lettre: 3 },
    modeles: { notificationContact: 1, accuseContact: 2, notificationInscription: 3, accuseInscription: 4, confirmationLettre: 5 },
  };
  test('complète quand tous les numéros sont renseignés', () => expect(estConfiguree(complete)).toBe(true));
  test('incomplète tant qu’un numéro vaut 0', () => expect(estConfiguree({ ...complete, listes: { ...complete.listes, lettre: 0 } })).toBe(false));
  test('l’école reçoit les notifications à l’adresse du site', () => expect(brevo.ecole.email).toBe('contact@lespetons.fr'));
});
