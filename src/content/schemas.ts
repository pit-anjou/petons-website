// Schémas des actualités modifiables dans Page CMS.
// Chaque champ doit aussi être déclaré dans .pages.yml (vérifié par tests/pages-cms.test.ts) :
// Page CMS efface à l’enregistrement les champs qu’il ne connaît pas.
// Les textes « en ligne » acceptent **gras**, ==surligné vert== et ++surligné orange++ (src/lib/markdown.ts).
import { z } from 'astro/zod';

const texteRequis = z.string().trim().min(1);
const heure = z.string().regex(/^\d{1,2}h\d{2}$/, 'Heure attendue au format 10h00');
/** Extensions d’image acceptées ; .pages.yml (media.extensions) doit citer les mêmes. */
export const EXTENSIONS_IMAGE = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'] as const;
const image = z.string().regex(new RegExp(`^assets/img/actualites/[^/]+\\.(?:${EXTENSIONS_IMAGE.join('|')})$`, 'i'), 'Image attendue dans assets/img/actualites/');
const pourcentage = (parDefaut: number) => z.number().int().min(0).max(100).default(parDefaut);

export const VACANCES = ['toussaint', 'noel', 'hiver', 'printemps', 'ete'] as const;
export const COULEURS_STAGE = ['vert', 'menthe', 'orange', 'bleu'] as const;
export const PRESENTATIONS_SECTION = ['simple', 'separee', 'mise-en-avant'] as const;
export const FONDS = ['photo', 'vert', 'sable'] as const;
export const ILLUSTRATIONS = ['carnaval'] as const;
export const ICONES = ['livre', 'bulle', 'famille', 'pousse', 'crayon', 'coeur', 'vent', 'etoile', 'calendrier'] as const;
export const STYLES_LIEN = ['bouton', 'lien'] as const;

/** Élément d’une liste illustrée : une « force » ou une « étape » d’un programme. */
const elementIllustre = z.object({ icone: z.enum(ICONES), titre: texteRequis, texte: texteRequis }).strict();

const blocProgrammeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('texte'), contenu: texteRequis }).strict(),
  z.object({
    type: z.literal('intervenants'),
    personnes: z.array(z.object({ photo: image, alt: texteRequis, nom: texteRequis, presentation: texteRequis }).strict()).min(1),
  }).strict(),
  z.object({ type: z.literal('forces'), elements: z.array(elementIllustre).min(1) }).strict(),
  z.object({ type: z.literal('etapes'), elements: z.array(elementIllustre).min(1) }).strict(),
  z.object({ type: z.literal('illustration'), image, alt: texteRequis }).strict(),
  z.object({ type: z.literal('restitution'), titre: texteRequis, precision: z.string().optional() }).strict(),
]);

const sectionSchema = z.object({
  titre: texteRequis,
  icone: z.enum(ICONES),
  presentation: z.enum(PRESENTATIONS_SECTION).default('simple'),
  blocs: z.array(blocProgrammeSchema).min(1),
}).strict();

/** Contenu de la fenêtre « Programme & infos » d’un stage. Une fiche par public. */
export const programmeSchema = z.object({
  /** Nom de la fiche, visible seulement dans Page CMS. */
  nom: texteRequis,
  /** Une ligne par retour : <br> sur la carte, 2e ligne surlignée dans la fenêtre. */
  titre: texteRequis,
  accroche: texteRequis,
  discipline: texteRequis,
  ages: texteRequis,
  agesDeA: texteRequis,
  etiquette: texteRequis,
  description: texteRequis,
  public: texteRequis,
  participants: texteRequis,
  participantsCarte: z.string().optional(),
  encadrement: texteRequis,
  intro: texteRequis,
  horaires: texteRequis,
  accueil: texteRequis,
  jours: texteRequis,
  lieu: texteRequis,
  restitution: heure.optional(),
  sections: z.array(sectionSchema).min(1),
  sac: z.object({
    titre: texteRequis,
    sousTitre: z.string().optional(),
    objets: z.array(z.object({ image, texte: texteRequis }).strict()).min(1),
  }).strict().optional(),
  inscription: texteRequis,
}).strict().refine(
  (programme) => Boolean(programme.restitution) || !programme.sections.some((section) => section.blocs.some((bloc) => bloc.type === 'restitution')),
  { message: 'Un bloc « Restitution » demande l’heure de restitution', path: ['restitution'] },
);

/** Une session de stage : elle choisit son programme et fixe ses dates, son prix et son nombre de places. */
export const stageSchema = z.object({
  programme: z.string().regex(/^[^/]+\.md$/, 'Choisir un programme'),
  debut: z.coerce.date(),
  fin: z.coerce.date(),
  vacances: z.enum(VACANCES),
  image,
  cadrage: pourcentage(5),
  couleur: z.enum(COULEURS_STAGE).default('vert'),
  prix: z.number().int().positive(),
  prixFratrie: z.number().int().positive(),
  effectif: z.number().int().positive(),
  note: z.string().optional(),
  brouillon: z.boolean().default(false),
}).strict().refine((stage) => stage.fin >= stage.debut, { message: 'La date de fin précède la date de début', path: ['fin'] });

const visuelSchema = z.object({
  image: image.optional(),
  illustration: z.enum(ILLUSTRATIONS).optional(),
  alt: texteRequis,
  fond: z.enum(FONDS).default('photo'),
  cadrage: pourcentage(50),
  etiquette: z.string().optional(),
}).strict().refine((visuel) => Boolean(visuel.image) !== Boolean(visuel.illustration), {
  message: 'Choisir une image ou une illustration animée, pas les deux',
});

/** https://…, http://…, mailto:…, tel:…, une page du site (contact-petons.html?sujet=visite) ou une ancre (#agenda). Refuse notamment javascript:. */
const ADRESSE_AUTORISEE = /^(?:https?:\/\/[^\s/]\S*|mailto:\S+|tel:\S+|[\w-]+\.html(?:[?#]\S*)?|#\S*)$/i;

const lienSchema = z.object({
  libelle: texteRequis,
  url: z.string().trim().regex(ADRESSE_AUTORISEE, 'Adresse attendue : https://…, mailto:…, tel:…, une page du site (contact-petons.html) ou une ancre (#agenda)'),
  style: z.enum(STYLES_LIEN).default('lien'),
  nouvelOnglet: z.boolean().default(false),
}).strict();

const blocSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('texte'), contenu: texteRequis }).strict(),
  z.object({ type: z.literal('intertitre'), titre: texteRequis, logo: image.optional(), logoAlt: z.string().optional() }).strict(),
  z.object({ type: z.literal('photo'), image, alt: texteRequis, legende: z.string().optional() }).strict(),
]);

/** Champs communs aux rendez-vous et aux articles. */
const communs = {
  titre: texteRequis,
  /** Titre de la fenêtre ; chaque retour à la ligne devient <br>. */
  titreModale: z.string().optional(),
  date: z.coerce.date(),
  resume: texteRequis,
  visuel: visuelSchema,
  surtitre: texteRequis,
  blocs: z.array(blocSchema).default([]),
  liens: z.array(lienSchema).default([]),
  brouillon: z.boolean().default(false),
};

export const rendezVousSchema = z.object({
  ...communs,
  heureDebut: heure.optional(),
  heureFin: heure.optional(),
  mention: texteRequis,
  bouton: texteRequis.default('Voir les détails'),
  intro: z.string().optional(),
  pointsForts: z.array(elementIllustre).default([]),
  encadre: z.object({ titre: texteRequis, texte: z.string().optional() }).strict().optional(),
}).strict().refine((rendezVous) => !rendezVous.heureFin || Boolean(rendezVous.heureDebut), {
  message: 'Une heure de fin demande une heure de début',
  path: ['heureDebut'],
});

export const articleSchema = z.object({
  ...communs,
  rubrique: texteRequis.default('Retour sur un événement'),
  repere: texteRequis,
  intro: texteRequis,
}).strict();

export type Programme = z.infer<typeof programmeSchema>;
export type SectionProgramme = Programme['sections'][number];
export type Stage = z.infer<typeof stageSchema>;
export type RendezVous = z.infer<typeof rendezVousSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Visuel = RendezVous['visuel'];
export type Bloc = RendezVous['blocs'][number];
export type Lien = RendezVous['liens'][number];
