// Validation des formulaires reçus par /api/formulaire. Ne jamais faire confiance au navigateur :
// chaque champ est nettoyé, borné et comparé aux valeurs permises.
import { z } from 'astro/zod';

export type Formulaire = 'contact' | 'inscription' | 'lettre';

/** Sujets du menu de contact-petons.astro, avec leur libellé. */
export const SUJETS = {
  information: 'Une information sur l’école',
  visite: 'Organiser une visite',
  vacances: 'Un stage de vacances pour mon enfant',
  candidature: 'Postuler dans l’équipe',
  stage: 'Demander un stage',
  partenariat: 'Proposer un partenariat',
  don: 'Soutenir par un don',
  mecenat: 'Devenir mécène',
  autre: 'Une autre demande',
} as const;
export type Sujet = keyof typeof SUJETS;

/** Valeurs des boutons radio de inscriptions-petons.astro. */
export const AGES = ['3–6 ans — Les Chenilles', '6–12 ans — Les Papillons'] as const;

/** Longueurs maximales : les mêmes que les maxlength des pages (vérifié par tests/formulaires-pages.test.ts). */
export const LIMITES = {
  contact: { name: 150, email: 254, phone: 35, organisation: 150, message: 3000 },
  inscription: { parentName: 150, email: 254, phone: 35, schoolStart: 100, message: 2500 },
  lettre: { email: 254 },
} as const;

/** Délai minimal entre l'ouverture de la page et l'envoi, en millisecondes. */
export const DELAI_MINIMAL_MS = 3000;

const nettoyer = (valeur: unknown): unknown =>
  valeur === undefined || valeur === null ? '' : typeof valeur === 'string' ? valeur.replace(/\r\n?/g, '\n').trim() : valeur;

const facultatif = (max: number) => z.preprocess(nettoyer, z.string().max(max));
const requis = (max: number) => z.preprocess(nettoyer, z.string().min(1).max(max));
const email = (max: number) => z.preprocess(nettoyer, z.email().max(max));
const caseLettre = z.boolean().default(false);

const schemas = {
  contact: z.object({
    name: requis(LIMITES.contact.name),
    email: email(LIMITES.contact.email),
    phone: facultatif(LIMITES.contact.phone),
    organisation: facultatif(LIMITES.contact.organisation),
    subject: z.enum(Object.keys(SUJETS) as [Sujet, ...Sujet[]]),
    message: requis(LIMITES.contact.message),
    newsletter: caseLettre,
  }),
  inscription: z.object({
    parentName: requis(LIMITES.inscription.parentName),
    email: email(LIMITES.inscription.email),
    phone: facultatif(LIMITES.inscription.phone),
    schoolStart: facultatif(LIMITES.inscription.schoolStart),
    childAge: z.preprocess(nettoyer, z.union([z.enum(AGES), z.literal('')])),
    message: facultatif(LIMITES.inscription.message),
    newsletter: caseLettre,
  }),
  lettre: z.object({ email: email(LIMITES.lettre.email) }),
};

export type ChampsContact = z.output<typeof schemas.contact>;
export type ChampsInscription = z.output<typeof schemas.inscription>;
export type ChampsLettre = z.output<typeof schemas.lettre>;
export type Demande =
  | { formulaire: 'contact'; champs: ChampsContact }
  | { formulaire: 'inscription'; champs: ChampsInscription }
  | { formulaire: 'lettre'; champs: ChampsLettre };

const estFormulaire = (valeur: unknown): valeur is Formulaire => typeof valeur === 'string' && Object.hasOwn(schemas, valeur);

/** Données nettoyées, ou null si le formulaire est inconnu ou un champ invalide. */
export const valider = (formulaire: unknown, champs: unknown): Demande | null => {
  if (!estFormulaire(formulaire)) return null;
  const resultat = schemas[formulaire].safeParse(champs);
  return resultat.success ? ({ formulaire, champs: resultat.data } as Demande) : null;
};

/** Vrai si le champ piège est rempli, ou si l'heure d'ouverture est absente, invalide ou trop récente. */
export const estSpam = (piege: unknown, ouvertLe: unknown, maintenant: number): boolean => {
  if (typeof piege === 'string' && piege !== '') return true;
  if (typeof ouvertLe !== 'number' || !Number.isFinite(ouvertLe)) return true;
  return maintenant - ouvertLe < DELAI_MINIMAL_MS;
};
