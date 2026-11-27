// Contrôle de contenu contre le spam écrit par de vrais navigateurs (qui passent le champ piège
// et la durée minimale) : pas de lien dans les textes libres.
// Contrairement au champ piège, le refus est expliqué au visiteur : une personne peut corriger et renvoyer.

/** Extensions reconnues sans « http » ni « www ». Sans les mots français courants (de, me, es, it…). */
const EXTENSIONS = 'com|fr|net|org|io|info|biz|xyz|store|shop|online|site|top|link|app|dev|ru|cn|uk';
const LIENS = [
  /https?:\/\/|\bwww\./i,
  // exemple.com, boutique.exemple.store — mais pas une adresse e-mail (camille@exemple.fr).
  new RegExp(String.raw`(?<![@\w.\-])(?:[a-z0-9\-]+\.)+(?:${EXTENSIONS})\b(?![\w.\-]*@)`, 'i'),
  // Tout domaine suivi d'un chemin : wa.me/336…, bit.ly/abc.
  /(?<![@\w.\-])(?:[a-z0-9\-]+\.)+[a-z]{2,}\/\S/i,
];

/** Vrai si le texte contient un lien ou une adresse de site. Une adresse e-mail n'est pas un lien. */
export const contientLien = (texte: string): boolean => LIENS.some((lien) => lien.test(texte));
