// Collections de la page Actualités, modifiables dans Page CMS (voir .pages.yml et docs/page-cms.md).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { articleSchema, programmeSchema, rendezVousSchema, stageSchema } from './content/schemas';

export const collections = {
  programmes: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/programmes' }), schema: programmeSchema }),
  stages: defineCollection({ loader: glob({ pattern: '*.yml', base: './src/content/stages' }), schema: stageSchema }),
  rendezVous: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/rendez-vous' }), schema: rendezVousSchema }),
  articles: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/articles' }), schema: articleSchema }),
};
