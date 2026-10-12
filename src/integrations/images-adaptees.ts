// Images adaptées à l’écran : après le build, chaque <img src="assets/img/…"> (PNG, JPEG ou WebP) reçoit un
// srcset de versions WebP plus petites (320 à 1600 px de large). Un téléphone télécharge alors une image à sa
// taille au lieu de l’original : une photo de 2 Mo déposée dans Page CMS n’arrive plus telle quelle sur mobile.
// - Rien à écrire dans les pages : <img src="assets/img/…" width="…" height="…"> suffit. Le src reste l’original.
// - width et height sont indispensables : sans eux, la taille affichée dépendrait du srcset. Une image sans ces
//   attributs est laissée telle quelle.
// - Les versions sont écrites dans dist/client/assets/img/_tailles/ (jamais dans public/), avec un cache dans
//   node_modules/.cache/images-adaptees pour ne pas les recalculer à chaque build.
// - sizes : celui écrit dans la page est gardé ; sinon, toute la largeur sur mobile et 600 px au-delà. Une petite
//   image (icône, vignette) doit donc donner sa largeur affichée, par exemple sizes="100px". On n’utilise pas
//   sizes="auto" : le navigateur compte alors l’image pour 300 × 150 px dans la mise en page, ce qui rétrécit
//   les images dont le conteneur s’ajuste à son contenu.
// - Ignorées : SVG, images déjà dotées d’un srcset, planches animées (anim/) et images de partage (partage/).
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import sharp from 'sharp';

/** Largeurs produites, en pixels (seules celles plus petites que l’original). */
export const LARGEURS = [320, 480, 800, 1200, 1600] as const;
const LARGEUR_MAX = LARGEURS[LARGEURS.length - 1];
const QUALITE = 78;
/** sizes par défaut : toute la largeur sur mobile (marges comprises), 600 px au-delà. */
export const TAILLES_PAR_DEFAUT = '(max-width: 700px) 100vw, 600px';
const DOSSIER_TAILLES = 'assets/img/_tailles/';

export interface Variante {
  readonly url: string;
  readonly largeur: number;
}

/** Image de public/assets/img/ à décliner : PNG, JPEG ou WebP, hors planches animées et images de partage. */
export const estAdaptable = (src: string): boolean =>
  /^\/?assets\/img\/(?!anim\/|partage\/|_tailles\/)[^?#]+\.(png|jpe?g|webp)$/i.test(src);

/** assets/img/actualites/a.png, 480 → assets/img/_tailles/actualites/a-480.webp (même forme, avec ou sans « / »). */
export const cheminVariante = (src: string, largeur: number): string =>
  src.replace(/^(\/?)assets\/img\/(.+)\.[a-z]+$/i, `$1${DOSSIER_TAILLES}$2-${largeur}.webp`);

/**
 * Versions d’une image de largeur `largeurSource` : les LARGEURS plus petites, puis l’image entière (limitée à
 * 1600 px). Un WebP pas plus large que 1600 px sert lui-même de plus grande version, sans être recompressé.
 */
export const variantes = (src: string, largeurSource: number): Variante[] => {
  const entiere = Math.min(largeurSource, LARGEUR_MAX);
  const reduites = LARGEURS.filter((largeur) => largeur < entiere).map((largeur) => ({ url: cheminVariante(src, largeur), largeur }));
  const originalSuffit = /\.webp$/i.test(src) && largeurSource <= LARGEUR_MAX;
  return [...reduites, { url: originalSuffit ? src : cheminVariante(src, entiere), largeur: entiere }];
};

const attribut = (balise: string, nom: string): string | undefined =>
  balise.match(new RegExp(`\\s${nom}="([^"]*)"`, 'i'))?.[1];

/** Ajoute srcset et sizes à une balise <img> qui a width et height, et pas encore de srcset ; sinon la rend telle quelle. */
export const adapterBalise = (balise: string, liste: ReadonlyArray<Variante>): string => {
  const dimensionnee = attribut(balise, 'width') !== undefined && attribut(balise, 'height') !== undefined;
  if (!dimensionnee || attribut(balise, 'srcset') !== undefined || liste.length < 2) return balise;
  const srcset = liste.map(({ url, largeur }) => `${url} ${largeur}w`).join(', ');
  const ajout = [` srcset="${srcset}"`];
  if (attribut(balise, 'sizes') === undefined) ajout.push(` sizes="${TAILLES_PAR_DEFAUT}"`);
  return balise.replace(/\s*\/?>$/, `${ajout.join('')}>`);
};

/** Réécrit toutes les <img> adaptables d’une page ; `liste(src)` donne les versions d’une image. */
export const adapterHtml = (html: string, liste: (src: string) => ReadonlyArray<Variante> | undefined): string =>
  html.replace(/<img\b[^>]*>/gi, (balise) => {
    const src = attribut(balise, 'src');
    const versions = src && estAdaptable(src) ? liste(src) : undefined;
    return versions ? adapterBalise(balise, versions) : balise;
  });

/** Exécute `travail` sur chaque élément, `simultanes` à la fois. */
const enParallele = async <T>(elements: ReadonlyArray<T>, simultanes: number, travail: (element: T) => Promise<void>) => {
  const file = [...elements];
  await Promise.all(Array.from({ length: simultanes }, async () => {
    for (let element = file.shift(); element !== undefined; element = file.shift()) await travail(element);
  }));
};

export const imagesAdaptees = (): AstroIntegration => {
  let pages: URL;
  let cache: URL;
  return {
    name: 'images-adaptees',
    hooks: {
      'astro:config:done': ({ config }) => {
        // L’adaptateur Vercel ne copie dist/client dans .vercel/output/static qu’après le hook astro:build:done
        // de cette intégration : les versions et les pages réécrites y sont donc publiées.
        pages = config.build.client;
        cache = new URL('node_modules/.cache/images-adaptees/', config.root);
      },
      'astro:build:done': async ({ logger }) => {
        const fichiersHtml = (await readdir(pages)).filter((fichier) => fichier.endsWith('.html'));
        const contenus = new Map(await Promise.all(fichiersHtml.map(async (fichier) =>
          [fichier, await readFile(new URL(fichier, pages), 'utf8')] as const)));

        // Images utilisées par les pages, puis leurs versions.
        const sources = new Set<string>();
        for (const html of contenus.values()) adapterHtml(html, (src) => { sources.add(src); return undefined; });
        const versions = new Map<string, Variante[]>();
        let nouvelles = 0;
        const travaux: Array<{ source: Buffer; cible: URL; largeur: number; empreinte: string }> = [];
        for (const src of sources) {
          // Le cache repère une image à son contenu : la copie dans dist/ change sa date à chaque build.
          const source = await readFile(new URL(src.replace(/^\//, ''), pages));
          const { width } = await sharp(source).metadata();
          const liste = variantes(src, width);
          if (liste.length < 2) continue;
          versions.set(src, liste);
          for (const { url, largeur } of liste) {
            if (url === src) continue;
            const empreinte = createHash('sha1').update(source).update(`|${largeur}|${QUALITE}`).digest('hex');
            travaux.push({ source, cible: new URL(url.replace(/^\//, ''), pages), largeur, empreinte });
          }
        }

        await mkdir(cache, { recursive: true });
        await enParallele(travaux, availableParallelism(), async ({ source, cible, largeur, empreinte }) => {
          const enCache = new URL(`${empreinte}.webp`, cache);
          await mkdir(dirname(fileURLToPath(cible)), { recursive: true });
          try {
            await copyFile(enCache, cible);
          } catch {
            // Écrit à côté puis renommé : un build interrompu ne laisse pas d’image tronquée dans le cache.
            const provisoire = fileURLToPath(new URL(`${empreinte}.${process.pid}.tmp`, cache));
            await sharp(source).resize({ width: largeur }).webp({ quality: QUALITE }).toFile(provisoire);
            await rename(provisoire, enCache);
            await copyFile(enCache, cible);
            nouvelles++;
          }
        });

        await Promise.all([...contenus].map(([fichier, html]) =>
          writeFile(new URL(fichier, pages), adapterHtml(html, (src) => versions.get(src)))));
        logger.info(`${versions.size} images adaptées : ${travaux.length} versions WebP (${nouvelles} calculées, le reste en cache).`);
      },
    },
  };
};
