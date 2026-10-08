import { describe, expect, test } from 'bun:test';
import { anneesStages, dateIso, deMois, horaire, jourMois, jourSemaine, majuscule, plageStage } from '../src/lib/dates';

// Minuit UTC, comme les dates lues dans les fichiers de contenu.
const d = (iso: string) => new Date(iso);

describe('dates simples', () => {
  test('jourMois', () => {
    expect(jourMois(d('2027-03-20'))).toBe('20 mars');
    expect(jourMois(d('2027-01-01'))).toBe('1er janvier');
  });
  test('jourSemaine', () => expect(jourSemaine(d('2027-02-17'))).toBe('mercredi'));
  test('majuscule', () => expect(majuscule('samedi')).toBe('Samedi'));
  test('dateIso', () => expect(dateIso(d('2027-02-22'))).toBe('2027-02-22'));
  test('deMois élide devant une voyelle', () => {
    expect(deMois(d('2027-02-22'))).toBe('de février');
    expect(deMois(d('2027-04-26'))).toBe('d’avril');
    expect(deMois(d('2027-08-02'))).toBe('d’août');
    expect(deMois(d('2026-10-19'))).toBe('d’octobre');
  });
  test('horaire', () => {
    expect(horaire('10h00', '12h30')).toBe('10h00–12h30');
    expect(horaire('10h00', '12h30', ' – ')).toBe('10h00 – 12h30');
    expect(horaire('18h00', undefined)).toBe('18h00');
    expect(horaire(undefined, undefined)).toBe('');
  });
});

describe('plageStage', () => {
  test('dans un même mois', () => {
    expect(plageStage(d('2027-02-22'), d('2027-02-26'))).toEqual({
      jours: '22–26', mois: 'FÉVRIER', annee: '2027',
      courte: '22–26 février 2027', longue: 'du 22 au 26 février 2027',
    });
  });
  test('à cheval sur deux mois', () => {
    expect(plageStage(d('2027-06-28'), d('2027-07-02'))).toEqual({
      jours: '28–2', mois: 'JUIN–JUILLET', annee: '2027',
      courte: '28 juin–2 juillet 2027', longue: 'du 28 juin au 2 juillet 2027',
    });
  });
  test('à cheval sur deux années', () => {
    expect(plageStage(d('2026-12-28'), d('2027-01-01'))).toEqual({
      jours: '28–1', mois: 'DÉCEMBRE–JANVIER', annee: '2026–2027',
      courte: '28 décembre 2026–1er janvier 2027', longue: 'du 28 décembre 2026 au 1er janvier 2027',
    });
  });
  test('sur une seule journée', () => {
    expect(plageStage(d('2027-04-28'), d('2027-04-28'))).toEqual({
      jours: '28', mois: 'AVRIL', annee: '2027',
      courte: '28 avril 2027', longue: 'le 28 avril 2027',
    });
  });
  test('refuse une fin avant le début', () => {
    expect(() => plageStage(d('2027-02-26'), d('2027-02-22'))).toThrow('précède');
  });
});

describe('anneesStages', () => {
  test('une seule année', () => expect(anneesStages([d('2027-02-22'), d('2027-07-12')])).toBe('2027'));
  test('plusieurs années', () => expect(anneesStages([d('2027-02-22'), d('2026-10-19')])).toBe('2026–2027'));
  test('aucun stage', () => expect(anneesStages([])).toBe(''));
});
