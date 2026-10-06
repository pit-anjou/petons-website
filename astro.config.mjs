// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Conserve les URL actuelles : /chenilles-petons.html, /index.html…
  build: { format: 'file' },
});
