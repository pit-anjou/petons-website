// Filtrage des brouillons, tri et association aux programmes. Ces fonctions ne dépendent pas d’Astro, pour être testées par bun test.
import type { Article, Programme, RendezVous, Stage } from '../content/schemas';

export interface Entree<T> {
  readonly id: string;
  readonly data: T;
}

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
    const trouve = programmes.find((programme) => `${programme.id}.md` === stage.data.programme);
    if (!trouve) {
      throw new Error(`Stage « ${stage.id} » : programme « ${stage.data.programme} » introuvable dans src/content/programmes/.`);
    }
    return { ...stage, programme: trouve.data };
  });
