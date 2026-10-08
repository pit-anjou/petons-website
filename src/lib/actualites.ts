// Filtrage des brouillons, tri et association aux programmes. Ces fonctions ne dépendent pas d’Astro, pour être testées par bun test.
import type { Article, Programme, RendezVous, Stage } from '../content/schemas';

export interface Entree<T> {
  readonly id: string;
  /** Chemin du fichier source (fourni par Astro) ; son nom est celui que Page CMS cite dans `programme`. */
  readonly filePath?: string;
  readonly data: T;
}

/** Nom de fichier réel d’une entrée. L’`id` d’Astro est slugifié (« Stage Été.md » donne « stage-ete »), pas le nom que Page CMS enregistre. */
const nomDeFichier = (entree: Entree<unknown>): string => entree.filePath?.split('/').pop() ?? `${entree.id}.md`;

const publiees = <T extends { brouillon: boolean }, E extends Entree<T>>(entrees: ReadonlyArray<E>): E[] =>
  entrees.filter((entree) => !entree.data.brouillon);

const parDate = <T, E extends Entree<T>>(date: (data: T) => Date, sens: 1 | -1) => (a: E, b: E): number =>
  sens * (date(a.data).getTime() - date(b.data).getTime()) || a.id.localeCompare(b.id);

/** Stages publiés, du plus proche au plus lointain. */
export const stagesAffiches = <E extends Entree<Stage>>(entrees: ReadonlyArray<E>): E[] =>
  publiees<Stage, E>(entrees).sort(parDate<Stage, E>((stage) => stage.debut, 1));

/** Rendez-vous publiés, du plus proche au plus lointain. */
export const rendezVousAffiches = <E extends Entree<RendezVous>>(entrees: ReadonlyArray<E>): E[] =>
  publiees<RendezVous, E>(entrees).sort(parDate<RendezVous, E>((rendezVous) => rendezVous.date, 1));

/** Articles publiés, du plus récent au plus ancien. */
export const articlesAffiches = <E extends Entree<Article>>(entrees: ReadonlyArray<E>): E[] =>
  publiees<Article, E>(entrees).sort(parDate<Article, E>((article) => article.date, -1));

/** Ajoute à chaque stage le programme qu’il cite ; un programme introuvable fait échouer le build. */
export const avecProgramme = <E extends Entree<Stage>>(
  stages: ReadonlyArray<E>,
  programmes: ReadonlyArray<Entree<Programme>>,
): Array<E & { readonly programme: Programme }> =>
  stages.map((stage) => {
    const trouve = programmes.find((programme) => nomDeFichier(programme) === stage.data.programme);
    if (!trouve) {
      throw new Error(`Stage « ${stage.id} » : programme « ${stage.data.programme} » introuvable dans src/content/programmes/.`);
    }
    return { ...stage, programme: trouve.data };
  });

/**
 * Chaque actualité sert d’identifiant HTML à sa carte et à sa fenêtre : deux identifiants identiques
 * (un rendez-vous et un article de même titre, par exemple) ouvriraient la mauvaise fenêtre sans aucune erreur.
 * Lève une erreur qui liste les doublons entre collections et les identifiants déjà utilisés par la page.
 */
export const verifierIdentifiants = (ids: ReadonlyArray<string>, reserves: ReadonlyArray<string>): void => {
  const doublons = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const dejaPris = [...new Set(ids.filter((id) => reserves.includes(id)))];
  const messages = [
    ...doublons.map((id) => `Deux actualités ont le même nom de fichier : « ${id} ». Renommez le titre de l’une d’elles avant de l’enregistrer.`),
    ...dejaPris.map((id) => `Le nom de fichier « ${id} » est déjà utilisé par la page. Renommez le titre de cette actualité avant de l’enregistrer.`),
  ];
  if (messages.length > 0) throw new Error(messages.join('\n'));
};
