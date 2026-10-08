// Formats de dates en français pour la page Actualités.
// Les dates des contenus sont lues à minuit UTC : on n’utilise que les accesseurs UTC.

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

const mois = (date: Date): string => MOIS[date.getUTCMonth()]!;
const numeroJour = (date: Date): string => (date.getUTCDate() === 1 ? '1er' : `${date.getUTCDate()}`);
const capitales = (texte: string): string => texte.toLocaleUpperCase('fr-FR');

/** « 2027-02-22 », pour l’attribut datetime. */
export const dateIso = (date: Date): string => date.toISOString().slice(0, 10);

/** « 20 mars », « 1er janvier » */
export const jourMois = (date: Date): string => `${numeroJour(date)} ${mois(date)}`;

/** « samedi » */
export const jourSemaine = (date: Date): string => JOURS[date.getUTCDay()]!;

export const majuscule = (texte: string): string => texte.charAt(0).toLocaleUpperCase('fr-FR') + texte.slice(1);

/** « de février », « d’avril » */
export const deMois = (date: Date): string => (/^[aeiou]/.test(mois(date)) ? `d’${mois(date)}` : `de ${mois(date)}`);

/** « 10h00–12h30 », « 10h00 » ou « » ; les fenêtres utilisent le séparateur « – » entouré d’espaces. */
export const horaire = (debut: string | undefined, fin: string | undefined, separateur = '–'): string => {
  if (!debut) return '';
  return fin ? `${debut}${separateur}${fin}` : debut;
};

export interface PlageStage {
  /** Gros chiffres de la carte : « 22–26 » */
  readonly jours: string;
  /** Sous les chiffres : « FÉVRIER » ou « JUIN–JUILLET » */
  readonly mois: string;
  /** « 2027 » ou « 2026–2027 » */
  readonly annee: string;
  /** Fenêtre : « 22–26 février 2027 » */
  readonly courte: string;
  /** Lecteurs d’écran : « du 22 au 26 février 2027 » */
  readonly longue: string;
}

export const plageStage = (debut: Date, fin: Date): PlageStage => {
  if (fin.getTime() < debut.getTime()) {
    throw new Error(`Stage : la fin (${dateIso(fin)}) précède le début (${dateIso(debut)}).`);
  }
  const anneeDebut = debut.getUTCFullYear();
  const anneeFin = fin.getUTCFullYear();
  const annee = anneeDebut === anneeFin ? `${anneeFin}` : `${anneeDebut}–${anneeFin}`;
  const memeMois = anneeDebut === anneeFin && debut.getUTCMonth() === fin.getUTCMonth();

  if (memeMois && debut.getUTCDate() === fin.getUTCDate()) {
    return { jours: `${fin.getUTCDate()}`, mois: capitales(mois(fin)), annee, courte: `${jourMois(fin)} ${anneeFin}`, longue: `le ${jourMois(fin)} ${anneeFin}` };
  }

  const jours = `${debut.getUTCDate()}–${fin.getUTCDate()}`;
  if (memeMois) {
    return {
      jours,
      mois: capitales(mois(fin)),
      annee,
      courte: `${numeroJour(debut)}–${numeroJour(fin)} ${mois(fin)} ${anneeFin}`,
      longue: `du ${numeroJour(debut)} au ${jourMois(fin)} ${anneeFin}`,
    };
  }

  const premierJour = anneeDebut === anneeFin ? jourMois(debut) : `${jourMois(debut)} ${anneeDebut}`;
  return {
    jours,
    mois: capitales(`${mois(debut)}–${mois(fin)}`),
    annee,
    courte: `${premierJour}–${jourMois(fin)} ${anneeFin}`,
    longue: `du ${premierJour} au ${jourMois(fin)} ${anneeFin}`,
  };
};

/** Années couvertes par les stages : « 2027 » ou « 2026–2027 ». */
export const anneesStages = (debuts: ReadonlyArray<Date>): string => {
  const annees = [...new Set(debuts.map((date) => date.getUTCFullYear()))].sort((a, b) => a - b);
  if (annees.length === 0) return '';
  const premiere = annees[0]!;
  const derniere = annees[annees.length - 1]!;
  return premiere === derniere ? `${premiere}` : `${premiere}–${derniere}`;
};
