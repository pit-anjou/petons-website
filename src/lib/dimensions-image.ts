// Largeur et hauteur d’une image de public/, lues au build pour les attributs width et height.
// Une image absente fait échouer le build : Vercel garde alors la version en ligne.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';

export const dimensionsImage = async (src: string): Promise<{ width: number; height: number }> => {
  const donnees = await readFile(join(process.cwd(), 'public', src));
  const { width, height } = await imageMetadata(donnees, src);
  return { width, height };
};
