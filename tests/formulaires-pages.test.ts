// Invariants des formulaires construits (à lancer après « bun run build »).
import { describe, expect, test } from 'bun:test';
import { LIMITES } from '../src/lib/formulaires/validation';
import { chargerHtml, DOSSIER_PAGES } from './outils/html';

const formulaires = [
  { page: 'contact-petons.html', selecteur: '#contact-form', limites: LIMITES.contact, caseLettre: true },
  { page: 'inscriptions-petons.html', selecteur: '#admission-form', limites: LIMITES.inscription, caseLettre: true },
] as const;

for (const { page, selecteur, limites, caseLettre } of formulaires) {
  // Chargé avant describe : bun n'attend pas un describe asynchrone.
  const html = await chargerHtml(`${DOSSIER_PAGES}/${page}`);
  const form = html.querySelector(selecteur)!;

  describe(`${page} ${selecteur}`, () => {
    test('est marqué pour l’envoi à Brevo et garde le repli mailto sans JavaScript', () => {
      expect(form.hasAttribute('data-brevo')).toBe(true);
      expect(form.getAttribute('action')).toBe('mailto:contact@lespetons.fr');
    });

    test('contient un champ piège invisible et hors tabulation', () => {
      const piege = form.querySelector('input[name="piege"]')!;
      expect(piege.getAttribute('tabindex')).toBe('-1');
      expect(piege.getAttribute('autocomplete')).toBe('off');
      expect(piege.closest('.form-trap')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('les maxlength sont ceux de la validation serveur', () => {
      for (const [nom, max] of Object.entries(limites)) {
        expect(form.querySelector(`[name="${nom}"]`)?.getAttribute('maxlength')).toBe(String(max));
      }
    });

    test('annonce l’usage des données, Brevo et la durée de conservation', () => {
      const mention = form.querySelector('.form-privacy')?.text ?? '';
      expect(mention).toContain('Brevo');
      expect(mention).toContain(caseLettre ? '3 ans' : 'désinscrire');
    });

    if (caseLettre) {
      test('propose la lettre par une case non cochée', () => {
        const case_ = form.querySelector('input[type="checkbox"][name="newsletter"]')!;
        expect(case_.hasAttribute('checked')).toBe(false);
      });
    }
  });
}
