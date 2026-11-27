// Contrôles de contenu contre le spam écrit par de vrais navigateurs (qui passent le champ piège
// et la durée minimale) : pas de lien dans les textes libres, et un téléphone plausible.
// Contrairement au champ piège, le refus est expliqué au visiteur : une personne peut corriger et renvoyer.
// Ce fichier n'importe rien : les pages y lisent MOTIF_TELEPHONE pour l'attribut pattern.

export type MotifDeRefus = 'lien' | 'telephone';

/**
 * Numéro français (06 12 34 56 78, 06.12.34.56.78, 0612345678) ou international (+32 470 12 34 56,
 * 0033 6 12 34 56 78, +33 (0)6 12 34 56 78). Même expression dans l'attribut pattern des pages
 * (vérifié par tests/formulaires-pages.test.ts) : y garder des classes de caractères valides en HTML.
 */
export const MOTIF_TELEPHONE = String.raw`\s*(?:0[\s.\-]*[1-9](?:[\s.\-]*\d){8}|(?:\+|00)[\s.\-\(\)]*[1-9](?:[\s.\-\(\)]*\d){6,14})\s*`;
const TELEPHONE = new RegExp(`^${MOTIF_TELEPHONE}$`, 'u');

/** Vrai pour un champ vide (le téléphone est facultatif) ou un numéro plausible. */
export const telephonePlausible = (telephone: string): boolean => telephone === '' || TELEPHONE.test(telephone);

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

/** Pourquoi refuser ces champs, ou null. `textes` : les champs de texte libre du formulaire. */
export const motifDeRefus = ({ textes, telephone = '' }: { textes: readonly string[]; telephone?: string }): MotifDeRefus | null => {
  if (textes.some(contientLien)) return 'lien';
  return telephonePlausible(telephone) ? null : 'telephone';
};
