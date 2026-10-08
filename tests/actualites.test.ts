import { expect, test } from 'bun:test';
import { articleSchema, rendezVousSchema, stageSchema, type Programme } from '../src/content/schemas';
import { articlesAffiches, avecProgramme, rendezVousAffiches, stagesAffiches } from '../src/lib/actualites';

const visuel = { image: 'assets/img/actualites/eco-ecole.svg', alt: 'Logo' };

const stage = (id: string, debut: string, brouillon = false, programme = 'p.md') => ({
  id,
  data: stageSchema.parse({ programme, debut, fin: debut, vacances: 'hiver', image: 'assets/img/actualites/eco-ecole.svg', prix: 1, prixFratrie: 1, effectif: 1, brouillon }),
});
const rendezVous = (id: string, date: string, brouillon = false) => ({
  id,
  data: rendezVousSchema.parse({ titre: id, date, mention: 'm', resume: 'r', visuel, surtitre: 's', brouillon }),
});
const article = (id: string, date: string, brouillon = false) => ({
  id,
  data: articleSchema.parse({ titre: id, date, repere: 'r', resume: 'r', visuel, surtitre: 's', intro: 'i', brouillon }),
});

test('les stages sont triés du plus proche au plus lointain, sans les brouillons', () => {
  const ids = stagesAffiches([stage('juillet', '2027-07-12'), stage('fevrier', '2027-02-22'), stage('cache', '2027-01-01', true)]).map((e) => e.id);
  expect(ids).toEqual(['fevrier', 'juillet']);
});

test('les rendez-vous sont triés par date croissante, sans les brouillons', () => {
  const ids = rendezVousAffiches([rendezVous('portes', '2027-03-20'), rendezVous('carnaval', '2027-02-17'), rendezVous('cache', '2027-01-01', true)]).map((e) => e.id);
  expect(ids).toEqual(['carnaval', 'portes']);
});

test('les articles sont triés du plus récent au plus ancien, sans les brouillons', () => {
  const ids = articlesAffiches([article('cross', '2026-06-01'), article('eco', '2026-09-25'), article('cache', '2026-12-01', true)]).map((e) => e.id);
  expect(ids).toEqual(['eco', 'cross']);
});

test('à date égale, l’ordre suit le nom de fichier', () => {
  const ids = stagesAffiches([stage('b', '2027-02-22'), stage('a', '2027-02-22')]).map((e) => e.id);
  expect(ids).toEqual(['a', 'b']);
});

test('avecProgramme associe chaque stage à son programme', () => {
  const programme = { nom: 'Enfants' } as Programme;
  const [associe] = avecProgramme([stage('s', '2027-02-22', false, 'enfants.md')], [{ id: 'enfants', data: programme }]);
  expect(associe!.programme).toBe(programme);
  expect(associe!.id).toBe('s');
});

test('avecProgramme refuse un programme introuvable', () => {
  expect(() => avecProgramme([stage('s', '2027-02-22', false, 'absent.md')], [])).toThrow('absent.md');
});
