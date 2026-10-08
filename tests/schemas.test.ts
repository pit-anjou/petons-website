// Règles de validation des schémas : une erreur d’éditeur doit faire échouer le build, jamais produire un rendu faux.
import { expect, test } from 'bun:test';
import { programmeSchema, rendezVousSchema, stageSchema } from '../src/content/schemas';

const image = 'assets/img/actualites/eco-ecole.svg';

const rendezVous = (surcharge: Record<string, unknown> = {}) => ({
  titre: 'Portes ouvertes',
  date: '2027-03-20',
  mention: 'Sans inscription',
  resume: 'Venez nous rencontrer.',
  visuel: { image, alt: 'Logo' },
  surtitre: 'Rencontrer l’école',
  ...surcharge,
});

const stage = (surcharge: Record<string, unknown> = {}) => ({
  programme: 'enfants.md',
  debut: '2027-02-22',
  fin: '2027-02-26',
  vacances: 'hiver',
  image,
  prix: 200,
  prixFratrie: 180,
  effectif: 14,
  ...surcharge,
});

const messages = (resultat: { error?: { issues: ReadonlyArray<{ message: string }> } }): string[] => (resultat.error?.issues ?? []).map((issue) => issue.message);

// Liens (M4)

const avecLien = (url: string) => rendezVousSchema.safeParse(rendezVous({ liens: [{ libelle: 'Lien', url }] }));

test('les liens acceptent https, http, mailto, tel, une page du site et une ancre', () => {
  for (const url of [
    'https://www.eco-ecole.org/',
    'http://exemple.fr',
    'HTTPS://exemple.fr',
    'https://www.google.com/maps/dir/?api=1&destination=6%20rue%20de%20la%20Petite%20Sensive%2C%2044300%20Nantes',
    'mailto:contact@exemple.fr',
    'tel:+33600000000',
    'contact-petons.html',
    'contact-petons.html?sujet=visite',
    'actualites-petons.html#agenda',
    '#agenda',
  ]) {
    expect(messages(avecLien(url))).toEqual([]);
  }
});

test('les liens refusent javascript:, data: et les adresses sans schéma reconnu', () => {
  for (const url of ['javascript:alert(1)', ' javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', 'vbscript:x', 'ftp://exemple.fr', '//exemple.fr', 'exemple.fr', 'page.php', 'https://', 'https://a b']) {
    expect(messages(avecLien(url)).join(' ')).toContain('Adresse attendue');
  }
});

// Heure de fin (M5)

test('un rendez-vous peut avoir une heure de début seule, ou les deux, ou aucune', () => {
  expect(rendezVousSchema.safeParse(rendezVous()).success).toBe(true);
  expect(rendezVousSchema.safeParse(rendezVous({ heureDebut: '10h00' })).success).toBe(true);
  expect(rendezVousSchema.safeParse(rendezVous({ heureDebut: '10h00', heureFin: '12h30' })).success).toBe(true);
});

test('une heure de fin sans heure de début est refusée', () => {
  const resultat = rendezVousSchema.safeParse(rendezVous({ heureFin: '12h30' }));
  expect(messages(resultat)).toEqual(['Une heure de fin demande une heure de début']);
  expect(resultat.error?.issues[0]?.path).toEqual(['heureDebut']);
});

// Raffinements existants (M6)

test('un visuel avec une image ET une illustration est refusé', () => {
  const resultat = rendezVousSchema.safeParse(rendezVous({ visuel: { image, illustration: 'carnaval', alt: 'x' } }));
  expect(messages(resultat)).toEqual(['Choisir une image ou une illustration animée, pas les deux']);
});

test('un visuel sans image ni illustration est refusé', () => {
  const resultat = rendezVousSchema.safeParse(rendezVous({ visuel: { alt: 'x' } }));
  expect(messages(resultat)).toEqual(['Choisir une image ou une illustration animée, pas les deux']);
});

test('un visuel avec seulement une illustration est accepté', () => {
  expect(rendezVousSchema.safeParse(rendezVous({ visuel: { illustration: 'carnaval', alt: 'x' } })).success).toBe(true);
});

test('un stage qui finit avant son début est refusé', () => {
  const resultat = stageSchema.safeParse(stage({ debut: '2027-02-26', fin: '2027-02-22' }));
  expect(messages(resultat)).toEqual(['La date de fin précède la date de début']);
  expect(resultat.error?.issues[0]?.path).toEqual(['fin']);
});

test('un stage d’un seul jour est accepté', () => {
  expect(stageSchema.safeParse(stage({ fin: '2027-02-22' })).success).toBe(true);
});

const programme = async (modifier: (donnees: Record<string, unknown>) => void = () => {}) => {
  const texte = await Bun.file('src/content/programmes/histoires-objets-inventes-enfants.md').text();
  const donnees = Bun.YAML.parse(/^---\n([\s\S]*?)\n---/.exec(texte)![1]!) as Record<string, unknown>;
  modifier(donnees);
  return programmeSchema.safeParse(donnees);
};

test('un programme avec un bloc « restitution » et une heure est accepté', async () => {
  expect(messages(await programme())).toEqual([]);
});

test('un programme avec un bloc « restitution » mais sans heure est refusé', async () => {
  const resultat = await programme((donnees) => delete donnees.restitution);
  expect(messages(resultat)).toEqual(['Un bloc « Restitution » demande l’heure de restitution']);
  expect(resultat.error?.issues[0]?.path).toEqual(['restitution']);
});
