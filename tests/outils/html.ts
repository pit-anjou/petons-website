// Outils de lecture du HTML produit par le build, pour les tests.
import { parse, type HTMLElement } from 'node-html-parser';

/** Dossier où « bun run build » écrit les pages .html (il change avec l'adaptateur Vercel). */
export const DOSSIER_PAGES = 'dist/client';

/** Charge un fichier HTML (build ou photo de référence). */
export const chargerHtml = async (chemin: string): Promise<HTMLElement> => {
  const fichier = Bun.file(chemin);
  if (!(await fichier.exists())) {
    throw new Error(`${chemin} introuvable : lancez d’abord « bun run build ».`);
  }
  return parse(await fichier.text());
};

/** Texte d’un élément sans aucun espace : compare le contenu, pas la mise en forme. */
export const texteCompact = (element: HTMLElement | null): string => {
  if (!element) throw new Error('Élément introuvable');
  return element.text.replace(/\s+/g, '');
};

/** Images d’un élément, réduites au nom de fichier (les dossiers peuvent changer). */
export const nomsImages = (element: HTMLElement): string[] =>
  element.querySelectorAll('img').map((image) => (image.getAttribute('src') ?? '').split('/').pop() ?? '');
