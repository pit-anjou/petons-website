import { describe, expect, test } from 'bun:test';
import { contientLien } from '../src/lib/formulaires/antispam';

describe('contientLien', () => {
  test.each([
    ['spam reçu : boutique', 'Regarde par ici : https://tanthroughswim.store À plus !'],
    ['spam reçu : WhatsApp', 'Ça vous intéresse ? https://wa.me/34632897517?text=Bonjour Redouane, Dassom'],
    ['http', 'voir http://exemple.test'],
    ['www', 'Allez sur www.exemple.test'],
    ['domaine nu', 'Regarde tanthroughswim.store, c’est super'],
    ['domaine en majuscules', 'Visitez EXEMPLE.COM'],
    ['sous-domaine', 'boutique.exemple.fr'],
    ['lien court sans http', 'wa.me/34632897517'],
    ['autre lien court', 'bit.ly/abc'],
  ])('repère un lien : %s', (_cas, texte) => expect(contientLien(texte)).toBe(true));

  test.each([
    ['message ordinaire', 'Bonjour,\nNous aimerions visiter l’école pour notre fille de 4 ans. Merci !'],
    ['adresse e-mail', 'Écrivez-moi à camille.martin@exemple.fr ou camille@mail.exemple.com.'],
    ['point sans espace', 'Merci.Bonne journée.Je reste disponible.De préférence le matin.'],
    ['abréviations et heures', 'Rdv le 12.03 à 8h15, cf. p.4 — M. et Mme Martin (env. 3,5 ans).'],
    ['barre oblique', 'lundi/mardi et/ou jeudi, 06/12/2027'],
    ['mot qui commence comme une extension', 'ma.communication et mon.organisation'],
    ['texte vide', ''],
  ])('laisse passer : %s', (_cas, texte) => expect(contientLien(texte)).toBe(false));
});
