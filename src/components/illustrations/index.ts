// Illustrations animées proposées dans Page CMS (champ « Illustration animée »).
// Pour en ajouter une : créer le composant ici, puis l’ajouter à ILLUSTRATIONS (src/content/schemas.ts) et à .pages.yml.
import Carnaval from './Carnaval.astro';

export const illustrations = { carnaval: Carnaval } as const;
